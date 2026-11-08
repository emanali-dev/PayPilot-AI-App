import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { createPaypalOrder, isPaypalConfigured, PaypalApiError } from "@/lib/paypal/client";
import { demoRepository } from "@/lib/repo/demo";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  invoiceId: z.string().trim().min(1).max(64),
  note: z.string().trim().max(120).default(""),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payment request details are invalid.", issues: parsed.error.issues }, { status: 400 });
  }
  if (!isPaypalConfigured()) {
    return NextResponse.json({ error: "PayPal is not connected. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET on the server." }, { status: 503 });
  }

  let paymentRequestId: string | null = null;
  try {
    const paymentRequest = await demoRepository.createPaymentRequest(parsed.data);
    paymentRequestId = paymentRequest.id;
    if (paymentRequest.status !== "pending") {
      return NextResponse.json({ error: `This payment request is ${paymentRequest.status}.` }, { status: 409 });
    }
    if (paymentRequest.paypalOrderId && paymentRequest.approvalUrl) {
      return NextResponse.json({
        requestId: paymentRequest.id,
        approvalUrl: paymentRequest.approvalUrl,
        amountMinor: paymentRequest.amountMinor,
        currency: paymentRequest.currency,
      });
    }

    const invoice = (await demoRepository.getInvoices()).find((item) => item.id === paymentRequest.invoiceId);
    if (!invoice) throw new Error("The invoice for this payment request no longer exists.");
    const { order, approvalUrl } = await createPaypalOrder({
      requestId: paymentRequest.id,
      invoiceNumber: invoice.number,
      amountMinor: paymentRequest.amountMinor,
      currency: paymentRequest.currency,
      note: paymentRequest.note,
      appUrl: getEnv().NEXT_PUBLIC_APP_URL,
    });
    if (order.status !== "CREATED" && order.status !== "PAYER_ACTION_REQUIRED") {
      throw new PaypalApiError("PayPal did not create an order that is ready for buyer approval.", 502, false);
    }
    const stored = await demoRepository.attachPayPalOrder(paymentRequest.id, order.id, approvalUrl);
    return NextResponse.json({
      requestId: stored.id,
      approvalUrl: stored.approvalUrl,
      amountMinor: stored.amountMinor,
      currency: stored.currency,
    }, { status: 201 });
  } catch (error) {
    if (paymentRequestId && error instanceof PaypalApiError && !error.retryable) {
      await demoRepository.updatePaymentRequest(paymentRequestId, "failed");
    }
    if (error instanceof PaypalApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "The PayPal order could not be created.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
