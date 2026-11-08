"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/format";
import type { Client, Transaction } from "@/lib/repo/types";

const statuses: Transaction["status"][] = ["Completed", "Pending", "Cancelled", "Failed", "Refunded"];
const tones: Record<Transaction["status"], "success" | "warning" | "neutral" | "danger"> = {
  Completed: "success",
  Pending: "warning",
  Cancelled: "neutral",
  Failed: "danger",
  Refunded: "neutral",
};
const fieldClass = "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground";

export function TransactionsManager({ transactions, clients }: { transactions: Transaction[]; clients: Client[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");
  const [from, setFrom] = useState("");
  const [through, setThrough] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const clientById = new Map(clients.map((client) => [client.id, client]));
  const methods = Array.from(new Set(transactions.map((transaction) => transaction.method)));
  const visible = transactions.filter((transaction) => {
    const client = clientById.get(transaction.clientId);
    const matchesText = `${client?.name ?? ""} ${transaction.invoiceId} ${transaction.method}`.toLowerCase().includes(query.toLowerCase());
    return matchesText
      && (status === "all" || transaction.status === status)
      && (method === "all" || transaction.method === method)
      && (!from || transaction.date >= from)
      && (!through || transaction.date <= through);
  });

  return (
    <>
      <Card>
        <CardHeader title="Transaction activity" demo />
        <div className="grid gap-3 px-5 pb-4 pt-5 sm:grid-cols-2 xl:grid-cols-5">
          <label className="text-sm text-muted-foreground sm:col-span-2 xl:col-span-1">Search
            <input className={`${fieldClass} mt-1`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Client, invoice, method" />
          </label>
          <label className="text-sm text-muted-foreground">Status
            <select className={`${fieldClass} mt-1`} value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select>
          </label>
          <label className="text-sm text-muted-foreground">Method
            <select className={`${fieldClass} mt-1`} value={method} onChange={(event) => setMethod(event.target.value)}><option value="all">All methods</option>{methods.map((value) => <option key={value}>{value}</option>)}</select>
          </label>
          <label className="text-sm text-muted-foreground">From
            <input type="date" className={`${fieldClass} mt-1`} value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label className="text-sm text-muted-foreground">Through
            <input type="date" className={`${fieldClass} mt-1`} value={through} onChange={(event) => setThrough(event.target.value)} />
          </label>
        </div>
        {visible.length ? (
          <div className="overflow-x-auto px-2 pb-3">
            <table className="w-full min-w-[680px] text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground">{["Date", "Client", "Invoice", "Method", "Amount", "Status"].map((heading) => <th key={heading} className={`px-3 py-2 font-medium ${heading === "Amount" ? "text-right" : ""}`}>{heading}</th>)}</tr></thead>
              <tbody>{visible.map((transaction) => (
                <tr key={transaction.id} className="border-t border-border">
                  <td className="px-3 py-3 text-muted-foreground">{formatDate(transaction.date)}</td>
                  <td className="px-3 py-3 font-medium">{clientById.get(transaction.clientId)?.name ?? "Unknown client"}</td>
                  <td className="px-3 py-3 text-muted-foreground">{transaction.invoiceId}</td>
                  <td className="px-3 py-3 text-muted-foreground">{transaction.method}</td>
                  <td className="px-3 py-3 text-right">{formatMoney(transaction.amountMinor, transaction.currency)}</td>
                  <td className="px-3 py-3"><button onClick={() => setSelected(transaction)} aria-label={`View ${transaction.invoiceId} transaction`}><Badge tone={tones[transaction.status]}>{transaction.status}</Badge></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="px-5 py-8 text-sm text-muted-foreground">{transactions.length ? "No transactions match these filters." : "No transactions yet."}</p>}
      </Card>
      {selected && <TransactionDetails transaction={selected} client={clientById.get(selected.clientId)} onClose={() => setSelected(null)} />}
    </>
  );
}

function TransactionDetails({ transaction, client, onClose }: { transaction: Transaction; client?: Client; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="transaction-detail-title" className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-card p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-4"><div><p className="text-sm text-muted-foreground">Transaction detail</p><h2 id="transaction-detail-title" className="font-display text-2xl font-semibold">{transaction.invoiceId}</h2></div><Button variant="outline" onClick={onClose}>Close</Button></div>
        <dl className="mt-6 space-y-4 rounded-xl border border-border bg-background/40 p-4 text-sm">
          <div><dt className="text-muted-foreground">Client</dt><dd className="mt-1 font-medium">{client?.name ?? "Unknown client"}{client && <span className="block font-normal text-muted-foreground">{client.email}</span>}</dd></div>
          <div><dt className="text-muted-foreground">Amount</dt><dd className="mt-1 font-semibold">{formatMoney(transaction.amountMinor, transaction.currency)}</dd></div>
          <div><dt className="text-muted-foreground">Date</dt><dd className="mt-1">{formatDate(transaction.date)}</dd></div>
          <div><dt className="text-muted-foreground">Method</dt><dd className="mt-1">{transaction.method}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd className="mt-1"><Badge tone={tones[transaction.status]}>{transaction.status}</Badge></dd></div>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">This is a demo transaction record; no payment was processed.</p>
      </section>
    </div>
  );
}
