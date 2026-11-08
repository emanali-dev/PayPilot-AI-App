import "server-only";
import { clients, invoices, monthly, transactions } from "@/lib/demo-data";
import type {
  Client,
  Invoice,
  NewInvoice,
  NewPaymentRequest,
  PaymentRequest,
  PaymentRequestStatus,
  PayPilotRepository,
  Transaction,
} from "@/lib/repo/types";

interface DemoStore {
  clients: Client[];
  invoices: Invoice[];
  transactions: Transaction[];
  paymentRequests: PaymentRequest[];
  nextInvoiceNumber: number;
}

const demoStoreKey = "__paypilotDemoStore";
type DemoGlobal = typeof globalThis & { [demoStoreKey]?: DemoStore };

function createStore(): DemoStore {
  const clientRows = clients.map((client) => ({ ...client }));
  const invoiceRows: Invoice[] = invoices.map((invoice) => {
    const issueDate = new Date(`${invoice.due}T00:00:00.000Z`);
    issueDate.setUTCDate(issueDate.getUTCDate() - 14);
    return {
      id: invoice.id,
      number: invoice.id,
      clientId: invoice.clientId,
      status: invoice.status === "Paid" ? "paid" : invoice.status === "Overdue" ? "overdue" : "sent",
      currency: "USD",
      amountMinor: invoice.amount * 100,
      issueDate: issueDate.toISOString().slice(0, 10),
      dueDate: invoice.due,
      lineItems: [{ description: "Professional services", quantity: 1, unitAmountMinor: invoice.amount * 100, amountMinor: invoice.amount * 100 }],
    };
  });
  return {
    clients: clientRows,
    invoices: invoiceRows,
    transactions: transactions.map((transaction) => ({
      id: transaction.id,
      clientId: transaction.clientId,
      invoiceId: transaction.invoice,
      date: transaction.date,
      method: transaction.method,
      amountMinor: transaction.amount * 100,
      currency: "USD",
      status: transaction.status,
    })),
    paymentRequests: [],
    nextInvoiceNumber: Math.max(...invoiceRows.map((invoice) => Number(invoice.number.replace(/\D/g, "")))) + 1,
  };
}

function getStore(): DemoStore {
  const shared = globalThis as DemoGlobal;
  shared[demoStoreKey] ??= createStore();
  return shared[demoStoreKey];
}

