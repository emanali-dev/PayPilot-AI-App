"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CashFlowForecast } from "@/lib/services/forecast";

export function ForecastChart({ data }: { data: CashFlowForecast[] }) {
  const rows = data.map((item) => ({ horizon: `${item.days} days`, net: item.projectedNetMinor / 100 }));
  return (
    <div className="h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="horizon" tickLine={false} axisLine={false} tick={{ fill: "#9aa9bc", fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} width={52} tick={{ fill: "#9aa9bc", fontSize: 12 }} tickFormatter={(value: number) => `$${value / 1000}k`} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{ background: "#263347", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#f5f7fb" }}
            formatter={(value: number) => [`$${value.toLocaleString("en-US")}`, "Projected net"]}
          />
          <Bar dataKey="net" name="Projected net" fill="#55c5e8" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
