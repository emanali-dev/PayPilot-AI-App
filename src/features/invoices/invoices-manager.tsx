"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/format";
import type { Client, Invoice } from "@/lib/repo/types";

const lineItemSchema = z.object({
  description: z.string().trim().min(1, "Enter a line item description.").max(160),
  quantity: z.string().regex(/^\d+$/, "Quantity must be a whole number.").transform(Number).pipe(z.number().int().min(1).max(1000)),
  unitAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter an amount with up to two decimal places.")
    .transform((value) => Math.round(Number(value) * 100)).pipe(z.number().int().positive().max(100_000_000)),
});

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Select a client."),
  currency: z.enum(["USD", "EUR", "GBP"]),
  dueDate: z.string().date("Select a valid due date."),
  lineItems: z.array(lineItemSchema).min(1, "Add at least one line item.").max(20),
});

type DraftItem = { description: string; quantity: string; unitAmount: string };
const emptyItem = (): DraftItem => ({ description: "", quantity: "1", unitAmount: "" });
const inputClass = "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground";
const statusTone: Record<Invoice["status"], "success" | "warning" | "danger" | "neutral"> = {
  paid: "success",
  sent: "warning",
  draft: "neutral",
  overdue: "danger",
  void: "neutral",
};

export function InvoicesManager({ initialInvoices, clients }: { initialInvoices: Invoice[]; clients: Client[] }) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [clientId, setClientId] = useState("all");
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [creating, setCreating] = useState(false);
  const clientById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);
  const visibleInvoices = invoices.filter((invoice) => {
    const client = clientById.get(invoice.clientId);
    const matchesQuery = `${invoice.number} ${client?.name ?? ""}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (status === "all" || invoice.status === status) && (clientId === "all" || invoice.clientId === clientId);
  });

  return (
    <>
      <Card>
        <CardHeader title="Invoice directory" demo action={<Button onClick={() => setCreating(true)}>New invoice</Button>} />
        <div className="grid gap-3 px-5 pb-4 pt-5 sm:grid-cols-3">
          <label className="text-sm text-muted-foreground">Search
            <input className={`${inputClass} mt-1`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Invoice or client" />
          </label>
          <label className="text-sm text-muted-foreground">Status
            <select className={`${inputClass} mt-1`} value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All statuses</option>
              {(["draft", "sent", "paid", "overdue", "void"] as const).map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-sm text-muted-foreground">Client
            <select className={`${inputClass} mt-1`} value={clientId} onChange={(event) => setClientId(event.target.value)}>
              <option value="all">All clients</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </label>
        </div>
        {visibleInvoices.length ? (
          <div className="overflow-x-auto px-2 pb-3">
            <table className="w-full min-w-[650px] text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground">
                {["Invoice", "Client", "Issue date", "Due date", "Amount", "Status"].map((heading) => <th key={heading} className={`px-3 py-2 font-medium ${heading === "Amount" ? "text-right" : ""}`}>{heading}</th>)}
              </tr></thead>
              <tbody>
                {visibleInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-border">
                    <td className="px-3 py-3"><button className="font-medium text-aqua hover:underline" onClick={() => setSelected(invoice)}>{invoice.number}</button></td>
                    <td className="px-3 py-3 text-muted-foreground">{clientById.get(invoice.clientId)?.name ?? "Unknown client"}</td>
                    <td className="px-3 py-3 text-muted-foreground">{formatDate(invoice.issueDate)}</td>
                    <td className="px-3 py-3 text-muted-foreground">{formatDate(invoice.dueDate)}</td>
                    <td className="px-3 py-3 text-right font-medium">{formatMoney(invoice.amountMinor, invoice.currency)}</td>
                    <td className="px-3 py-3"><Badge tone={statusTone[invoice.status]}>{invoice.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-sm text-muted-foreground">{invoices.length ? "No invoices match these filters." : "No invoices yet. Create one to get started."}</p>
        )}
      </Card>
      {selected && <InvoiceDetails invoice={selected} client={clientById.get(selected.clientId)} onClose={() => setSelected(null)} />}
      {creating && <NewInvoiceDialog clients={clients} onClose={() => setCreating(false)} onCreated={(invoice) => { setInvoices((current) => [invoice, ...current]); setCreating(false); setSelected(invoice); }} />}
    </>
  );
}

function InvoiceDetails({ invoice, client, onClose }: { invoice: Invoice; client?: Client; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="invoice-detail-title" className="h-full w-full max-w-lg overflow-y-auto border-l border-border bg-card p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-sm text-muted-foreground">Invoice details</p><h2 id="invoice-detail-title" className="font-display text-2xl font-semibold">{invoice.number}</h2></div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-border bg-background/40 p-4 text-sm">
          <div><p className="text-muted-foreground">Client</p><p className="mt-1 font-medium">{client?.name ?? "Unknown client"}</p><p className="text-muted-foreground">{client?.email}</p></div>
          <div><p className="text-muted-foreground">Status</p><div className="mt-1"><Badge tone={statusTone[invoice.status]}>{invoice.status}</Badge></div></div>
          <div><p className="text-muted-foreground">Issue date</p><p className="mt-1">{formatDate(invoice.issueDate)}</p></div>
          <div><p className="text-muted-foreground">Due date</p><p className="mt-1">{formatDate(invoice.dueDate)}</p></div>
        </div>
        <h3 className="mt-7 font-semibold">Line items</h3>
        <ul className="mt-3 divide-y divide-border">
          {invoice.lineItems.map((item, index) => (
            <li key={`${item.description}-${index}`} className="flex justify-between gap-4 py-3 text-sm">
              <div><p className="font-medium">{item.description}</p><p className="text-muted-foreground">{item.quantity} × {formatMoney(item.unitAmountMinor, invoice.currency)}</p></div>
              <p>{formatMoney(item.amountMinor, invoice.currency)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-border pt-4 font-semibold"><span>Total</span><span>{formatMoney(invoice.amountMinor, invoice.currency)}</span></div>
      </section>
    </div>
  );
}

function NewInvoiceDialog({ clients, onClose, onCreated }: { clients: Client[]; onClose: () => void; onCreated: (invoice: Invoice) => void }) {
  const [clientId, setClientId] = useState("");
  const [currency, setCurrency] = useState<"USD" | "EUR" | "GBP">("USD");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const savedCurrency = window.localStorage.getItem("paypilot-currency");
      if (savedCurrency === "USD" || savedCurrency === "EUR" || savedCurrency === "GBP") setCurrency(savedCurrency);
    } catch {
      setError("Could not read the preferred currency from browser storage.");
    }
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const parsed = invoiceSchema.safeParse({ clientId, currency, dueDate, lineItems: items });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the invoice details and try again.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: parsed.data.clientId,
          currency: parsed.data.currency,
          dueDate: parsed.data.dueDate,
          lineItems: parsed.data.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitAmountMinor: item.unitAmount,
          })),
        }),
      });
      const body: { invoice?: Invoice; error?: string } = await response.json();
      if (!response.ok || !body.invoice) throw new Error(body.error ?? "Invoice creation failed.");
      onCreated(body.invoice);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Invoice creation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="new-invoice-title" className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-4"><div><p className="text-sm text-muted-foreground">Demo invoice</p><h2 id="new-invoice-title" className="font-display text-2xl font-semibold">New invoice</h2></div><Button variant="outline" onClick={onClose}>Close</Button></div>
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-muted-foreground">Client
              <select required className={`${inputClass} mt-1`} value={clientId} onChange={(event) => setClientId(event.target.value)}>
                <option value="">Select a client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </label>
            <label className="text-sm text-muted-foreground">Currency
              <select className={`${inputClass} mt-1`} value={currency} onChange={(event) => setCurrency(event.target.value as typeof currency)}>
                {["USD", "EUR", "GBP"].map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-sm text-muted-foreground sm:col-span-2">Due date
              <input required type="date" className={`${inputClass} mt-1`} value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </label>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">Line items</h3><Button type="button" variant="outline" size="sm" onClick={() => setItems((current) => [...current, emptyItem()])} disabled={items.length >= 20}>Add line</Button></div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[minmax(0,1fr)_90px_130px_auto]">
                  <label className="text-xs text-muted-foreground">Description<input className={`${inputClass} mt-1`} value={item.description} onChange={(event) => setItems((rows) => rows.map((row, i) => i === index ? { ...row, description: event.target.value } : row))} /></label>
                  <label className="text-xs text-muted-foreground">Qty<input type="number" min="1" step="1" className={`${inputClass} mt-1`} value={item.quantity} onChange={(event) => setItems((rows) => rows.map((row, i) => i === index ? { ...row, quantity: event.target.value } : row))} /></label>
                  <label className="text-xs text-muted-foreground">Unit amount<input type="number" min="0.01" step="0.01" className={`${inputClass} mt-1`} value={item.unitAmount} onChange={(event) => setItems((rows) => rows.map((row, i) => i === index ? { ...row, unitAmount: event.target.value } : row))} /></label>
                  {items.length > 1 && <Button className="self-end" type="button" variant="ghost" size="sm" aria-label={`Remove line ${index + 1}`} onClick={() => setItems((rows) => rows.filter((_, i) => i !== index))}>Remove</Button>}
                </div>
              ))}
            </div>
          </div>
          {error && <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create invoice"}</Button></div>
          <p className="text-xs text-muted-foreground">This creates a draft in the in-memory demo store for this server session; it does not send an invoice.</p>
        </form>
      </section>
    </div>
  );
}
