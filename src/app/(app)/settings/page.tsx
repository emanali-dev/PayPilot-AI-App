import { PageHeader } from "@/components/layout/page-header";
import { DemoNotice } from "@/components/dashboard/widgets";
import { SettingsPanel } from "@/features/settings/settings-panel";

export default function Page() {
  return (
    <>
      <PageHeader title="Settings" description="Profile, PayPal connection and preferences." />
      <DemoNotice />
      <SettingsPanel />
    </>
  );
}
