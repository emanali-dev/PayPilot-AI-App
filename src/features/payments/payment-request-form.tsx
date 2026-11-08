"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/format";
import type { Client, Invoice } from "@/lib/repo/types";

const fieldClass = "mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground";

export function PaymentRequestForm({ invoices, clients, paypalConfigured }: {
  invoices: Invoice[];
  clients: Client[];
  paypalConfigured: boolean;
}) {
  const payableInvoices = invoices.filter((invoice) => invoice.status === "sent" || invoice.status === "overdue");
  const [invoiceId, setInvoiceId] = useState(payableInvoices[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [review, setReview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const clientById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);
  const invoice = payableInvoices.find((item) => item.id === invoiceId);

  async function createOrder() {
    if (!invoice) {
      setError("Select an unpaid invoice before continuing.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/paypal/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, note }),
      });
      const body: { approvalUrl?: string; error?: string } = await response.json();
      if (!response.ok || !body.approvalUrl) throw new Error(body.error ?? "PayPal did not create an approval link.");
      window.location.assign(body.approvalUrl);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The PayPal order could not be created.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card>
        <CardHeader title="Select an invoice" demo />
        <div className="space-y-4 px-5 pb-5 pt-4">
          {payableInvoices.length ? (
            <>
              <label className="block text-sm text-muted-foreground">Invoice
                <select className={fieldClass} value={invoiceId} onChange={(event) => { setInvoiceId(event.target.value); setReview(false); setError(""); }}>
                  {payableInvoices.map((item) => {
                    const client = clientById.get(item.clientId);
                    return <option key={item.id} value={item.id}>{item.number} · {client?.name ?? "Unknown client"} · {formatMoney(item.amountMinor, item.currency)}</option>;
                  })}
                </select>
              </label>
              <label className="block text-sm text-muted-foreground">Payment note (optional)
                <input className={fieldClass} maxLength={120} value={note} onChange={(event) => { setNote(event.target.value); setReview(false); }} placeholder="Add a short note for the buyer" />
              </label>
              {invoice && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/40 p-4">
                  <div><p className="font-medium">{clientById.get(invoice.clientId)?.name}</p><p className="text-sm text-muted-foreground">{invoice.number} · Due {formatDate(invoice.dueDate)}</p></div>
                  <p className="font-display text-2xl font-semibold">{formatMoney(invoice.amountMinor, invoice.currency)}</p>
                </div>
              )}
              {review ? (
                <div className="rounded-xl border border-primary/40 bg-primary/10 p-4">
                  <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-aqua" aria-hidden /><div><h2 className="font-semibold">Review payment request</h2><p className="mt-1 text-sm text-muted-foreground">You are about to create a PayPal order for {invoice ? formatMoney(invoice.amountMinor, invoice.currency) : "the selected invoice"}. PayPal will ask the buyer to approve it. The invoice is marked paid only after the server verifies a completed capture.</p></div></div>
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <Button variant="outline" onClick={() => setReview(false)} disabled={loading}>Edit request</Button>
                    <Button onClick={createOrder} disabled={loading || !paypalConfigured}>{loading ? "Creating PayPal order…" : paypalConfigured ? "Create order and continue" : "PayPal is not connected"}<ArrowRight className="size-4" aria-hidden /></Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end"><Button onClick={() => { setError(""); setReview(true); }}>Review payment request</Button></div>
              )}
              {!paypalConfigured && <p className="text-sm text-warning">PayPal Sandbox credentials are not configured. No order will be created.</p>}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{invoices.length ? "There are no sent or overdue invoices available for payment." : "Create an invoice before requesting a payment."}</p>
          )}
          {error && <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
          <p className="text-xs leading-relaxed text-muted-foreground">The invoice and client are demo records. A real PayPal Sandbox transaction is created only after you confirm the review above. No live PayPal credentials are used by the browser.</p>
        </div>
      </Card>
    </div>
  );
}
