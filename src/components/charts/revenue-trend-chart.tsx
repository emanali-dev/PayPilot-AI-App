"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlySummary } from "@/lib/repo/types";

export function RevenueTrendChart({ data }: { data: MonthlySummary[] }) {
  const rows = data.map((month) => ({ month: month.month, income: month.incomeMinor / 100 }));
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#9aa9bc", fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} width={52} tick={{ fill: "#9aa9bc", fontSize: 12 }} tickFormatter={(value: number) => `$${value / 1000}k`} />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.15)" }}
            contentStyle={{ background: "#263347", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#f5f7fb" }}
            formatter={(value: number) => [`$${value.toLocaleString("en-US")}`, "Revenue"]}
          />
          <Line type="monotone" dataKey="income" name="Revenue" stroke="#3978f6" strokeWidth={2.5} dot={{ fill: "#3978f6", r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
