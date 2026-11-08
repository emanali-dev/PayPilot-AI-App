import { PageHeader } from "@/components/layout/page-header";
import { DemoNotice } from "@/components/dashboard/widgets";
import { TransactionsManager } from "@/features/transactions/transactions-manager";
import { demoRepository } from "@/lib/repo/demo";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [transactions, clients] = await Promise.all([demoRepository.getTransactions(), demoRepository.getClients()]);
  return (
    <>
      <PageHeader title="Transactions" description="Review payment activity and status." />
      <DemoNotice />
      <TransactionsManager transactions={transactions} clients={clients} />
    </>
  );
}
