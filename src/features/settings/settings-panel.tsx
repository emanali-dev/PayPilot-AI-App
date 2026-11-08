"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleOff, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

type IntegrationKey = "gemini" | "paypal" | "supabase";
type HealthResponse = {
  ok: boolean;
  integrations: {
    gemini: boolean;
    paypal: boolean;
    supabase: boolean;
    demoMode: boolean;
    paypalWebhook: boolean;
  };
};

const integrations: { key: IntegrationKey; name: string; description: string }[] = [
  { key: "gemini", name: "Gemini", description: "AI assistant credentials" },
  { key: "paypal", name: "PayPal Sandbox", description: "PayPal API credentials" },
  { key: "supabase", name: "Supabase", description: "Database URL and public key" },
];

export function SettingsPanel() {
  const [health, setHealth] = useState<HealthResponse["integrations"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState<"USD" | "EUR" | "GBP">("USD");
  const [preferenceError, setPreferenceError] = useState("");

  useEffect(() => {
    try {
      const savedCurrency = window.localStorage.getItem("paypilot-currency");
      if (savedCurrency === "USD" || savedCurrency === "EUR" || savedCurrency === "GBP") setCurrency(savedCurrency);
    } catch {
      setPreferenceError("Could not read the preferred currency from browser storage.");
    }
    const controller = new AbortController();
    async function loadHealth() {
      try {
        const response = await fetch("/api/health", { signal: controller.signal, cache: "no-store" });
        const body: HealthResponse = await response.json();
        if (!response.ok || !body.ok) throw new Error("Could not load integration status.");
        setHealth(body.integrations);
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not load integration status.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadHealth();
    return () => controller.abort();
  }, []);

  function changeCurrency(value: string) {
    if (value !== "USD" && value !== "EUR" && value !== "GBP") {
      setPreferenceError("That currency is not supported.");
      return;
    }
    setCurrency(value);
    try {
      window.localStorage.setItem("paypilot-currency", value);
      setPreferenceError("");
    } catch {
      setPreferenceError("Could not save this preference in browser storage.");
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Profile" demo />
        <div className="grid gap-4 px-5 pb-5 pt-4 sm:grid-cols-2">
          <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Name</p><p className="mt-1 font-medium">Maya Okafor</p></div>
          <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Role</p><p className="mt-1 font-medium">Freelance designer</p></div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Preferences" demo />
        <div className="max-w-sm px-5 pb-5 pt-4">
          <label className="text-sm text-muted-foreground">Preferred currency
            <select className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground" value={currency} onChange={(event) => changeCurrency(event.target.value)}>
              {["USD", "EUR", "GBP"].map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <p className="mt-2 text-xs text-muted-foreground">Saved in this browser. Demo figures are currently denominated in USD.</p>
          {preferenceError && <p role="alert" className="mt-2 text-sm text-danger">{preferenceError}</p>}
        </div>
      </Card>

      <Card>
        <CardHeader title="Integrations" action={health?.demoMode && <Badge tone="warning">Demo mode</Badge>} />
        <div className="px-5 pb-5 pt-4">
          {loading ? (
            <p role="status" className="text-sm text-muted-foreground">Loading integration status…</p>
          ) : error ? (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              <span>{error}</span><Button variant="outline" size="sm" onClick={() => window.location.reload()}><RefreshCw className="size-4" aria-hidden />Retry</Button>
            </div>
          ) : health ? (
            <>
              <ul className="divide-y divide-border">
                {integrations.map(({ key, name, description }) => {
                  const connected = health[key];
                  const Icon = connected ? CheckCircle2 : CircleOff;
                  return (
                    <li key={key} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                      <div><p className="font-medium">{name}</p><p className="mt-0.5 text-sm text-muted-foreground">{description}</p></div>
                      <Badge tone={connected ? "success" : "neutral"}><Icon className="size-3.5" aria-hidden />{connected ? "Connected" : "Not connected"}</Badge>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Status is based on server-side credential configuration from /api/health. It does not test external API access or confirm that an account is authorized.</p>
            </>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
