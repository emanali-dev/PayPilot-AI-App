"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

const VIEWS = [["both", "Both"], ["income", "Income"], ["expenses", "Expenses"]] as const;
type View = (typeof VIEWS)[number][0];

export interface CashflowChartRow {
  m: string;
  income: number;
  expenses: number;
}

export function CashflowChart({ data, height = 280 }: { data: CashflowChartRow[]; height?: number }) {
  const [view, setView] = useState<View>("both");
  const show = (k: string) => view === "both" || view === k;

  return (
    <div>
      <div role="group" aria-label="Chart series" className="mb-3 inline-flex rounded-xl bg-background/60 p-1">
        {VIEWS.map(([v, label]) => (
          <button
            key={v}
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={cn("rounded-lg px-3 py-1 text-sm text-muted-foreground transition-colors", view === v && "bg-elevated text-foreground")}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ height }} className="-ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3978f6" stopOpacity={0.35} /><stop offset="100%" stopColor="#3978f6" stopOpacity={0} /></linearGradient>
              <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#55c5e8" stopOpacity={0.25} /><stop offset="100%" stopColor="#55c5e8" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="m" tickLine={false} axisLine={false} tick={{ fill: "#9aa9bc", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} width={48} tick={{ fill: "#9aa9bc", fontSize: 12 }} tickFormatter={(v: number) => `$${v / 1000}k`} />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.15)" }}
              contentStyle={{ background: "#263347", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#f5f7fb" }}
              formatter={(v: number, name: string) => [`$${v.toLocaleString("en-US")}`, name === "income" ? "Income" : "Expenses"]}
            />
            {show("income") && <Area type="monotone" dataKey="income" stroke="#3978f6" strokeWidth={2} fill="url(#gi)" />}
            {show("expenses") && <Area type="monotone" dataKey="expenses" stroke="#55c5e8" strokeWidth={2} fill="url(#ge)" />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
