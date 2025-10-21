import { NextResponse } from "next/server";
import { getCarrierIds } from "@/lib/shipengine";
import { env } from "@/lib/env";

export async function GET() {
  if (env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'ShipEngine is disabled in this environment' }, { status: 501 });
  }
  try {
    const ids = await getCarrierIds();
    return NextResponse.json({ carrierIds: ids });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load ShipEngine carriers';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
