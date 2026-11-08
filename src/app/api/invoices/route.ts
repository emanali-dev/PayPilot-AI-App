import { NextResponse } from "next/server";
import { z } from "zod";
import { demoRepository } from "@/lib/repo/demo";

export const dynamic = "force-dynamic";

const invoiceInput = z.object({
  clientId: z.string().min(1),
  currency: z.enum(["USD", "EUR", "GBP"]),
  dueDate: z.string().date(),
  lineItems: z.array(z.object({
    description: z.string().trim().min(1).max(160),
    quantity: z.number().int().min(1).max(1000),
    unitAmountMinor: z.number().int().positive().max(100_000_000),
  })).min(1).max(20),
});

export async function POST(request: Request) {
  const parsed = invoiceInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invoice details are invalid.", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const invoice = await demoRepository.createInvoice(parsed.data);
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The invoice could not be created.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
