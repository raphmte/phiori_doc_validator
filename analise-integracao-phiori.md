# Análise: onde o phiori está apto a receber os dados do doc_validator

> Escrito em 2026-09-16. Responde à pergunta "onde o phiori está apto a
> receber as informações que o worker de integração (`sendToPhiori.ts`) vai
> enviar". É análise, não implementação — nenhum código foi alterado.

> **Atualização de 2026-09-18 — esta análise foi superada pela implementação.**
> Foi escolhido o caminho 2 da recomendação, com um corpo próprio por trader: o
> phiori ganhou a trader **COFCO** (`source: 'provided'`), cujo corpo de
> `POST /api/v1/shipments` é `{ externalId, grossWeightKg, netWeightKg,
> invoiceAccessKeys }` — sem `transmissionSequenceId`/`loadOrderId`, que só a
> Bunge exige. O `sendToPhiori.ts` deixou de ser stub e manda esse corpo com
> `trader: "cofco"`. O desenho e o que **não** foi verificado estão em
> `docs/superpowers/specs/2026-09-18-integracao-cofco-design.md` no repositório
> do phiori. O restante do documento fica como registro do que se sabia antes.

## Contexto

O `doc_validator` tem o início de um worker
(`src/workers/runIntegrationJobs.ts` → `processIntegrationJob.ts` →
`integrationDispatcher.ts`) que, após uma validação de documento bem-sucedida,
deveria enviar o resultado para o phiori (projeto irmão, cargo-gateway). O
sender real (`src/modules/integrations/providers/sendToPhiori.ts`) é hoje um
**stub proposital** que sempre lança erro, com comentário apontando para uma
spec de design do lado do phiori como fonte do contrato ainda não definido
(URL/autenticação/schema).

## Achado 1 — o mecanismo de entrada do phiori existe e está pronto

O phiori tem um único endpoint de ingestão externa server-to-server:
**`POST /api/v1/shipments`** (`api/src/modules/shipments/routes.ts` no repo
`phiori`) — exatamente o que o comentário do stub referencia. Está em
produção desde 2026-09-08 (branch `shipmentIntake`, mergeada) e é maduro:

- **Auth:** `Authorization: Bearer phi_<prefix>_<secret>`, token vinculado à
  **controladora** (não a um usuário — não morre quando alguém é desligado),
  hash Argon2, com **escopo por token** (`shipments.write`, `shipments.read`,
  `webhooks.*`, `documents.read`). Minerado só por um admin via rota interna;
  entregue em texto puro **uma única vez**. Não existe hoje nenhum token
  minerado para o `doc_validator` como cliente, nem variável `PHIORI_*` no
  `.env`/`.env.example` dele.
- **Idempotência:** header `Idempotency-Key` obrigatório por chamador; mesma
  chave + mesmo corpo devolve a mesma resposta; mesma chave + corpo diferente
  é `409`.
- **A rota não transmite na hora** — grava a intenção (`core_requests`) e um
  worker despacha depois; resposta imediata é só "aceito", o desfecho real
  vem por `GET /api/v1/shipments/{id}` ou por webhook assinado (HMAC).
- Corpo: `{ trader: string, shipment: <schema específico do trader> }`. Só
  `"bunge"` está implementada hoje.

**Conclusão do achado 1:** se a pergunta fosse só "o phiori consegue receber
uma chamada HTTP autenticada e idempotente de outro sistema hoje?" — sim, e o
padrão (token por controladora, escopo, idempotência, webhook de retorno) é
maduro e documentado em `docs/api/public/integracao-erp.md` (repo `phiori`).

## Achado 2 — o payload do doc_validator não encaixa no contrato existente

Este é o motivo real de o stub estar parado — "ainda não foi definido" no
comentário é literal, não procrastinação:

1. **Falta a referência que a rota exige.** `POST /api/v1/shipments` só
   aceita uma carga que **já existe** no phiori, referenciada por
   `transmissionSequenceId` + `loadOrderId` (trazidos por uma varredura
   prévia do PDA). O `doc_validator` **não tem esses dois campos em lugar
   nenhum** do seu modelo (`src/modules/docValidation/declaredDataSchema.ts`
   só tem `contract`, `plate`, `invoiceRecipientName/Document`;
   `src/modules/docValidation/types.ts` não menciona
   `transmissionSequenceId`). Sem eles, não há corpo válido para montar.
