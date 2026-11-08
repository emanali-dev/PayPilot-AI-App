import { cn } from "@/lib/utils";

export function Card({ className, ...p }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.25)]", className)} {...p} />;
}

export function DemoTag() {
  return (
    <span className="rounded-md border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-xs font-medium text-warning">
      Demo data
    </span>
  );
}

export function CardHeader({ title, action, demo }: { title: string; action?: React.ReactNode; demo?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-5">
      <div className="flex items-center gap-2.5">
        <h2 className="text-base font-semibold">{title}</h2>
        {demo && <DemoTag />}
      </div>
      {action}
    </div>
  );
}
