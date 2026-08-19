import { z } from "zod";
import { createDocValidationDelivery } from "../../../database/repositories/docValidationDeliveryRepository";
import { findWebhookByType } from "../../../database/repositories/webhookRepository";

const DOC_VALIDATOR_WEBHOOK_TYPE = "DOC_VALIDATOR";

interface SendDocValidationWebhookInput<T = void> {
  claCode: string;
  dvaCode: string;
  payload: Record<string, any>;
  expectedReturnSchema?: z.ZodType<T>;
}

// Envio direto, sem fila/retry: se o POST falhar (rede, timeout, resposta de erro), a tentativa
// só é registrada em doc_validation_deliveries para histórico — não há nova tentativa automática.
export async function sendDocValidationWebhook<T = void>(
  input: SendDocValidationWebhookInput<T>
): Promise<T | false> {
  const { claCode, dvaCode, payload, expectedReturnSchema } = input;

  try {
    console.log("doc validation webhook payload", payload);

    const webhook = await findWebhookByType(DOC_VALIDATOR_WEBHOOK_TYPE, claCode);

    if (!webhook) {
      console.log("webhook não configurado para", claCode);

      await createDocValidationDelivery({
        dvaCode,
        webCode: null,
        url: null,
        method: null,
        payload,
        statusCode: null,
        responseBody: null,
        success: false,
        error: `Webhook do tipo ${DOC_VALIDATOR_WEBHOOK_TYPE} não configurado para o classificador ${claCode}`,
      });

      return false;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(webhook.webHeaders ? JSON.parse(webhook.webHeaders) : {}),
    };

    const method = webhook.webMethod || "POST";
    const finalPayload = { ...payload };

    if (webhook.webFields) {
      Object.assign(finalPayload, JSON.parse(webhook.webFields));
    }

    const isBodyless = method === "DELETE" || method === "GET";

    console.log("doc validation webhook url", webhook.webUrl);
    console.log("doc validation webhook headers", headers);
    if (!isBodyless) console.log("doc validation webhook body", JSON.stringify(finalPayload));

    let statusCode: number | null = null;
    let responseText: string | null = null;
    let requestError: string | null = null;

    try {
      const response = await fetch(webhook.webUrl, {
        method,
        headers,
        ...(isBodyless ? {} : { body: JSON.stringify(finalPayload) }),
      });

      statusCode = response.status;
      responseText = await response.text();

      console.log("doc validation webhook response status", statusCode);
      console.log("doc validation webhook response", responseText);
    } catch (e: any) {
      requestError = e?.message ?? "Erro desconhecido ao enviar webhook";
    }

    const success = statusCode === 200 || statusCode === 201;

    await createDocValidationDelivery({
      dvaCode,
      webCode: webhook.webCode,
      url: webhook.webUrl,
      method,
      payload: finalPayload,
      statusCode,
      responseBody: responseText,
      success,
      error: requestError,
    });

    if (!success) return false;

    if (expectedReturnSchema) {
      const parsed = expectedReturnSchema.safeParse(
        responseText ? JSON.parse(responseText) : undefined
      );
      return parsed.success ? parsed.data : false;
    }

    return true as unknown as T;
  } catch (error) {
    console.error("Falha ao enviar webhook da doc_validation:", error);
    return false;
  }
}