2. **O vocabulário de `fields` é fechado e a sobreposição é parcial.** O
   schema `BungeShipmentIntake` (`api/openapi.yaml` no repo `phiori`) só
   aceita ~34 chaves nomeadas (`licensePlate`, `tareWeight`,
   `invoiceAccessKey`, `invoiceIssueDate`, `invoiceTotalValue`, `driverCode`,
   etc.). Comparando com o que o `doc_validator` valida e produz
   (`grossWeightKg`, `tareWeightKg`, `netWeightKg`, `driverName`,
   `driverDocument`, `driverPhone`, `invoiceRecipientName/Document`,
   `invoiceSenderName/Document`, `invoiceUnitValue`, `accessKey`...): só uns
   4 a 5 campos têm correspondente plausível (placa, tara, chave de acesso,
   data e valor total da nota — mesmo assim com nomes diferentes); o resto
   (peso bruto, peso líquido, nome/CPF/telefone do motorista, remetente e
   valor unitário da nota) **não tem onde ir** nesse vocabulário hoje.
3. **É uma diferença de paradigma reconhecida no próprio phiori.**
   `docs/api/internal/sintese.md` (linha 53, tabela comparativa com o sistema
   TarQ, repo `phiori`) marca explicitamente "Validação fiscal por IA" como
   **`≠` — fora do paradigma do phiori**: "Nossa validação é conferência
   humana na tela técnica — instrumento da etapa 1, não IA." Ou seja, o
   kernel do phiori não tem hoje um conceito de "resultado de validação por
   IA vindo de fora" — só sabe de dados que um ERP manda para faturar uma
   carga já conhecida.

## Resposta direta à pergunta

**O phiori está apto a receber chamadas HTTP autenticadas e idempotentes hoje
(o mecanismo existe e é o mesmo padrão documentado para ERPs), mas não está
apto a receber o *conteúdo* que o `doc_validator` produz, porque:**

- falta a identidade da carga (`transmissionSequenceId`/`loadOrderId`) no
  lado do `doc_validator`;
- boa parte dos campos validados não tem campo de destino no contrato atual
  (`BungeShipmentIntake.fields`);
- e o phiori nunca modelou "validação por IA externa" como conceito de
  domínio — isso precisa ser uma decisão de design (do "dono"), não uma
  dedução de código.

## Recomendação (para decisão do dono, antes de tocar em código)

Três caminhos possíveis, sem escolher por conta própria:

1. **Reaproveitar `POST /api/v1/shipments` como está.** O `doc_validator`
   passaria a atuar como "o ERP": só mandaria os poucos campos que batem
   (placa, chave de acesso, data/valor da nota, tara), e precisaria primeiro
   resolver de onde tirar `transmissionSequenceId`/`loadOrderId`
   (provavelmente já existem em algum lugar do fluxo que gera o `dvaCode`,
   mas não estão no payload de validação hoje).
2. **Estender o vocabulário/endpoint** para acomodar os campos que hoje não
   têm destino (peso bruto/líquido, dados do motorista, remetente, valor
   unitário) — mudança de contrato do lado do phiori, seguindo o guia
   `docs/api/internal/novo-provider.md` ou uma nova seção da
   `BungeShipmentIntake`.
3. **Um endpoint/conceito novo**, não amarrado a "shipment intake", para
   representar "resultado de validação de documento" como um dado próprio —
   o que rompe com a premissa da §10 da spec original ("o provider não
   conhece o ERP, o ERP não conhece o provider") e provavelmente exige uma
   spec nova.

## Fontes consultadas

- `doc_validator/src/workers/runIntegrationJobs.ts`,
  `processIntegrationJob.ts`, `src/modules/integrations/*`,
  `src/database/migrations/023_create_doc_validation_integrations.sql`
- `doc_validator/src/modules/docValidation/declaredDataSchema.ts`,
  `types.ts`
- `phiori/api/src/modules/shipments/routes.ts`, `schemas.ts`
- `phiori/api/src/core/auth.ts`, `integration-tokens.ts`
- `phiori/api/openapi.yaml` (schema `BungeShipmentIntake`)
- `phiori/docs/api/public/integracao-erp.md`
- `phiori/docs/superpowers/specs/2026-09-03-api-publica-de-entrada-design.md`
- `phiori/docs/api/internal/sintese.md`
- `phiori/CLAUDE.md`, `phiori/README.md`
