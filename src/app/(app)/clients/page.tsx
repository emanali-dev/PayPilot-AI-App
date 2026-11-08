import { PageHeader } from "@/components/layout/page-header";
import { DemoNotice } from "@/components/dashboard/widgets";
import { ClientsDirectory } from "@/features/clients/clients-directory";
import { demoRepository } from "@/lib/repo/demo";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [clients, invoices, transactions] = await Promise.all([
    demoRepository.getClients(),
    demoRepository.getInvoices(),
    demoRepository.getTransactions(),
  ]);
  return (
    <>
      <PageHeader title="Clients" description="Keep client contacts, invoices and balances together." />
      <DemoNotice />
      <ClientsDirectory clients={clients} invoices={invoices} transactions={transactions} />
    </>
  );
}
