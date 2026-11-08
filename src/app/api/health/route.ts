import { NextResponse } from "next/server";
import { integrationStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Shows which integrations have credentials configured. Never returns secret values. */
export function GET() {
  return NextResponse.json({ ok: true, integrations: integrationStatus() });
}
