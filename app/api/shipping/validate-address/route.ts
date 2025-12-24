import { NextResponse } from "next/server";
import { z } from "zod";
import { validateAddress, type Address } from "@/lib/shippo";
import { env } from "@/lib/env";

const addressSchema = z.object({
  name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address1: z.string(),
  address2: z.string().optional().nullable(),
  city: z.string(),
  state: z.string(),
  postal_code: z.string(),
  country: z.string().default('US'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = addressSchema.safeParse(body?.address ?? body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, messages: ["Invalid address payload"] }, { status: 400 });
    }
    // Allow a test token when navigating from admin/testing
    const ref = (typeof req.headers.get === 'function' ? req.headers.get('referer') : null) || '';
    const isTesting = ref.includes('/admin/testing');
    const token = isTesting ? (process.env.SHIPPO_TEST_API_TOKEN || env.SHIPPO_TEST_API_TOKEN || env.SHIPPO_API_TOKEN) : env.SHIPPO_API_TOKEN;
    const result = await validateAddress(parsed.data as Address, token ? { token } : undefined);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, messages: [(e as Error)?.message || 'Failed to validate address'] }, { status: 500 });
  }
}
