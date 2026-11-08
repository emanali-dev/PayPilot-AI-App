import type { Invoice, MonthlySummary } from "@/lib/repo/types";

export interface CashFlowForecast {
  days: 30 | 60 | 90;
  projectedIncomeMinor: number;
  projectedExpensesMinor: number;
  projectedNetMinor: number;
  expectedInvoiceMinor: number;
}

export function forecastCashFlow(
  monthly: MonthlySummary[],
  invoices: Invoice[],
  asOfDate: string,
): CashFlowForecast[] {
  const history = monthly.slice(-3);
  const divisor = history.length || 1;
  const averageMonthlyIncome = history.reduce((sum, month) => sum + month.incomeMinor, 0) / divisor;
  const averageMonthlyExpenses = history.reduce((sum, month) => sum + month.expensesMinor, 0) / divisor;
  const unpaid = invoices.filter((invoice) => invoice.currency === "USD" && ["draft", "sent", "overdue"].includes(invoice.status));
  const start = new Date(`${asOfDate}T00:00:00.000Z`);

  return ([30, 60, 90] as const).map((days) => {
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + days);
    const expectedInvoiceMinor = unpaid.reduce((sum, invoice) => {
      const due = new Date(`${invoice.dueDate}T00:00:00.000Z`);
      return due <= end ? sum + invoice.amountMinor : sum;
    }, 0);
    const projectedIncomeMinor = Math.round(averageMonthlyIncome * days / 30) + expectedInvoiceMinor;
    const projectedExpensesMinor = Math.round(averageMonthlyExpenses * days / 30);
    return {
      days,
      projectedIncomeMinor,
      projectedExpensesMinor,
      projectedNetMinor: projectedIncomeMinor - projectedExpensesMinor,
      expectedInvoiceMinor,
    };
  });
}
