import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Plug, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { CashflowChart, type CashflowChartRow } from "@/components/charts/cashflow-chart";
import type { Client, Invoice, Summary, Transaction } from "@/lib/repo/types";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const txTone: Record<Transaction["status"], "success" | "warning" | "neutral" | "danger"> = {
  Completed: "success",
  Pending: "warning",
  Cancelled: "neutral",
  Refunded: "neutral",
  Failed: "danger",
};

const invTone: Record<Invoice["status"], "success" | "warning" | "danger" | "neutral"> = {
  paid: "success",
  sent: "warning",
  draft: "neutral",
  overdue: "danger",
  void: "neutral",
};

const usd = (minor: number, currency = "USD") => formatMoney(minor, currency);

export function RevenueOverview({
  className,
  summary,
}: {
  className?: string;
  summary: Summary;
}) {
  const chartData: CashflowChartRow[] = summary.monthly.map((month) => ({
    m: month.month,
    income: month.incomeMinor / 100,
    expenses: month.expensesMinor / 100,
  }));
  return (
    <Card className={className}>
      <CardHeader title="Revenue overview" demo />
      <div className="px-5 pb-5 pt-4">
        <div className="mb-5 flex flex-wrap items-end gap-x-4 gap-y-2">
          <p className="font-display text-4xl font-semibold md:text-5xl">{usd(summary.incomeMinor)}</p>
          <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-sm font-medium text-success">
            <ArrowUpRight className="size-4" aria-hidden />{summary.changePercent >= 0 ? "+" : ""}{summary.changePercent.toFixed(1)}%
          </span>
          <p className="mb-2 text-sm text-muted-foreground">last 3 months vs the 3 before · Jan–Oct</p>
        </div>
        <CashflowChart data={chartData} />
      </div>
    </Card>
  );
}

