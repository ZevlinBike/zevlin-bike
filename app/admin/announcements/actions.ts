"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Notification } from "@/lib/schema";

const statusValues = ["draft", "scheduled", "published", "expired", "archived"] as const;
const variantValues = ["promo", "info", "success", "warning", "danger"] as const;

const toBoolean = (v: unknown) => v === true || v === "true" || v === "on" || v === 1 || v === "1";
const toNumber = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : NaN;
};

const toIsoOrNull = (v: unknown) => {
  if (v == null || v === "") return null;
  // Accept both ISO and datetime-local strings
  const s = String(v);
  const d = new Date(s.includes("T") && !s.endsWith("Z") ? s : s);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

const FormSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  cta_label: z.string().optional().nullable(),
  cta_url: z.string().url().optional().nullable(),
  variant: z.enum(variantValues),
  priority: z.preprocess(toNumber, z.number().int().min(0).default(0)),
  status: z.enum(statusValues),
  starts_at: z.string().min(1),
  ends_at: z.string().optional().nullable(),
  dismissible: z.preprocess(toBoolean, z.boolean()).default(true),
  rotation_group: z.string().optional().nullable(),
  rotation_interval_ms: z.preprocess(toNumber, z.number().int().min(0).default(6000)),
  ticker: z.preprocess(toBoolean, z.boolean()).default(true),
  ticker_speed_px_s: z.preprocess(toNumber, z.number().int().min(1).default(60)),
  style: z.string().optional(), // JSON string from form
  audience: z.string().optional(), // comma-separated from form
});

export type State = {
  errors?: Record<string, string | undefined>;
  message?: string | null;
};

function normalizePayload(values: z.infer<typeof FormSchema>) {
  let style: Record<string, any> = {};
  if (values.style && values.style.trim().length > 0) {
    try { style = JSON.parse(values.style); } catch (e) { throw new Error("Style must be valid JSON"); }
  }
  const audience = values.audience && values.audience.trim().length > 0
    ? values.audience.split(",").map(s => s.trim()).filter(Boolean)
    : ["all"];
  const starts_at_iso = toIsoOrNull(values.starts_at);
  const ends_at_iso = toIsoOrNull(values.ends_at ?? null);
  if (!starts_at_iso) throw new Error("Invalid starts_at datetime");
  return {
    title: values.title,
    message: values.message,
    cta_label: values.cta_label ?? null,
    cta_url: values.cta_url ?? null,
    variant: values.variant,
    priority: values.priority ?? 0,
    status: values.status,
    starts_at: starts_at_iso,
    ends_at: ends_at_iso,
    dismissible: values.dismissible,
    rotation_group: values.rotation_group ?? null,
    rotation_interval_ms: values.rotation_interval_ms ?? 6000,
    ticker: values.ticker,
    ticker_speed_px_s: values.ticker_speed_px_s ?? 60,
    style,
    audience,
  } satisfies Partial<Notification>;
}

export async function getNotifications(params: {
  query?: string;
  status?: string;
  variant?: string;
  sort?: string; // e.g., "updated_at-desc" or "priority-desc"
  page?: number;
  pageSize?: number;
}): Promise<{ notifications: Notification[]; total: number }> {
  const supabase = await createClient();
  let q = supabase.from("notifications").select("*", { count: "exact" });

  if (params.query) {
    q = q.or(`title.ilike.%${params.query}%,message.ilike.%${params.query}%`);
  }
  if (params.status && params.status !== "all") {
    q = q.eq("status", params.status);
  }
  if (params.variant && params.variant !== "all") {
    q = q.eq("variant", params.variant);
  }
  // Sorting
  if (params.sort) {
    const [col, dir] = params.sort.split("-");
    q = q.order(col as any, { ascending: dir !== "desc" });
  } else {
    q = q.order("updated_at", { ascending: false });
  }

  const { data, error, count } = await q;
  if (error) {
    console.error("Error fetching notifications:", error);
    return { notifications: [], total: 0 };
  }
  return { notifications: data as Notification[], total: count ?? 0 };
}

export async function deleteNotification(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) {
    return { message: "Failed to delete notification." };
  }
  revalidatePath("/admin/announcements");
  return { message: "Deleted notification." };
}

export async function bulkUpdateNotificationStatus(ids: string[], status: (typeof statusValues)[number]) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", ids);
  if (error) {
    return { message: "Failed to update notifications." };
  }
  revalidatePath("/admin/announcements");
  return { message: "Updated notifications." };
}

export async function createAnnouncement(prev: State, formData: FormData): Promise<State> {
  const supabase = await createClient();
  const raw = Object.fromEntries(formData.entries());
  const parsed = FormSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { message: "Validation failed.", errors: Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v?.[0]])) };
  }
  try {
    const payload = normalizePayload(parsed.data);
    const { error } = await supabase.from("notifications").insert(payload);
    if (error) throw error;
    revalidatePath("/admin/announcements");
    return { message: "Created announcement." };
  } catch (e: any) {
    return { message: e?.message || "Database error creating announcement." };
  }
}

export async function updateAnnouncement(prev: State, formData: FormData): Promise<State> {
  const supabase = await createClient();
  const raw = Object.fromEntries(formData.entries());
  const parsed = FormSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { message: "Validation failed.", errors: Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v?.[0]])) };
  }
  if (!parsed.data.id) return { message: "Missing id." };
  try {
    const payload = normalizePayload(parsed.data);
    const { error } = await supabase
      .from("notifications")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", parsed.data.id);
    if (error) throw error;
    revalidatePath("/admin/announcements");
    revalidatePath(`/admin/announcements/edit/${parsed.data.id}`);
    return { message: "Updated announcement." };
  } catch (e: any) {
    return { message: e?.message || "Database error updating announcement." };
  }
}

export async function getNotificationById(id: string): Promise<Notification | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("notifications").select("*").eq("id", id).single();
  if (error) {
    console.error("Error fetching notification:", error);
    return null;
  }
  return data as Notification;
}

