import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading page" className="space-y-5">
      <div className="h-10 max-w-sm rounded-xl bg-elevated" />
      <Card className="min-h-36 p-5"><div className="h-5 w-48 rounded bg-elevated" /><div className="mt-5 h-16 rounded-xl bg-elevated/60" /></Card>
      <span className="sr-only">Loading page…</span>
    </div>
  );
}
