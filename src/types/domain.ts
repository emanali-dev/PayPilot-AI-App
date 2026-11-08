export type Currency = "USD" | "EUR" | "GBP" | (string & {});

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string | null;
}

export interface Invoice {
  id: string;
  userId: string;
  clientId: string;
  number: string;
  status: InvoiceStatus;
  currency: Currency;
  totalMinor: number;
  issueDate: string;
  dueDate: string;
  paypalInvoiceId: string | null;
}

export interface Payment {
  id: string;
  userId: string;
  invoiceId: string | null;
  paypalTransactionId: string;
  amountMinor: number;
  feeMinor: number;
  currency: Currency;
  status: "completed" | "pending" | "refunded" | "failed";
  receivedAt: string;
}
