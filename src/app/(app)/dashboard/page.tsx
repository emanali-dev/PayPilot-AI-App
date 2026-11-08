import { PageHeader } from "@/components/layout/page-header";
import { AssistantCard, DemoNotice, InvoiceSummary, PayPalStatus, RevenueOverview, TransactionsTable, UpcomingPayments } from "@/components/dashboard/widgets";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { demoRepository } from "@/lib/repo/demo";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [summary, invoices, transactions, clients] = await Promise.all([
    demoRepository.getSummary(),
    demoRepository.getInvoices(),
    demoRepository.getTransactions(),
    demoRepository.getClients(),
  ]);
  return (
    <>
      <PageHeader
        title="Good morning, Maya"
        description="Here’s where your money stands today."
        actions={<Link href="/invoices" className={buttonVariants()}><Plus className="size-4" aria-hidden />New invoice</Link>}
      />
      <DemoNotice />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-12">
        <RevenueOverview summary={summary} className="md:col-span-2 xl:col-span-8" />
        <div className="grid gap-5 md:col-span-2 md:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
          <AssistantCard />
          <PayPalStatus />
        </div>
        <InvoiceSummary invoices={invoices} className="xl:col-span-5" />
        <UpcomingPayments invoices={invoices} clients={clients} className="xl:col-span-7" />
        <TransactionsTable transactions={transactions} clients={clients} className="md:col-span-2 xl:col-span-12" limit={5} />
      </div>
    </>
  );
}
