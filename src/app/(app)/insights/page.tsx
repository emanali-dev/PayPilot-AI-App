import { PageHeader } from "@/components/layout/page-header";
import { CashflowChart } from "@/components/charts/cashflow-chart";
import { ForecastChart } from "@/components/charts/forecast-chart";
import { RevenueTrendChart } from "@/components/charts/revenue-trend-chart";
import { Card, CardHeader } from "@/components/ui/card";
import { DemoNotice } from "@/components/dashboard/widgets";
import { formatMoney } from "@/lib/format";
import { forecastCashFlow } from "@/lib/services/forecast";
import { demoRepository } from "@/lib/repo/demo";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [summary, invoices] = await Promise.all([demoRepository.getSummary(), demoRepository.getInvoices()]);
  const today = new Date().toISOString().slice(0, 10);
  const forecast = forecastCashFlow(summary.monthly, invoices, today);
  const openInvoices = invoices.filter((invoice) => ["draft", "sent", "overdue"].includes(invoice.status));
  const outstandingByCurrency = openInvoices.reduce<Record<string, number>>((totals, invoice) => {
    totals[invoice.currency] = (totals[invoice.currency] ?? 0) + invoice.amountMinor;
    return totals;
  }, {});
  const chartData = summary.monthly.map((month) => ({
    m: month.month,
    income: month.incomeMinor / 100,
    expenses: month.expensesMinor / 100,
  }));

  return (
    <>
      <PageHeader title="Insights" description="Understand your revenue, expenses and expected cash flow." />
      <DemoNotice />
      {summary.monthly.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card><CardHeader title="Monthly revenue trend" demo /><div className="px-5 pb-4 pt-3"><RevenueTrendChart data={summary.monthly} /></div></Card>
          <Card><CardHeader title="Income vs expenses" demo /><div className="px-5 pb-4 pt-3"><CashflowChart data={chartData} /></div></Card>
          <Card>
            <CardHeader title="Outstanding payments" demo />
            <div className="px-5 pb-5 pt-4">
              {Object.entries(outstandingByCurrency).length ? Object.entries(outstandingByCurrency).map(([currency, amount]) => <p key={currency} className="font-display text-3xl font-semibold">{formatMoney(amount, currency)}</p>) : <p className="font-display text-3xl font-semibold">{formatMoney(0)}</p>}
              <p className="mt-1 text-sm text-muted-foreground">{openInvoices.length} unpaid invoice{openInvoices.length === 1 ? "" : "s"}</p>
              {openInvoices.length ? (
                <ul className="mt-4 divide-y divide-border">
                  {openInvoices.map((invoice) => <li key={invoice.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span>{invoice.number} · {invoice.status}</span><span className="font-medium">{formatMoney(invoice.amountMinor, invoice.currency)}</span></li>)}
                </ul>
              ) : <p className="mt-4 text-sm text-muted-foreground">Nothing is outstanding.</p>}
            </div>
          </Card>
          <Card>
            <CardHeader title="Cash-flow forecast" demo />
            <div className="px-5 pb-5 pt-3">
              <ForecastChart data={forecast} />
              <ul className="mt-3 divide-y divide-border">
                {forecast.map((item) => <li key={item.days} className="flex items-center justify-between gap-4 py-2 text-sm"><span>{item.days}-day net estimate</span><span className="font-medium">{formatMoney(item.projectedNetMinor)}</span></li>)}
              </ul>
              <div className="mt-4 rounded-xl border border-border bg-background/40 p-3 text-xs leading-relaxed text-muted-foreground">
                Assumptions: income and expenses continue at the average of the latest three demo months; USD unpaid invoices are collected by their due date (overdue invoices are included in the first horizon); invoices in other currencies are excluded from the USD forecast; no new invoices or one-off costs are added. This is a deterministic estimate, not financial advice.
              </div>
            </div>
          </Card>
        </div>
      ) : <Card><p className="p-6 text-sm text-muted-foreground">No monthly data is available to calculate insights.</p></Card>}
    </>
  );
}
