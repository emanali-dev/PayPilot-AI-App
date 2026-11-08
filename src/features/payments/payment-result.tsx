"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleAlert, CircleX, LoaderCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PaymentRequestStatus } from "@/lib/repo/types";

type PaymentResultState = PaymentRequestStatus | "loading" | "error";
type ResultBody = { status?: PaymentRequestStatus; amountMinor?: number; currency?: string; invoiceId?: string; error?: string };

export function PaymentResult({ requestId, action }: { requestId: string; action: "capture" | "cancel" }) {
  const [state, setState] = useState<PaymentResultState>(requestId ? "loading" : "error");
  const [result, setResult] = useState<ResultBody>({});
  const [error, setError] = useState(requestId ? "" : "The payment request ID is missing from this PayPal redirect.");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!requestId) return;
    const controller = new AbortController();
    async function verify() {
      setState("loading");
      setError("");
      try {
        const response = await fetch(`/api/paypal/orders/${encodeURIComponent(requestId)}/${action}`, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        const body: ResultBody = await response.json();
        if (body.status) {
          setResult(body);
          setState(body.status);
          return;
        }
        throw new Error(body.error ?? "PayPal could not verify the payment request.");
      } catch (reason) {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : "PayPal could not verify the payment request.");
          setState("error");
        }
      }
    }
    void verify();
    return () => controller.abort();
  }, [action, attempt, requestId]);

  const details = result.amountMinor !== undefined && result.currency
    ? `${formatMoney(result.amountMinor, result.currency)}${result.invoiceId ? ` · ${result.invoiceId}` : ""}`
    : "";
  const presentation = {
    loading: { icon: LoaderCircle, title: action === "capture" ? "Verifying payment" : "Checking payment status", description: action === "capture" ? "PayPilot is checking the PayPal order and will record payment only after a verified capture." : "PayPilot is checking the PayPal order before reporting it as cancelled.", tone: "text-aqua" },
    completed: { icon: CheckCircle2, title: "Payment completed", description: "PayPal confirmed the capture. The invoice and transaction have been updated.", tone: "text-success" },
    pending: { icon: CircleAlert, title: "Payment still pending", description: "PayPal has not confirmed a completed capture. The invoice has not been marked paid.", tone: "text-warning" },
    cancelled: { icon: CircleX, title: "Payment cancelled", description: "The PayPal order was not captured. The invoice remains unpaid.", tone: "text-muted-foreground" },
    failed: { icon: CircleAlert, title: "Payment failed", description: "PayPal did not complete the payment. The invoice remains unpaid.", tone: "text-danger" },
    error: { icon: CircleAlert, title: "Payment not verified", description: error || "PayPilot could not verify the PayPal order. The invoice has not been marked paid.", tone: "text-danger" },
  }[state];
  const Icon = presentation.icon;

  return (
    <Card className="mx-auto max-w-xl p-6 sm:p-8">
      <Icon className={cn("size-10", presentation.tone, state === "loading" && "animate-spin")} aria-hidden />
      <h1 className="mt-5 font-display text-2xl font-semibold">{presentation.title}</h1>
      {details && <p className="mt-2 font-medium">{details}</p>}
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{presentation.description}</p>
      {error && state === "error" && <p role="alert" className="mt-3 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      <div className="mt-6 flex flex-wrap gap-2">
        {state === "error" && requestId && <Button variant="outline" onClick={() => setAttempt((current) => current + 1)}>Retry verification</Button>}
        <Link href="/transactions" className={buttonVariants({ variant: "outline" })}>View transactions</Link>
        <Link href="/invoices" className={buttonVariants()}>Back to invoices</Link>
      </div>
    </Card>
  );
}
