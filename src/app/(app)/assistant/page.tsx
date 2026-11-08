import { PageHeader } from "@/components/layout/page-header";
import { DemoNotice, AssistantCard } from "@/components/dashboard/widgets";

export default function Page() {
  return (
    <>
      <PageHeader title="AI Assistant" description="Ask about your money and take payment actions." />
      <DemoNotice />
      <AssistantCard large className="max-w-2xl" />
    </>
  );
}
