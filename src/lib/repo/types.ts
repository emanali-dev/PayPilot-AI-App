export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";
export type TransactionStatus = "Completed" | "Pending" | "Cancelled" | "Failed" | "Refunded";

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitAmountMinor: number;
  amountMinor: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  status: InvoiceStatus;
  currency: string;
  amountMinor: number;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
}

export interface Transaction {
  id: string;
  clientId: string;
  invoiceId: string;
  date: string;
  method: string;
  amountMinor: number;
  currency: string;
  status: TransactionStatus;
}

export type PaymentRequestStatus = "pending" | "completed" | "cancelled" | "failed";

export interface PaymentRequest {
  id: string;
  invoiceId: string;
  clientId: string;
  amountMinor: number;
  currency: string;
  note: string;
  status: PaymentRequestStatus;
  createdAt: string;
  paypalOrderId: string | null;
  approvalUrl: string | null;
  captureRequestId: string;
  captureId: string | null;
}

export interface MonthlySummary {
  month: string;
  incomeMinor: number;
  expensesMinor: number;
}

export interface Summary {
  incomeMinor: number;
  expensesMinor: number;
  changePercent: number;
  outstandingByCurrency: Record<string, number>;
  monthly: MonthlySummary[];
}

export interface NewInvoice {
  clientId: string;
  currency: string;
  dueDate: string;
  lineItems: Omit<InvoiceLineItem, "amountMinor">[];
}

export interface NewPaymentRequest {
  invoiceId: string;
  note: string;
}

export interface PayPilotRepository {
  getClients(): Promise<Client[]>;
  getInvoices(): Promise<Invoice[]>;
  getTransactions(): Promise<Transaction[]>;
  getSummary(): Promise<Summary>;
  createInvoice(input: NewInvoice): Promise<Invoice>;
  createPaymentRequest(input: NewPaymentRequest): Promise<PaymentRequest>;
  getPaymentRequest(id: string): Promise<PaymentRequest | null>;
  attachPayPalOrder(id: string, paypalOrderId: string, approvalUrl: string): Promise<PaymentRequest>;
  updatePaymentRequest(
    id: string,
    status: PaymentRequestStatus,
    captureId?: string,
  ): Promise<PaymentRequest>;
}