export const demoRepository: PayPilotRepository = {
  async getClients() {
    return structuredClone(getStore().clients);
  },
  async getInvoices() {
    return structuredClone(getStore().invoices);
  },
  async getTransactions() {
    return structuredClone(getStore().transactions);
  },
  async getSummary() {
    const data = monthly.map((row) => ({
      month: row.m,
      incomeMinor: row.income * 100,
      expensesMinor: row.expenses * 100,
    }));
    const newIncomeByMonth = getStore().paymentRequests
      .filter((request) => request.status === "completed" && request.currency === "USD")
      .reduce<Record<string, number>>((totals, request) => {
        const month = new Date(request.createdAt).toLocaleString("en-US", { month: "short", timeZone: "UTC" });
        totals[month] = (totals[month] ?? 0) + request.amountMinor;
        return totals;
      }, {});
    for (const [month, incomeMinor] of Object.entries(newIncomeByMonth)) {
      const existing = data.find((row) => row.month === month);
      if (existing) existing.incomeMinor += incomeMinor;
      else data.push({ month, incomeMinor, expensesMinor: 0 });
    }
    const sum = (rows: typeof data) => rows.reduce((total, row) => total + row.incomeMinor, 0);
    const currentPeriod = sum(data.slice(-3));
    const previousPeriod = sum(data.slice(-6, -3));
    const outstandingByCurrency = getStore().invoices
      .filter((invoice) => invoice.status === "sent" || invoice.status === "overdue" || invoice.status === "draft")
      .reduce<Record<string, number>>((totals, invoice) => {
        totals[invoice.currency] = (totals[invoice.currency] ?? 0) + invoice.amountMinor;
        return totals;
      }, {});
    return {
      incomeMinor: sum(data),
      expensesMinor: data.reduce((total, row) => total + row.expensesMinor, 0),
      changePercent: previousPeriod === 0 ? 0 : (currentPeriod / previousPeriod - 1) * 100,
      outstandingByCurrency,
      monthly: data,
    };
  },
  async createInvoice(input: NewInvoice) {
    const store = getStore();
    if (!store.clients.some((client) => client.id === input.clientId)) {
      throw new Error("The selected client does not exist.");
    }
    const lineItems = input.lineItems.map((item) => ({
      ...item,
      amountMinor: item.unitAmountMinor * item.quantity,
    }));
    const amountMinor = lineItems.reduce((total, item) => total + item.amountMinor, 0);
    const number = `INV-${store.nextInvoiceNumber++}`;
    const invoice: Invoice = {
      id: number,
      number,
      clientId: input.clientId,
      status: "draft",
      currency: input.currency,
      amountMinor,
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: input.dueDate,
      lineItems,
    };
    store.invoices.unshift(invoice);
    return structuredClone(invoice);
  },
  async createPaymentRequest(input: NewPaymentRequest) {
    const store = getStore();
    const invoice = store.invoices.find((item) => item.id === input.invoiceId);
    if (!invoice) throw new Error("The selected invoice does not exist.");
    if (invoice.status !== "sent" && invoice.status !== "overdue") {
      throw new Error("Only sent or overdue invoices can be paid.");
    }
    if (!["USD", "EUR", "GBP"].includes(invoice.currency)) {
      throw new Error(`PayPal checkout does not support ${invoice.currency} in this demo.`);
    }
    const existing = store.paymentRequests.find((request) => request.invoiceId === invoice.id && request.status === "pending");
    if (existing) return structuredClone(existing);

    const request: PaymentRequest = {
      id: crypto.randomUUID(),
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      amountMinor: invoice.amountMinor,
      currency: invoice.currency,
      note: input.note,
      status: "pending",
      createdAt: new Date().toISOString(),
      paypalOrderId: null,
      approvalUrl: null,
      captureRequestId: crypto.randomUUID(),
      captureId: null,
    };
    store.paymentRequests.unshift(request);
    store.transactions.unshift({
      id: `tx-${request.id}`,
      clientId: request.clientId,
      invoiceId: invoice.number,
      date: request.createdAt.slice(0, 10),
      method: "PayPal Sandbox",
      amountMinor: request.amountMinor,
      currency: request.currency,
      status: "Pending",
    });
    return structuredClone(request);
  },
  async getPaymentRequest(id: string) {
    const request = getStore().paymentRequests.find((item) => item.id === id);
    return request ? structuredClone(request) : null;
  },
  async attachPayPalOrder(id: string, paypalOrderId: string, approvalUrl: string) {
    const request = getStore().paymentRequests.find((item) => item.id === id);
    if (!request) throw new Error("The payment request does not exist.");
    if (request.status !== "pending") throw new Error("The payment request is no longer pending.");
    request.paypalOrderId = paypalOrderId;
    request.approvalUrl = approvalUrl;
    return structuredClone(request);
  },
  async updatePaymentRequest(id: string, status: PaymentRequestStatus, captureId?: string) {
    const store = getStore();
    const request = store.paymentRequests.find((item) => item.id === id);
    if (!request) throw new Error("The payment request does not exist.");
    if (request.status === "completed" && status !== "completed") {
      throw new Error("A completed payment cannot be changed to another status.");
    }
    if (request.status === "cancelled" || request.status === "failed") {
      if (request.status !== status) throw new Error("A final payment status cannot be changed.");
    }
    request.status = status;
    if (captureId) request.captureId = captureId;
    if (status === "completed") {
      const transaction = store.transactions.find((item) => item.id === `tx-${request.id}`);
      if (transaction) transaction.status = "Completed";
      const invoice = store.invoices.find((item) => item.id === request.invoiceId);
      if (invoice) invoice.status = "paid";
    } else if (status === "cancelled" || status === "failed") {
      const transaction = store.transactions.find((item) => item.id === `tx-${request.id}`);
      if (transaction) transaction.status = status === "cancelled" ? "Cancelled" : "Failed";
    }
    return structuredClone(request);
  },
};
