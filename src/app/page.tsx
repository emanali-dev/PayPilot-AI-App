import Link from "next/link";
import { ArrowRight, FileText, LineChart, Navigation, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { demoRepository } from "@/lib/repo/demo";

export const dynamic = "force-dynamic";

const features = [
  { icon: LineChart, title: "See your income clearly", text: "Payments, fees and expenses in one view, so you know what you actually earned." },
  { icon: FileText, title: "Get invoices paid", text: "Track what is paid, due and overdue, and send reminders in a click." },
  { icon: Sparkles, title: "Ask instead of dig", text: "Ask the assistant who owes you or whether next month looks tight." },
];

export default async function Landing() {
  const summary = await demoRepository.getSummary();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <span className="flex items-center gap-2.5 font-display text-lg font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary"><Navigation className="size-4" aria-hidden /></span>
          PayPilot AI
        </span>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>Open dashboard</Link>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h1 className="text-4xl font-semibold leading-[1.08] md:text-6xl">Know what you’ve earned, what’s owed, and what’s next.</h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            PayPilot AI gives freelancers one place for PayPal income, invoices and cash flow, with an assistant that answers in plain language.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>Explore the demo <ArrowRight className="size-4" aria-hidden /></Link>
            <a href="#features" className={buttonVariants({ variant: "ghost", size: "lg" })}>How it works</a>
          </div>
        </div>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Revenue, Jan–Oct (demo)</p>
          <p className="mt-1 font-display text-4xl font-semibold">{formatMoney(summary.incomeMinor)}</p>
          <p className="mt-1 text-sm text-success">{summary.changePercent >= 0 ? "+" : ""}{summary.changePercent.toFixed(1)}% vs previous quarter</p>
          <div className="mt-6 flex h-24 items-end gap-1.5" aria-hidden>
            {[38, 42, 36, 51, 47, 56, 49, 62, 58, 69].map((h, i) => <span key={i} className="flex-1 rounded-t bg-primary/70" style={{ height: `${h}%` }} />)}
          </div>
        </Card>
      </section>

      <section id="features" className="mx-auto grid max-w-6xl gap-5 px-6 pb-20 md:grid-cols-3">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="border-t border-border pt-5">
            <Icon className="mb-3 size-5 text-aqua" aria-hidden />
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1.5 text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        Built for the PayPal AI Hackathon 2026. All figures are demo data.
      </footer>
    </div>
  );
}