export function AssistantCard({ className, large }: { className?: string; large?: boolean }) {
  const prompts = ["Who still owes me money?", "How much did I earn this quarter?", "Draft a reminder", "Will I be short next month?"];
  return (
    <Card className={cn("bg-linear-to-br from-primary/15 via-card to-card", className)}>
      <CardHeader title="Ask PayPilot" action={<Sparkles className="size-4 text-aqua" aria-hidden />} />
      <div className="space-y-3 px-5 pb-5 pt-4">
        <p className="text-sm text-muted-foreground">Ask questions about income, invoices and cash flow.</p>
        <p className="text-xs text-muted-foreground">AI answers are not connected in this demo yet.</p>
        <div className={cn("flex flex-wrap gap-2 pt-1", large && "pt-3")}>
          {prompts.slice(0, large ? 4 : 3).map((prompt) => (
            <Link key={prompt} href="/assistant" className="rounded-full border border-border bg-background/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
              {prompt}
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function PayPalStatus({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader title="PayPal Sandbox" />
      <div className="space-y-3 px-5 pb-5 pt-4 text-sm">
        <p className="text-muted-foreground">Review credential configuration and connection status in Settings.</p>
        <Link href="/settings" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
          <Plug className="size-4" aria-hidden />Review status
        </Link>
      </div>
    </Card>
  );
}

export function InvoiceSummary({ className, invoices }: { className?: string; invoices: Invoice[] }) {
  const totals = [
    ["Paid", invoices.filter((invoice) => invoice.status === "paid"), "bg-success"],
    ["Outstanding", invoices.filter((invoice) => invoice.status === "sent" || invoice.status === "draft"), "bg-warning"],
    ["Overdue", invoices.filter((invoice) => invoice.status === "overdue"), "bg-danger"],
  ] as const;
  return (
    <Card className={className}>
      <CardHeader title="Invoices" demo action={<Link href="/invoices" className="text-sm text-aqua hover:underline">View all</Link>} />
      <div className="px-5 pb-5 pt-4">
        <ul className="space-y-3">
          {totals.map(([label, rows, color]) => {
            const amounts = rows.reduce<Record<string, number>>((result, invoice) => {
              result[invoice.currency] = (result[invoice.currency] ?? 0) + invoice.amountMinor;
              return result;
            }, {});
            return (
              <li key={label} className="flex items-start justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 pt-0.5 text-muted-foreground"><span className={cn("size-2 shrink-0 rounded-full", color)} />{label}</span>
                <span className="text-right font-medium">{Object.entries(amounts).length ? Object.entries(amounts).map(([currency, amount]) => <span key={currency} className="block">{usd(amount, currency)}</span>) : usd(0)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}

export function UpcomingPayments({ className, invoices, clients }: { className?: string; invoices: Invoice[]; clients: Client[] }) {
  const upcoming = invoices
    .filter((invoice) => invoice.status === "sent" || invoice.status === "overdue")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);
  const clientById = new Map(clients.map((client) => [client.id, client]));
  return (
    <Card className={className}>
      <CardHeader title="Upcoming payments" demo />
      {upcoming.length ? (
        <ul className="divide-y divide-border px-5 pb-2 pt-2">
          {upcoming.map((invoice) => (
            <li key={invoice.id} className="flex items-center justify-between gap-3 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{clientById.get(invoice.clientId)?.name ?? "Unknown client"}</p>
                <p className="text-xs text-muted-foreground">{invoice.number} · Due {formatDate(invoice.dueDate)}</p>
              </div>
              <p className="text-sm font-semibold">{usd(invoice.amountMinor, invoice.currency)}</p>
            </li>
          ))}
        </ul>
      ) : <p className="px-5 py-6 text-sm text-muted-foreground">No outstanding invoices.</p>}
    </Card>
  );
}

export function TransactionsTable({ className, limit, transactions, clients }: {
  className?: string;
  limit?: number;
  transactions: Transaction[];
  clients: Client[];
}) {
  const clientById = new Map(clients.map((client) => [client.id, client]));
  const rows = limit ? transactions.slice(0, limit) : transactions;
  return (
    <Card className={className}>
      <CardHeader title="Recent transactions" demo action={limit ? <Link href="/transactions" className="text-sm text-aqua hover:underline">View all</Link> : undefined} />
      {rows.length ? (
        <div className="overflow-x-auto px-2 pb-3 pt-3">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                {["Date", "Payer", "Invoice", "Method", "Amount", "Status"].map((heading) => <th key={heading} className={cn("px-3 py-2 font-medium", heading === "Amount" && "text-right")}>{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((transaction) => (
                <tr key={transaction.id} className="border-t border-border">
                  <td className="px-3 py-3 text-muted-foreground">{formatDate(transaction.date)}</td>
                  <td className="px-3 py-3 font-medium">{clientById.get(transaction.clientId)?.name ?? "Unknown client"}</td>
                  <td className="px-3 py-3 text-muted-foreground">{transaction.invoiceId}</td>
                  <td className="px-3 py-3 text-muted-foreground">{transaction.method}</td>
                  <td className="px-3 py-3 text-right font-medium">{usd(transaction.amountMinor, transaction.currency)}</td>
                  <td className="px-3 py-3"><Badge tone={txTone[transaction.status]}>{transaction.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="px-5 py-6 text-sm text-muted-foreground">No transactions yet.</p>}
    </Card>
  );
}

export function InvoicesTable({ className, invoices, clients }: { className?: string; invoices: Invoice[]; clients: Client[] }) {
  const clientById = new Map(clients.map((client) => [client.id, client]));
  return (
    <Card className={className}>
      <CardHeader title="All invoices" demo />
      {invoices.length ? (
        <div className="overflow-x-auto px-2 pb-3 pt-3">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground">{["Invoice", "Client", "Due", "Amount", "Status"].map((heading) => <th key={heading} className={cn("px-3 py-2 font-medium", heading === "Amount" && "text-right")}>{heading}</th>)}</tr></thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-border">
                  <td className="px-3 py-3 font-medium">{invoice.number}</td>
                  <td className="px-3 py-3 text-muted-foreground">{clientById.get(invoice.clientId)?.name ?? "Unknown client"}</td>
                  <td className="px-3 py-3 text-muted-foreground">{formatDate(invoice.dueDate)}</td>
                  <td className="px-3 py-3 text-right font-medium">{usd(invoice.amountMinor, invoice.currency)}</td>
                  <td className="px-3 py-3"><Badge tone={invTone[invoice.status]}>{invoice.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="px-5 py-6 text-sm text-muted-foreground">No invoices yet.</p>}
    </Card>
  );
}

export function DemoNotice() {
  return (
    <p className="mb-6 flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2.5 text-sm text-muted-foreground">
      <CheckCircle2 className="size-4 shrink-0 text-aqua" aria-hidden />
      Figures are sample data stored for this demo session. No live financial accounts are connected.
    </p>
  );
}
