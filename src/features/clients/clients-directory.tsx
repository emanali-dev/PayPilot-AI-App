"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/format";
import type { Client, Invoice, Transaction } from "@/lib/repo/types";

const fieldClass = "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground";
const invoiceTone: Record<Invoice["status"], "success" | "warning" | "danger" | "neutral"> = {
  paid: "success",
  sent: "warning",
  draft: "neutral",
  overdue: "danger",
  void: "neutral",
};

export function ClientsDirectory({ clients, invoices, transactions }: {
  clients: Client[];
  invoices: Invoice[];
  transactions: Transaction[];
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(clients[0]?.id ?? "");
  const visible = clients.filter((client) => `${client.name} ${client.company} ${client.email}`.toLowerCase().includes(query.toLowerCase()));
  const selected = clients.find((client) => client.id === selectedId) ?? visible[0];
  const invoiceRows = useMemo(() => invoices.filter((invoice) => invoice.clientId === selected?.id), [invoices, selected?.id]);
  const transactionRows = useMemo(() => transactions.filter((transaction) => transaction.clientId === selected?.id), [transactions, selected?.id]);
  const outstandingByCurrency = invoiceRows
    .filter((invoice) => invoice.status === "sent" || invoice.status === "draft" || invoice.status === "overdue")
    .reduce<Record<string, number>>((totals, invoice) => {
      totals[invoice.currency] = (totals[invoice.currency] ?? 0) + invoice.amountMinor;
      return totals;
    }, {});

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.7fr)]">
      <Card className="h-fit">
        <CardHeader title="Client directory" demo />
        <div className="px-5 pb-4 pt-4">
          <label className="text-sm text-muted-foreground">Search clients
            <input className={`${fieldClass} mt-1`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, company or email" />
          </label>
        </div>
        {visible.length ? (
          <ul className="divide-y divide-border px-3 pb-3">
            {visible.map((client) => (
              <li key={client.id}>
                <button onClick={() => setSelectedId(client.id)} aria-current={selected?.id === client.id ? "true" : undefined} className={`w-full rounded-xl px-3 py-3 text-left hover:bg-elevated ${selected?.id === client.id ? "bg-elevated" : ""}`}>
                  <span className="block truncate text-sm font-medium">{client.name}</span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">{client.email}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="px-5 pb-6 text-sm text-muted-foreground">{clients.length ? "No clients match your search." : "No clients yet."}</p>}
      </Card>

      {selected ? (
        <div className="space-y-5">
          <Card>
            <CardHeader title={selected.company} demo />
            <div className="grid gap-5 px-5 pb-5 pt-4 sm:grid-cols-2">
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Contact</p><p className="mt-1 font-medium">{selected.name}</p><a className="mt-1 block text-sm text-aqua hover:underline" href={`mailto:${selected.email}`}>{selected.email}</a></div>
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Outstanding balance</p>{Object.entries(outstandingByCurrency).length ? Object.entries(outstandingByCurrency).map(([currency, amount]) => <p key={currency} className="mt-1 font-display text-2xl font-semibold">{formatMoney(amount, currency)}</p>) : <p className="mt-1 font-display text-2xl font-semibold">{formatMoney(0)}</p>}</div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Invoice history" demo />
            {invoiceRows.length ? (
              <div className="overflow-x-auto px-3 pb-3 pt-3">
                <table className="w-full min-w-[460px] text-sm">
                  <thead><tr className="text-left text-xs text-muted-foreground"><th className="px-2 py-2 font-medium">Invoice</th><th className="px-2 py-2 font-medium">Due</th><th className="px-2 py-2 text-right font-medium">Amount</th><th className="px-2 py-2 font-medium">Status</th></tr></thead>
                  <tbody>{invoiceRows.map((invoice) => <tr key={invoice.id} className="border-t border-border"><td className="px-2 py-3 font-medium">{invoice.number}</td><td className="px-2 py-3 text-muted-foreground">{formatDate(invoice.dueDate)}</td><td className="px-2 py-3 text-right">{formatMoney(invoice.amountMinor, invoice.currency)}</td><td className="px-2 py-3"><Badge tone={invoiceTone[invoice.status]}>{invoice.status}</Badge></td></tr>)}</tbody>
                </table>
              </div>
            ) : <p className="px-5 py-6 text-sm text-muted-foreground">No invoices for this client.</p>}
          </Card>
          <Card>
            <CardHeader title="Recent transactions" demo />
            {transactionRows.length ? (
              <ul className="divide-y divide-border px-5">
                {transactionRows.map((transaction) => (
                  <li key={transaction.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span>{transaction.invoiceId} · {formatDate(transaction.date)} · {transaction.status}</span>
                    <span className="font-medium">{formatMoney(transaction.amountMinor, transaction.currency)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="px-5 py-6 text-sm text-muted-foreground">No transactions for this client.</p>}
          </Card>
        </div>
      ) : (
        <Card><p className="p-6 text-sm text-muted-foreground">Select a client to see their details.</p></Card>
      )}
    </div>
  );
}
