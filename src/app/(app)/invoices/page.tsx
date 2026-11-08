import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DemoNotice } from "@/components/dashboard/widgets";
import { InvoicesManager } from "@/features/invoices/invoices-manager";
import { demoRepository } from "@/lib/repo/demo";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [invoices, clients] = await Promise.all([demoRepository.getInvoices(), demoRepository.getClients()]);
  return (
    <>
      <PageHeader
        title="Invoices"
        description="Create, send and follow up on invoices."
        actions={<Link href="/pay" className={buttonVariants({ variant: "outline" })}>Request payment<ArrowRight className="size-4" aria-hidden /></Link>}
      />
      <DemoNotice />
      <InvoicesManager initialInvoices={invoices} clients={clients} />
    </>
  );
}
