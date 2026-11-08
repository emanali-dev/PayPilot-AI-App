import { NextResponse } from "next/server";
import { z } from "zod";
import { PaypalApiError } from "@/lib/paypal/client";
import { capturePaymentRequest, PaymentFlowError } from "@/lib/paypal/payments";

export const dynamic = "force-dynamic";

const requestIdSchema = z.string().uuid();

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!requestIdSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Payment request not found." }, { status: 404 });
  }
  try {
    const paymentRequest = await capturePaymentRequest(id);
    return NextResponse.json({
      status: paymentRequest.status,
      invoiceId: paymentRequest.invoiceId,
      amountMinor: paymentRequest.amountMinor,
      currency: paymentRequest.currency,
      captureId: paymentRequest.captureId,
    });
  } catch (error) {
    if (error instanceof PaymentFlowError || error instanceof PaypalApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Payment capture could not be verified. The request remains pending." }, { status: 502 });
  }
}
