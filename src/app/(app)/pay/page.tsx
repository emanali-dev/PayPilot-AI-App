import { PageHeader } from "@/components/layout/page-header";
import { DemoNotice } from "@/components/dashboard/widgets";
import { PaymentRequestForm } from "@/features/payments/payment-request-form";
import { isPaypalConfigured } from "@/lib/paypal/client";
import { demoRepository } from "@/lib/repo/demo";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [invoices, clients] = await Promise.all([demoRepository.getInvoices(), demoRepository.getClients()]);
  return (
    <>
      <PageHeader title="Request a payment" description="Create a PayPal Sandbox order for an unpaid invoice." />
      <DemoNotice />
      <PaymentRequestForm invoices={invoices} clients={clients} paypalConfigured={isPaypalConfigured()} />
    </>
  );
}
