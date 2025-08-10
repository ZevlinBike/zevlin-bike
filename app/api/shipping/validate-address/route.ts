import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateAddress, type Address } from "@/lib/shippo";

const BodySchema = z.object({
  address: z.object({
    name: z.string().optional().nullable(),
    address1: z.string(),
    address2: z.string().optional().nullable(),
    city: z.string(),
    state: z.string(),
    postal_code: z.string(),
    country: z.string().default("US"),
    phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
  }),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  try {
    const result = await validateAddress(body.address as Address);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

