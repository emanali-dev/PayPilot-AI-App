import "server-only";
import { z } from "zod";
import { getEnv } from "@/lib/env";

const credentialsSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().positive(),
});

const orderSchema = z.object({
  id: z.string().min(1),
  status: z.string().optional(),
  links: z.array(z.object({ href: z.string().url(), rel: z.string() })).optional(),
  purchase_units: z.array(z.object({
    reference_id: z.string().optional(),
    custom_id: z.string().optional(),
    amount: z.object({ currency_code: z.string(), value: z.string() }).optional(),
    payments: z.object({
      captures: z.array(z.object({
        id: z.string().optional(),
        status: z.string().optional(),
        amount: z.object({ currency_code: z.string(), value: z.string() }).optional(),
      })).optional(),
    }).optional(),
  }).passthrough()).optional(),
}).passthrough();

export type PaypalOrder = z.infer<typeof orderSchema>;

type TokenCache = { accessToken: string; expiresAt: number } | null;
type PaypalGlobal = typeof globalThis & {
  __paypilotPaypalToken?: TokenCache;
  __paypilotPaypalTokenRequest?: Promise<string>;
};

export class PaypalApiError extends Error {
  constructor(message: string, readonly status: number, readonly retryable: boolean) {
    super(message);
    this.name = "PaypalApiError";
  }
}

function getPaypalBaseUrl() {
  return getEnv().PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function isPaypalConfigured() {
  const env = getEnv();
  return Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET);
}

async function requestAccessToken(): Promise<string> {
  const env = getEnv();
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw new PaypalApiError("PayPal is not configured. Add server-side PayPal client credentials.", 503, false);
  }

  const credentials = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  let response: Response;
  try {
    response = await fetch(`${getPaypalBaseUrl()}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
  } catch {
    throw new PaypalApiError("Could not reach PayPal to authenticate.", 502, true);
  }

  if (!response.ok) {
    throw new PaypalApiError(`PayPal authentication failed (HTTP ${response.status}).`, response.status, response.status >= 500);
  }
  const parsed = credentialsSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new PaypalApiError("PayPal returned an invalid OAuth token response.", 502, true);

  const cache = (globalThis as PaypalGlobal);
  cache.__paypilotPaypalToken = {
    accessToken: parsed.data.access_token,
    expiresAt: Date.now() + parsed.data.expires_in * 1000,
  };
  return parsed.data.access_token;
}

async function getAccessToken() {
  const cache = globalThis as PaypalGlobal;
  if (cache.__paypilotPaypalToken && cache.__paypilotPaypalToken.expiresAt > Date.now() + 30000) {
    return cache.__paypilotPaypalToken.accessToken;
  }
  if (!cache.__paypilotPaypalTokenRequest) {
    cache.__paypilotPaypalTokenRequest = requestAccessToken().finally(() => {
      delete cache.__paypilotPaypalTokenRequest;
    });
  }
  return cache.__paypilotPaypalTokenRequest;
}

async function paypalRequest(path: string, init: RequestInit = {}) {
  const accessToken = await getAccessToken();
  let response: Response;
  try {
    response = await fetch(`${getPaypalBaseUrl()}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      signal: init.signal ?? AbortSignal.timeout(20000),
      cache: "no-store",
    });
  } catch {
    throw new PaypalApiError("Could not reach PayPal.", 502, true);
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new PaypalApiError(
      `PayPal request failed (HTTP ${response.status}).`,
      response.status,
      response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500,
    );
  }
  return payload;
}

function parseOrder(payload: unknown): PaypalOrder {
  const parsed = orderSchema.safeParse(payload);
  if (!parsed.success) throw new PaypalApiError("PayPal returned an invalid order response.", 502, true);
  return parsed.data;
}

function formatAmount(amountMinor: number) {
  return (amountMinor / 100).toFixed(2);
}

function getApprovalUrl(order: PaypalOrder) {
  const link = order.links?.find((item) => item.rel === "approve" || item.rel === "payer-action");
  if (!link) throw new PaypalApiError("PayPal did not return a buyer approval link.", 502, false);
  const approvalUrl = new URL(link.href);
  const paypalHost = getEnv().PAYPAL_ENV === "live" ? "www.paypal.com" : "www.sandbox.paypal.com";
  if (approvalUrl.protocol !== "https:" || approvalUrl.hostname !== paypalHost) {
    throw new PaypalApiError("PayPal returned an unsafe buyer approval link.", 502, false);
  }
  return approvalUrl.toString();
}

export async function createPaypalOrder(input: {
  requestId: string;
  invoiceNumber: string;
  amountMinor: number;
  currency: string;
  note: string;
  appUrl: string;
}) {
  const appUrl = new URL(input.appUrl);
  const order = parseOrder(await paypalRequest("/v2/checkout/orders", {
    method: "POST",
    headers: { "PayPal-Request-Id": input.requestId },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: input.invoiceNumber,
        custom_id: input.requestId,
        description: input.note || `Payment for ${input.invoiceNumber}`,
        amount: { currency_code: input.currency, value: formatAmount(input.amountMinor) },
      }],
      application_context: {
        return_url: new URL(`/pay/return?requestId=${encodeURIComponent(input.requestId)}`, appUrl).toString(),
        cancel_url: new URL(`/pay/cancel?requestId=${encodeURIComponent(input.requestId)}`, appUrl).toString(),
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
      },
    }),
  }));
  return { order, approvalUrl: getApprovalUrl(order) };
}

export async function getPaypalOrder(orderId: string) {
  const payload = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: { Prefer: "return=representation" },
  });
  return parseOrder(payload);
}

export async function capturePaypalOrder(orderId: string, requestId: string) {
  const payload = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: {
      "PayPal-Request-Id": requestId,
      Prefer: "return=representation",
    },
    body: JSON.stringify({}),
  });
  return parseOrder(payload);
}
