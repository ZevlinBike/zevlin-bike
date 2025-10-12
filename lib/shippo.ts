// Server-side Shippo client wrapper. Do not import in client components.
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
  country: string; // ISO 2, e.g., "US"
};

export type Parcel = {
  weight_g: number; // total shipment weight in grams
  length_cm: number;
  width_cm: number;
  height_cm: number;
};

export type RateOption = {
  rateObjectId: string;
  carrier: string;
  service: string;
  amountCents: number;
  currency: string;
  estimatedDays?: number;
};

type GetRatesInput = {
  to: Address;
  from: Address;
  parcel: Parcel;
};

type PurchaseLabelInput = {
  rateId: string; // Shippo rate object_id
};

type VoidLabelInput = {
  transactionId: string; // Shippo transaction (label) object_id
};

type TrackInput = {
  carrier: string;
  tracking_number: string;
};

export type PurchaseResult = {
  labelUrl: string;
  trackingNumber: string;
  trackingUrl: string | null;
  carrier: string;
  service: string;
  amountCents?: number;
  currency?: string;
  transactionId: string;
  rateObjectId?: string;
};

export type AddressValidation = {
  isValid: boolean;
  messages?: string[];
  suggested?: Partial<Address>;
  isComplete?: boolean;
  normalized?: Partial<Address>;
};



export async function validateAddress(addr: Address, opts?: { token?: string }): Promise<AddressValidation> {
  // Use REST directly to avoid SDK import quirks for this simple validation.
  const token = opts?.token || env.SHIPPO_API_TOKEN;
  if (!token) {
    return { isValid: false, messages: ["SHIPPO_API_TOKEN is not configured"] };
  }
  const payload = { ...normalizeAddress(addr), validate: true };
  try {
    const res = await fetch("https://api.goshippo.com/addresses/", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Accept: "application/json",
        Authorization: `ShippoToken ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data?.detail || data?.message || res.statusText;
      throw new Error(`API error occurred: Status ${res.status} ${msg ? "- " + msg : ""}`);
    }
    const vr = data?.validation_results || data?.validation || {};
    const isValid = Boolean(vr?.is_valid ?? vr?.isValid ?? data?.is_valid);
    const isComplete = Boolean(data?.is_complete ?? data?.isComplete ?? undefined);
    const suggestions = Array.isArray(vr?.messages)
      ? vr.messages
      : Array.isArray(data?.messages)
      ? data.messages
      : [];
    const messages = suggestions
      .map((m: { text: string, message: string }) => m?.text || m?.message)
      .filter(Boolean);
    // Normalized/corrected version from Shippo (always compute)
    const normalized: Partial<Address> = {
      address1: data?.street1,
      address2: data?.street2,
      city: data?.city,
      state: data?.state,
      postal_code: data?.zip,
      country: data?.country || addr.country,
    };

    // Only surface a suggestion when incomplete and different
    let suggested: AddressValidation["suggested"] = undefined;
    if (!data?.is_complete) {
      if (differsFromInput(normalized, addr)) {
        suggested = normalized;
      }
    }

    const normalizedOut = differsFromInput(normalized, addr) ? normalized : undefined;
    return { isValid, messages, suggested, isComplete, normalized: normalizedOut };
  } catch (err) {
    return { isValid: false, messages: [normalizeError(err, "Address validation failed").message] };
  }
}

export async function getRates(input: GetRatesInput, opts?: { token?: string }): Promise<RateOption[]> {
  const token = opts?.token || env.SHIPPO_API_TOKEN;
  if (!token) {
    throw new Error("SHIPPO_API_TOKEN is not configured");
  }
  try {
    const shipmentPayload = {
      address_from: normalizeAddress(input.from),
      address_to: normalizeAddress(input.to),
      parcels: [normalizeParcel(input.parcel)],
      async: false,
    };

    const res = await fetch("https://api.goshippo.com/shipments/", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Accept: "application/json",
        Authorization: `ShippoToken ${token}`,
      },
      body: JSON.stringify(shipmentPayload),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = data?.detail || data?.message || res.statusText;
      throw new Error(`API error occurred: Status ${res.status} ${msg ? "- " + msg : ""}`);
    }

    const rates: Record<string, unknown>[] = data?.rates || [];
    return rates.map((r) => normalizeRate(r));
  } catch (err) {
    throw normalizeError(err, "Failed to fetch shipping rates");
  }
}

export async function purchaseLabel(
  input: PurchaseLabelInput,
  opts?: { token?: string }
): Promise<PurchaseResult> {
  const token = opts?.token || env.SHIPPO_API_TOKEN;
  if (!token) {
    throw new Error("SHIPPO_API_TOKEN is not configured");
  }
  try {
    const res = await fetch("https://api.goshippo.com/transactions/", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Accept: "application/json",
        Authorization: `ShippoToken ${token}`,
      },
      body: JSON.stringify({ rate: input.rateId, async: false }),
    });
    const tx = await res.json();

    if (!res.ok || (tx?.status && String(tx.status).toUpperCase() !== "SUCCESS")) {
      const msg = tx?.messages?.[0]?.text || tx?.detail || tx?.message || "Label purchase not successful";
      throw new Error(msg);
    }

    return {
      labelUrl: tx?.label_url,
      trackingNumber: tx?.tracking_number,
      trackingUrl: tx?.tracking_url_provider ?? null,
      carrier: tx?.rate?.provider || tx?.carrier || "",
      service: tx?.rate?.servicelevel?.name || tx?.servicelevel || "",
      amountCents: toCents(tx?.rate?.amount),
      currency: tx?.rate?.currency,
      transactionId: tx?.object_id,
      rateObjectId: tx?.rate?.object_id,
    } as PurchaseResult;
  } catch (err) {
    throw normalizeError(err, "Failed to purchase shipping label");
  }
}

export async function voidLabel(input: VoidLabelInput, opts?: { token?: string }): Promise<{ status: string }>
{
  const token = opts?.token || env.SHIPPO_API_TOKEN;
  if (!token) {
    throw new Error("SHIPPO_API_TOKEN is not configured");
  }
  try {
    const res = await fetch("https://api.goshippo.com/refunds/", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Accept: "application/json",
        Authorization: `ShippoToken ${token}`,
      },
      body: JSON.stringify({ transaction: input.transactionId, async: false }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data?.detail || data?.message || res.statusText;
      throw new Error(`API error occurred: Status ${res.status} ${msg ? "- " + msg : ""}`);
    }
    return { status: data?.status || "voided" };
  } catch (err) {
    throw normalizeError(err, "Failed to void shipping label");
  }
}

export async function track(input: TrackInput, opts?: { token?: string }): Promise<unknown> {
  const token = opts?.token || env.SHIPPO_API_TOKEN;
  if (!token) {
    throw new Error("SHIPPO_API_TOKEN is not configured");
  }
  try {
    const res = await fetch(
      `https://api.goshippo.com/tracks/${input.carrier}/${input.tracking_number}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `ShippoToken ${token}`,
        },
      }
    );
    const data = await res.json();
    if (!res.ok) {
      const msg = data?.detail || data?.message || res.statusText;
      throw new Error(`API error occurred: Status ${res.status} ${msg ? "- " + msg : ""}`);
    }
    return data;
  } catch (err) {
    throw normalizeError(err, "Failed to fetch tracking status");
  }
}

