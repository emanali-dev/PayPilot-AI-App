import { PaymentResult } from "@/features/payments/payment-result";

export default async function Page({ searchParams }: { searchParams: Promise<{ requestId?: string }> }) {
  const { requestId } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <PaymentResult requestId={requestId ?? ""} action="capture" />
    </main>
  );
}
