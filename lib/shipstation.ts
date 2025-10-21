// ShipStation server wrapper. Only use server-side.
import { env } from "./env";

type Address = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address1: string;
  address2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string; // ISO2
};

type Parcel = {
  weight_g: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
};

export type SSRate = {
  carrierCode: string;
  serviceCode: string;
  serviceName: string;
  shipmentCost: number; // in currency units
  otherCost?: number;
  currency?: string;
  deliveryDays?: number | null;
};

export type SSLabelResult = {
  trackingNumber: string | null;
  labelUrl: string | null; // prefer labelDownload.href; fallback to data URL
  carrierCode: string | null;
  serviceCode: string | null;
  serviceName?: string | null;
};

function authHeader() {
  const key = env.SHIPSTATION_API_KEY;
  const secret = env.SHIPSTATION_API_SECRET;
  if (!key || !secret) throw new Error("ShipStation API credentials not configured");
  const b64 = Buffer.from(`${key}:${secret}`).toString("base64");
  return { Authorization: `Basic ${b64}` };
}

function toLbOz(g: number) {
  const oz = Math.max(1, Math.round(g / 28.3495));
  const lb = Math.floor(oz / 16);
  return { pounds: lb, ounces: oz - lb * 16 };
}

export async function getRates(input: { to: Address; from: Address; parcel: Parcel; carrierCode?: string }): Promise<SSRate[]> {
  const useMock = (env.NODE_ENV === 'development');
  if (useMock) {
    const oz = Math.max(1, Math.round(input.parcel.weight_g / 28.3495));
    const base = Math.max(3, Math.round(oz / 8));
    return [
      {
        carrierCode: input.carrierCode || env.SHIPSTATION_DEFAULT_CARRIER_CODE || 'stamps_com',
        serviceCode: 'usps_first_class_mail',
        serviceName: 'USPS First Class',
        shipmentCost: base + 3.25,
        currency: 'USD',
        deliveryDays: 5,
      },
      {
        carrierCode: input.carrierCode || env.SHIPSTATION_DEFAULT_CARRIER_CODE || 'stamps_com',
        serviceCode: 'usps_priority_mail',
        serviceName: 'USPS Priority Mail',
        shipmentCost: base + 7.95,
        currency: 'USD',
        deliveryDays: 3,
      },
    ];
  }

  const url = "https://ssapi.shipstation.com/shipments/getrates";
  const w = toLbOz(input.parcel.weight_g);
  const body = {
    carrierCode: input.carrierCode || env.SHIPSTATION_DEFAULT_CARRIER_CODE || undefined,
    fromPostalCode: input.from.postal_code,
    toState: input.to.state,
    toCountry: input.to.country,
    toPostalCode: input.to.postal_code,
    toCity: input.to.city,
    weight: { units: "ounces", value: w.pounds * 16 + w.ounces },
    dimensions: { units: "centimeters", length: input.parcel.length_cm, width: input.parcel.width_cm, height: input.parcel.height_cm },
    confirmation: "none",
    residential: true,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", Accept: "application/json", ...authHeader() },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (data && (data.message || data.error || data.ExceptionMessage)) || res.statusText;
    throw new Error(`ShipStation rates failed: ${msg}`);
  }
  const arr = Array.isArray(data)
    ? (data as unknown[])
    : (Array.isArray((data as Record<string, unknown>)?.rates) ? ((data as Record<string, unknown>).rates as unknown[]) : []);
  return arr.map((r) => {
    const obj = r as Record<string, unknown>;
    return {
      carrierCode: obj.carrierCode as string,
      serviceCode: obj.serviceCode as string,
      serviceName: (obj.serviceName as string | undefined) || (obj.serviceCode as string),
      shipmentCost: Number((obj.shipmentCost as number | string | undefined) ?? (obj.rate as number | string | undefined) ?? 0),
      otherCost: Number((obj.otherCost as number | string | undefined) ?? 0),
      currency: (obj.currency as string | undefined) || "USD",
      deliveryDays: (obj.deliveryDays as number | null | undefined) ?? null,
    } as SSRate;
  });
}

export async function createLabel(input: {
  to: Address;
  from: Address;
  parcel: Parcel;
  carrierCode?: string;
  serviceCode?: string;
  packageCode?: string;
}): Promise<SSLabelResult> {
  const useMock = (env.NODE_ENV === 'development');
  if (useMock) {
    // Return a data URL image label with a fake tracking number
    const png1x1 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AApcB9m8G3bQAAAAASUVORK5CYII=";
    return {
      trackingNumber: `MOCK${Date.now()}`,
      labelUrl: `data:image/png;base64,${png1x1}`,
      carrierCode: input.carrierCode || env.SHIPSTATION_DEFAULT_CARRIER_CODE || 'stamps_com',
      serviceCode: input.serviceCode || env.SHIPSTATION_DEFAULT_SERVICE_CODE || 'usps_priority_mail',
      serviceName: 'Mock Label',
    };
  }
  const url = "https://ssapi.shipstation.com/shipments/createlabel";
  const w = toLbOz(input.parcel.weight_g);
  const body = {
    carrierCode: input.carrierCode || env.SHIPSTATION_DEFAULT_CARRIER_CODE,
    serviceCode: input.serviceCode || env.SHIPSTATION_DEFAULT_SERVICE_CODE,
    packageCode: input.packageCode || env.SHIPSTATION_DEFAULT_PACKAGE_CODE || "package",
    shipFrom: {
      name: input.from.name || undefined,
      phone: input.from.phone || undefined,
      street1: input.from.address1,
      street2: input.from.address2 || undefined,
      city: input.from.city,
      state: input.from.state,
      postalCode: input.from.postal_code,
      country: input.from.country,
    },
    shipTo: {
      name: input.to.name || undefined,
      phone: input.to.phone || undefined,
      street1: input.to.address1,
      street2: input.to.address2 || undefined,
      city: input.to.city,
      state: input.to.state,
      postalCode: input.to.postal_code,
      country: input.to.country,
      residential: true,
    },
    weight: { units: "ounces", value: w.pounds * 16 + w.ounces },
    dimensions: { units: "centimeters", length: input.parcel.length_cm, width: input.parcel.width_cm, height: input.parcel.height_cm },
    testLabel: false,
    labelFormat: "PDF", // ensure URL form is available
    labelDownloadType: "url",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Accept: "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.message || data.error || data.ExceptionMessage)) || res.statusText;
    throw new Error(`ShipStation create label failed: ${msg}`);
  }

  // Try common shapes (real + mock)
  const href = (data?.labelDownload?.href as string | undefined)
    || (data?.labelUrl as string | undefined)
    || (data?.label?.url as string | undefined)
    || (data?.url as string | undefined)
    || null;
  let labelUrl: string | null = href;
  if (!labelUrl && data?.labelData && typeof data.labelData === "string") {
    // labelData is base64 PDF
    labelUrl = `data:application/pdf;base64,${data.labelData}`;
  }
  return {
    trackingNumber: (data?.trackingNumber as string | undefined) || null,
    labelUrl,
    carrierCode: (data?.carrierCode as string | undefined) || null,
    serviceCode: (data?.serviceCode as string | undefined) || null,
    serviceName: (data?.serviceName as string | undefined) || null,
  };
}
