import { DemoTag } from "@/components/ui/card";

export function PageHeader({ title, description, actions, demo }: { title: string; description?: string; actions?: React.ReactNode; demo?: boolean }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
          {demo && <DemoTag />}
        </div>
        {description && <p className="mt-1 max-w-prose text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </header>
  );
}
