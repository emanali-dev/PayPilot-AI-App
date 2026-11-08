import "server-only";
import { getPaypalOrder, capturePaypalOrder, type PaypalOrder } from "@/lib/paypal/client";
import { demoRepository } from "@/lib/repo/demo";
import type { PaymentRequest } from "@/lib/repo/types";

export class PaymentFlowError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "PaymentFlowError";
  }
}

type PaymentOperation = (requestId: string) => Promise<PaymentRequest>;
const inFlight = new Map<string, Promise<PaymentRequest>>();

async function withPaymentLock(requestId: string, operation: PaymentOperation) {
  const active = inFlight.get(requestId);
  if (active) return active;
  const current = operation(requestId).finally(() => inFlight.delete(requestId));
  inFlight.set(requestId, current);
  return current;
}

function captureFromOrder(order: PaypalOrder, request: PaymentRequest) {
  if (order.id !== request.paypalOrderId) {
    throw new PaymentFlowError("The PayPal order does not match this payment request.", 409);
  }
  const unit = order.purchase_units?.find((purchaseUnit) =>
    purchaseUnit.custom_id === request.id && purchaseUnit.reference_id === request.invoiceId,
  );
  const capture = unit?.payments?.captures?.find((item) => item.status === "COMPLETED");
  if (!unit || !capture?.id || !unit.amount || !capture.amount) {
    throw new PaymentFlowError("PayPal has not returned a completed capture for this invoice.", 409);
  }
  const expectedValue = (request.amountMinor / 100).toFixed(2);
  if (
    unit.amount.currency_code !== request.currency
    || unit.amount.value !== expectedValue
    || capture.amount.currency_code !== request.currency
    || capture.amount.value !== expectedValue
  ) {
    throw new PaymentFlowError("The captured amount or currency does not match the invoice. The payment remains pending for review.", 409);
  }
  return capture.id;
}

async function captureUnlocked(requestId: string) {
  let request = await demoRepository.getPaymentRequest(requestId);
  if (!request) throw new PaymentFlowError("Payment request not found.", 404);
  if (request.status !== "pending") return request;
  if (!request.paypalOrderId) throw new PaymentFlowError("This payment request has no PayPal order.", 409);

  let order = await getPaypalOrder(request.paypalOrderId);
  if (order.status === "VOIDED") {
    return demoRepository.updatePaymentRequest(request.id, "cancelled");
  }
  if (order.status !== "COMPLETED") {
    if (order.status !== "APPROVED") {
      throw new PaymentFlowError("The PayPal order has not been approved by the buyer.", 409);
    }
    try {
      order = await capturePaypalOrder(request.paypalOrderId, request.captureRequestId);
    } catch (error) {
      const currentOrder = await getPaypalOrder(request.paypalOrderId);
      if (currentOrder.status !== "COMPLETED") throw error;
      order = currentOrder;
    }
  }
  if (order.status !== "COMPLETED") {
    const captureStatus = order.purchase_units?.flatMap((unit) => unit.payments?.captures ?? [])
      .find((capture) => capture.status === "DENIED");
    if (captureStatus) {
      request = await demoRepository.updatePaymentRequest(request.id, "failed");
      return request;
    }
    throw new PaymentFlowError("PayPal has not confirmed a completed capture. This request remains pending.", 409);
  }

  const captureId = captureFromOrder(order, request);
  return demoRepository.updatePaymentRequest(request.id, "completed", captureId);
}

export function capturePaymentRequest(requestId: string) {
  return withPaymentLock(requestId, captureUnlocked);
}

export function cancelPaymentRequest(requestId: string) {
  return withPaymentLock(requestId, async (id) => {
    const request = await demoRepository.getPaymentRequest(id);
    if (!request) throw new PaymentFlowError("Payment request not found.", 404);
    if (request.status !== "pending") return request;
    if (!request.paypalOrderId) {
      throw new PaymentFlowError("PayPal has not created an order for this request yet.", 409);
    }
    const order = await getPaypalOrder(request.paypalOrderId);
    if (order.status === "COMPLETED") return captureUnlocked(id);
    return demoRepository.updatePaymentRequest(id, "cancelled");
  });
}
