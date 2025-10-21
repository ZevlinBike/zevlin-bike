import { env } from "./env";

export type Address = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address1: string;
  address2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

export type Parcel = {
  weight_g: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
};

export type Rate = {
  rateId: string;
  carrier: string;
  service: string;
  amountCents: number;
  currency: string;
  estimatedDays?: number;
};

function headers() {
  const key = env.SHIPENGINE_API_KEY || process.env.SHIPENGINE_API_KEY;
  if (!key) throw new Error("SHIPENGINE_API_KEY is not configured");
  return {
    "content-type": "application/json",
    Accept: "application/json",
    "API-Key": key,
  } as Record<string, string>;
}

function toLbOz(g: number) {
  const oz = Math.max(1, Math.round(g / 28.3495));
  const lb = Math.floor(oz / 16);
  return { pounds: lb, ounces: oz - lb * 16 };
}

function normalizeAddress(a: Address) {
  return {
    name: a.name || undefined,
    phone: a.phone || undefined,
    address_line1: a.address1,
    address_line2: a.address2 || undefined,
    city_locality: a.city,
    state_province: a.state,
    postal_code: a.postal_code,
    country_code: a.country,
  };
}

export async function getCarrierIds(): Promise<string[]> {
  if (env.SHIPENGINE_CARRIER_IDS) {
    const ids = env.SHIPENGINE_CARRIER_IDS.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length > 0) return ids;
  }
  const res = await fetch("https://api.shipengine.com/v1/carriers", { headers: headers(), cache: "no-store" });
  const data = await res.json().catch(() => [] as unknown[]);
  if (!res.ok) throw new Error((data && (data.message || data.error)) || "Failed to load carriers");
  const ids = (Array.isArray(data) ? data : []).map((c) => (c as { carrier_id?: string }).carrier_id).filter(Boolean) as string[];
  if (ids.length === 0) {
    throw new Error("No ShipEngine carriers connected. Set SHIPENGINE_CARRIER_IDS or connect a carrier in ShipEngine sandbox.");
  }
  return ids;
}

export async function getRates(input: { to: Address; from: Address; parcel: Parcel }): Promise<Rate[]> {
  const carrierIds = await getCarrierIds();
  const w = toLbOz(input.parcel.weight_g);
  const body = {
    shipment: {
      ship_to: normalizeAddress(input.to),
      ship_from: normalizeAddress(input.from),
      packages: [
        {
          weight: { value: w.pounds * 16 + w.ounces, unit: "ounce" },
          dimensions: { unit: "centimeter", length: input.parcel.length_cm, width: input.parcel.width_cm, height: input.parcel.height_cm },
        },
      ],
    },
    rate_options: {
      carrier_ids: carrierIds,
    },
  };

  const res = await fetch("https://api.shipengine.com/v1/rates", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: unknown = {};
  try { data = JSON.parse(text); } catch { data = { raw: text } as { raw: string }; }
  if (!res.ok) {
    const msg = (data && (data as Record<string, unknown>).error) || (data as Record<string, unknown>).message || (data as { raw?: string }).raw || res.statusText;
    throw new Error(`ShipEngine rates failed: ${msg}`);
  }
  const rr = (data as { rate_response?: { rates?: unknown[] } }).rate_response;
  const rates = Array.isArray(rr?.rates) ? rr!.rates! : [];
  return rates.map((r) => {
    const obj = r as Record<string, unknown>;
    const shippingAmt = (obj.shipping_amount as Record<string, unknown>) || {};
    const amount = typeof shippingAmt.amount === 'number' ? shippingAmt.amount : Number(obj.amount || 0);
    return {
      rateId: String(obj.rate_id || ''),
      carrier: String(obj.carrier_friendly_name || obj.carrier_id || obj.carrier_code || ''),
      service: String(obj.service_type || obj.service_code || obj.service_type_code || ''),
      amountCents: Math.round((Number.isFinite(amount) ? (amount as number) : 0) * 100),
      currency: String((shippingAmt.currency as string | undefined) || (obj.currency as string | undefined) || 'USD'),
      estimatedDays: typeof obj.delivery_days === 'number' ? (obj.delivery_days as number) : undefined,
    } as Rate;
  });
}

export async function purchaseLabelByRate(rateId: string): Promise<{ labelUrl: string | null; trackingNumber: string | null; carrier?: string; service?: string }> {
  const res = await fetch(`https://api.shipengine.com/v1/labels/rates/${rateId}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ label_format: "pdf" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || res.statusText;
    throw new Error(`ShipEngine label failed: ${msg}`);
  }
  const href = (data?.label_download?.href as string | undefined)
    || (data?.label_pdf as string | undefined)
    || (data?.label_url as string | undefined)
    || null;
  const tracking = (data?.tracking_number as string | undefined) || null;
  return { labelUrl: href, trackingNumber: tracking, carrier: data?.carrier_id, service: data?.service_code };
}
