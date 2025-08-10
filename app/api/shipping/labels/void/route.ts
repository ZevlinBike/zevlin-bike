import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { voidLabel } from "@/lib/shippo";

const BodySchema = z.object({
  shipmentId: z.string().uuid(),
});

async function requireAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false as const, supabase };

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", auth.user.id)
    .single();
  if (!customer) return { ok: false as const, supabase };

  const { data: roles } = await supabase.rpc("get_user_roles", {
    user_id: customer.id,
  });
  return { ok: !!(roles && roles.includes("admin")), supabase };
}

export async function POST(req: NextRequest) {
  const { ok, supabase } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const { data: shipment, error } = await supabase
      .from("shipments")
      .select("id, status, label_object_id")
      .eq("id", body.shipmentId)
      .single();
    if (error || !shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    if (shipment.status !== "purchased") {
      return NextResponse.json(
        { error: "Only purchased labels can be voided" },
        { status: 400 }
      );
    }

    if (!shipment.label_object_id) {
      return NextResponse.json(
        { error: "Shipment is missing Shippo transaction id" },
        { status: 400 }
      );
    }

    await voidLabel({ transactionId: shipment.label_object_id });
    const { error: updateErr } = await supabase
      .from("shipments")
      .update({ status: "voided" })
      .eq("id", body.shipmentId);
    if (updateErr) {
      return NextResponse.json({ error: "Failed to update shipment" }, { status: 500 });
    }

    await supabase.from("shipment_events").insert({
      shipment_id: body.shipmentId,
      event_code: "LABEL_VOIDED",
      description: "Label voided via admin UI",
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to void label";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

