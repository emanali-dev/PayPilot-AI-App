/** SAMPLE DATA ONLY. Nothing here comes from PayPal or Supabase. */
export const monthly = [
  { m: "Jan", income: 3800, expenses: 1250 }, { m: "Feb", income: 4200, expenses: 1400 },
  { m: "Mar", income: 3600, expenses: 1100 }, { m: "Apr", income: 5100, expenses: 1650 },
  { m: "May", income: 4700, expenses: 1500 }, { m: "Jun", income: 5600, expenses: 1900 },
  { m: "Jul", income: 4900, expenses: 1450 }, { m: "Aug", income: 6200, expenses: 2100 },
  { m: "Sep", income: 5800, expenses: 1800 }, { m: "Oct", income: 6900, expenses: 2250 },
];

export const totals = {
  income: monthly.reduce((sum, row) => sum + row.income, 0),
  expenses: monthly.reduce((sum, row) => sum + row.expenses, 0),
  changePct: (monthly.slice(-3).reduce((sum, row) => sum + row.income, 0) /
    monthly.slice(-6, -3).reduce((sum, row) => sum + row.income, 0) - 1) * 100,
};

export const clients = [
  { id: "client-northwind", name: "Northwind Studio", email: "finance@northwind.studio", company: "Northwind Studio" },
  { id: "client-bright-labs", name: "Bright Labs", email: "accounts@brightlabs.example", company: "Bright Labs" },
  { id: "client-kestrel", name: "Kestrel Media", email: "billing@kestrelmedia.example", company: "Kestrel Media" },
  { id: "client-oakline", name: "Oakline Co.", email: "finance@oakline.example", company: "Oakline Co." },
  { id: "client-harbor", name: "Harbor & Finch", email: "accounts@harborfinch.example", company: "Harbor & Finch" },
  { id: "client-lumen", name: "Lumen Health", email: "billing@lumenhealth.example", company: "Lumen Health" },
  { id: "client-startupxyz", name: "StartupXYZ", email: "finance@startupxyz.example", company: "StartupXYZ" },
];

export type TxStatus = "Completed" | "Pending" | "Cancelled" | "Failed" | "Refunded";
export const transactions: {
  id: string;
  date: string;
  payer: string;
  clientId: string;
  invoice: string;
  method: string;
  amount: number;
  status: TxStatus;
}[] = [
  { id: "tx-1042", date: "2026-10-28", payer: "Northwind Studio", clientId: "client-northwind", invoice: "INV-1042", method: "PayPal balance", amount: 2400, status: "Completed" },
  { id: "tx-1041", date: "2026-10-27", payer: "Bright Labs", clientId: "client-bright-labs", invoice: "INV-1041", method: "Visa ••2104", amount: 1250, status: "Completed" },
  { id: "tx-1039", date: "2026-10-25", payer: "Kestrel Media", clientId: "client-kestrel", invoice: "INV-1039", method: "PayPal balance", amount: 780, status: "Pending" },
  { id: "tx-1036", date: "2026-10-22", payer: "Oakline Co.", clientId: "client-oakline", invoice: "INV-1036", method: "Visa ••8830", amount: 1900, status: "Completed" },
  { id: "tx-1033", date: "2026-10-19", payer: "Harbor & Finch", clientId: "client-harbor", invoice: "INV-1033", method: "PayPal balance", amount: 450, status: "Refunded" },
  { id: "tx-1031", date: "2026-10-17", payer: "Lumen Health", clientId: "client-lumen", invoice: "INV-1031", method: "Bank transfer", amount: 3100, status: "Failed" },
];

export type InvStatus = "Paid" | "Outstanding" | "Overdue";
export const invoices: {
  id: string;
  clientId: string;
  client: string;
  amount: number;
  due: string;
  status: InvStatus;
}[] = [
  { id: "INV-1044", clientId: "client-northwind", client: "Northwind Studio", amount: 3200, due: "2026-11-12", status: "Outstanding" },
  { id: "INV-1043", clientId: "client-kestrel", client: "Kestrel Media", amount: 1750, due: "2026-11-08", status: "Outstanding" },
  { id: "INV-1040", clientId: "client-startupxyz", client: "StartupXYZ", amount: 3200, due: "2026-10-30", status: "Overdue" },
  { id: "INV-1042", clientId: "client-northwind", client: "Northwind Studio", amount: 2400, due: "2026-10-28", status: "Paid" },
  { id: "INV-1041", clientId: "client-bright-labs", client: "Bright Labs", amount: 1250, due: "2026-10-27", status: "Paid" },
];

export const upcoming = [
  { client: "Kestrel Media", invoice: "INV-1043", amount: 1750, when: "Due in 2 days" },
  { client: "Northwind Studio", invoice: "INV-1044", amount: 3200, when: "Due in 6 days" },
  { client: "Oakline Co.", invoice: "INV-1045", amount: 900, when: "Due in 11 days" },
];

export const prompts = ["Who still owes me money?", "How much did I earn this quarter?", "Draft a reminder for StartupXYZ", "Will I be short next month?"];
