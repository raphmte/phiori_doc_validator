import { findDeclaredDataByDvaCode } from "../../../database/repositories/docValidationDeclaredDataRepository";
import { findExtractedDocumentsByDvaCode } from "../../../database/repositories/docValidationExtractedDocumentRepository";
import { findDocValidationByCode } from "../../../database/repositories/docValidationRepository";
import { findDocValidationResultByDvaCode } from "../../../database/repositories/docValidationResultRepository";
import { buildWebhookPayload } from "../../../workers/docValidationJob/webhookPayload";
import { PhioriTrader } from "./phioriTraders";

// Chave de acesso de NF-e: 44 dígitos.
const ACCESS_KEY_LENGTH = 44;

// O sender roda em série no loop de integrações (runIntegrationJobs): sem teto, um PHIORI que não
// responde seguraria todos os jobs atrás dele.
const REQUEST_TIMEOUT_MS = 15_000;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variável de ambiente ${name} não configurada (necessária para o envio ao PHIORI)`);
  }
  return value;
}

// A IA às vezes devolve a chave como aparece impressa na DANFE (grupos de 4 dígitos separados por
// espaço). O PHIORI só aceita os 44 dígitos sem pontuação, então normaliza aqui — mas uma chave
// que, mesmo limpa, não tenha 44 dígitos é dado ruim da extração e NÃO é descartada em silêncio:
// mandar as outras notas e omitir esta entregaria uma carga incompleta como se estivesse completa.
function normalizeAccessKeys(accessKeys: string[]): string[] {
  const normalized = accessKeys.map((accessKey) => {
    const digits = accessKey.replace(/\D/g, "");
    if (digits.length !== ACCESS_KEY_LENGTH) {
      throw new Error(
        `Chave de acesso inválida para envio ao PHIORI: "${accessKey}" não tem ${ACCESS_KEY_LENGTH} dígitos`
      );
    }
    return digits;
  });

  // Ordenadas e sem repetição: o corpo precisa ser IDÊNTICO entre tentativas (o PHIORI responde 409
  // a mesma Idempotency-Key com corpo diferente) e a lista não pode ter repetidas (400).
  return [...new Set(normalized)].sort();
}

function requiredWeight(value: unknown, label: string, dvaCode: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(
      `${label} indisponível na validação ${dvaCode}: nem o ticket de balança nem a nota fiscal trouxeram o valor`
    );
  }
  // Soma de vários tickets em ponto flutuante (30000.000000000004): arredonda a 3 casas, e o mesmo
  // valor sempre gera o mesmo corpo.
  return Math.round(value * 1000) / 1000;
}

// O corpo abaixo ("provided": pesos + chaves das notas) só existe para a COFCO hoje. Uma trader
// nova cadastrada em PHIORI_TRADERS (intake) sem corpo implementado aqui cairia num payload
// errado em silêncio se isto fosse só um cast — por isso a checagem explícita.
function requireSupportedTraderBody(trader: string, dvaCode: string): PhioriTrader {
  if (trader !== "cofco") {
    throw new Error(
      `Não há corpo de shipment implementado para a trader "${trader}" (doc_validation ${dvaCode})`,
    );
  }
  return trader;
}

async function buildShipmentBody(dvaCode: string, trader: string) {
  const supportedTrader = requireSupportedTraderBody(trader, dvaCode);

  const declaredData = await findDeclaredDataByDvaCode(dvaCode);
  if (!declaredData) {
    throw new Error(`Dados declarados da doc_validation ${dvaCode} não encontrados para envio ao PHIORI`);
  }

  const result = await findDocValidationResultByDvaCode(dvaCode);
  if (!result) {
    throw new Error(`Resultado da doc_validation ${dvaCode} não encontrado para envio ao PHIORI`);
  }

  const extraction = await findExtractedDocumentsByDvaCode(dvaCode);

  // Reusa o cálculo do webhook do cliente: peso bruto/líquido = soma dos tickets de balança (o peso
  // aferido), com a nota fiscal e a ordem de carregamento como fallback. Um segundo cálculo aqui
  // divergiria do que o cliente já recebe.
  const payload = buildWebhookPayload(extraction, declaredData, result.matchedInvoice);

  const grossWeightKg = requiredWeight(payload.grossWeightKg, "Peso bruto", dvaCode);
  const netWeightKg = requiredWeight(payload.netWeightKg, "Peso líquido", dvaCode);

  // As notas VALIDADAS (as do destinatário declarado), e não todas as que estavam no PDF.
  const invoiceAccessKeys = normalizeAccessKeys(result.matchedInvoice.accessKeys);
  if (!invoiceAccessKeys.length) {
    throw new Error(`Nenhuma chave de acesso validada na doc_validation ${dvaCode} para enviar ao PHIORI`);
  }

  // A ORDEM DAS CHAVES É FIXA de propósito: o PHIORI calcula o hash do corpo serializado.
  return {
    trader: supportedTrader,
    shipment: {
      externalId: dvaCode,
      grossWeightKg,
      netWeightKg,
      invoiceAccessKeys,
    },
  };
}

function describeResponseError(text: string): string {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed?.error === "string") return parsed.error;
  } catch {
    // corpo que não é JSON: cai no texto cru abaixo
  }
  return text.slice(0, 300) || "sem corpo na resposta";
}

// Envia ao PHIORI (POST /api/v1/shipments) o resultado de uma validação bem-sucedida. LANÇA em
// qualquer falha: é o que faz processIntegrationJob registrar dinLastError e tentar de novo.
//
// A Idempotency-Key é derivada do dvaCode, então repetir a chamada (retry, ou um 200 que se perdeu
// na rede) devolve a mesma carga em vez de criar outra: o PHIORI responde 202 na primeira vez e 200
// nas repetições, e as duas são sucesso.
export async function sendToPhiori(dvaCode: string): Promise<void> {
  const docValidation = await findDocValidationByCode(dvaCode);

  if (!docValidation) {
    throw new Error(`doc_validation ${dvaCode} não encontrada para envio ao PHIORI`);
  }

  const baseUrl = requiredEnv("PHIORI_BASE_URL").replace(/\/+$/, "");
  const token = requiredEnv("PHIORI_API_TOKEN");
  const body = await buildShipmentBody(dvaCode, docValidation.dvaTrader);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1/shipments`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        "idempotency-key": `doc-validator:${dvaCode}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (e: any) {
    throw new Error(`Falha ao chamar o PHIORI: ${e?.message ?? e}`);
  }

  if (response.status === 200 || response.status === 202) return;

  const text = await response.text().catch(() => "");
  throw new Error(`PHIORI recusou o envio (HTTP ${response.status}): ${describeResponseError(text)}`);
}
