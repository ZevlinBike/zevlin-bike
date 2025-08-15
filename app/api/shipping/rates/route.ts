import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getRates, type Address, type Parcel, type RateOption } from "@/lib/shippo";

const BodySchema = z.object({
  orderId: z.string().uuid(),
  packageId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // if (!body.orderId && !body.cartId) {
  //   return NextResponse.json({ error: "Provide orderId or cartId" }, { status: 400 });
  // }

  try {
    // Fetch origin address from settings
    const { data: settings } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (!settings) {
      return NextResponse.json({ error: "Store settings not configured" }, { status: 500 });
    }

    const ORIGIN: Address = {
      name: settings.shipping_origin_name,
      email: settings.shipping_origin_email,
      phone: settings.shipping_origin_phone,
      address1: settings.shipping_origin_address1,
      address2: settings.shipping_origin_address2,
      city: settings.shipping_origin_city,
      state: settings.shipping_origin_state,
      postal_code: settings.shipping_origin_postal_code,
      country: settings.shipping_origin_country,
    };

    if (body.orderId) {
      const { data: order, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          customers(first_name, last_name, email, phone),
          line_items(
            id,
            quantity,
            unit_price_cents,
            products(weight, weight_unit),
            product_variants(*)
          )
        `
        )
        .eq("id", body.orderId)
        .single();

      if (error || !order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Destination: prefer shipping_details row; fallback to order billing_*
      const { data: sd } = await supabase
        .from("shipping_details")
        .select("*")
        .eq("order_id", body.orderId)
        .maybeSingle();

      const rawCustomers = order.customers as
        | { first_name?: string; last_name?: string; email?: string; phone?: string }
        | { first_name?: string; last_name?: string; email?: string; phone?: string }[]
        | null;
      const customer = Array.isArray(rawCustomers) ? rawCustomers[0] : rawCustomers;
      const to: Address = sd
        ? {
            name:
              (sd.name as string | null) ||
              [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
              undefined,
            email: (customer?.email as string | undefined) || undefined,
            phone: (customer?.phone as string | undefined) || undefined,
            address1: (sd.address_line1 as string) || "",
            address2: (sd.address_line2 as string | null) || undefined,
            city: (sd.city as string) || "",
            state: (sd.state as string) || "",
            postal_code: (sd.postal_code as string) || "",
            country: (sd.country as string) || "US",
          }
        : {
            name:
              (order.billing_name as string | null) ||
              [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
              undefined,
            email: (customer?.email as string | undefined) || undefined,
            phone: (customer?.phone as string | undefined) || undefined,
            address1: (order.billing_address_line1 as string) || "",
            address2: (order.billing_address_line2 as string | null) || undefined,
            city: (order.billing_city as string) || "",
            state: (order.billing_state as string) || "",
            postal_code: (order.billing_postal_code as string) || "",
            country: (order.billing_country as string) || "US",
          };

      // Determine package: use the one specified in the request
      const { data: pkg } = await supabase
        .from("shipping_packages")
        .select("name,length_cm,width_cm,height_cm,weight_g")
        .eq("id", body.packageId)
        .limit(1)
        .single();

      if (!pkg) {
        return NextResponse.json(
          { error: "The selected shipping package could not be found." },
          { status: 400 }
        );
      }

      // Compute weight: base package weight + sum(item weights)
      type LI = {
        quantity: number;
        products?: { weight?: number | null; weight_unit?: string | null } | null;
        product_variants?: { id: string } | null; // Variants don't have weight
      };
      const items = (order.line_items as unknown as LI[]) || [];
      const assumedItemWeightG = 200;
      const itemsWeight = items.reduce((sum, li) => {
        const itemData = li.products; // Always use the product for weight info
        const weight = itemData?.weight;
        const unit = itemData?.weight_unit;

        if (weight && unit) {
          let weightInGrams = 0;
          switch (unit) {
            case 'g':
              weightInGrams = weight;
              break;
            case 'oz':
              weightInGrams = weight * 28.3495;
              break;
            case 'lb':
              weightInGrams = weight * 453.592;
              break;
            case 'kg':
              weightInGrams = weight * 1000;
              break;
          }
          return sum + weightInGrams * (li.quantity || 0);
        }

        return sum + assumedItemWeightG * (li.quantity || 0);
      }, 0);
      const totalWeightG = Math.max(1, (pkg.weight_g || 0) + itemsWeight);

      const parcel: Parcel = {
        length_cm: Number(pkg.length_cm) || 10,
        width_cm: Number(pkg.width_cm) || 10,
        height_cm: Number(pkg.height_cm) || 5,
        weight_g: totalWeightG,
      };

      const rates: RateOption[] = await getRates({ to, from: ORIGIN, parcel });
      return NextResponse.json({ rates, totalWeightG });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to get rates";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