function normalizeAddress(a: Address) {
  return {
    name: a.name || undefined,
    phone: a.phone || undefined,
    email: a.email || undefined,
    street1: a.address1,
    street2: a.address2 || undefined,
    city: a.city,
    state: a.state,
    zip: a.postal_code,
    country: a.country,
    validate: true,
  };
}

function normalizeParcel(p: Parcel) {
  return {
    length: round1(p.length_cm),
    width: round1(p.width_cm),
    height: round1(p.height_cm),
    distance_unit: "cm",
    weight: Math.max(1, Math.round(p.weight_g)),
    mass_unit: "g",
  };
}

function normalizeRate(r: Record<string, unknown>): RateOption {
  const amount = toCents(r?.amount);
  const service = (r?.servicelevel as Record<string, unknown>)?.name as string || (r?.servicelevel as Record<string, unknown>)?.token as string || r?.service as string || "";
  return {
    rateObjectId: r?.object_id as string || r?.objectId as string || r?.id as string,
    carrier: r?.provider as string || r?.carrier as string || "",
    service,
    amountCents: amount,
    currency: r?.currency as string || "USD",
    estimatedDays: r?.estimated_days as number ?? r?.days as number,
  };
}

function toCents(amount: unknown): number {
  const n = typeof amount === "string" ? parseFloat(amount) : (amount as number);
  if (!n || Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function normalizeError(err: unknown, message: string) {
  const detail =
    err instanceof Error ? err.message : "Unknown error";
  const e = new Error(`${message}: ${detail ?? "Unknown error"}`);
  return e;
}

function normalizeStr(s?: string | null) {
  return (s ?? "").toString().trim().toLowerCase();
}

function differsFromInput(candidate: Partial<Address>, input: Address) {
  return (
    normalizeStr(candidate.address1) !== normalizeStr(input.address1) ||
    normalizeStr(candidate.city) !== normalizeStr(input.city) ||
    normalizeStr(candidate.state) !== normalizeStr(input.state) ||
    normalizeStr(candidate.postal_code) !== normalizeStr(input.postal_code) ||
    normalizeStr(candidate.country) !== normalizeStr(input.country)
  );
}
