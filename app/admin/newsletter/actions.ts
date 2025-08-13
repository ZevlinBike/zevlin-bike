
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Newsletter {
  id: string;
  subject: string;
  content: string;
  created_at: string;
}

export async function getNewsletters(): Promise<Newsletter[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("newsletters")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching newsletters:", error);
    return [];
  }

  return data;
}

export async function getNewsletterSignupCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("newsletter_signups")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error fetching newsletter signup count:", error);
    return 0;
  }

  return count ?? 0;
}

export type ActionState = { message: string; error?: string };

export async function createNewsletter(
  prevState: ActionState,
  formData: FormData
) {
  const supabase = await createClient();
  const subject = formData.get("subject") as string;
  const content = formData.get("content") as string;

  // Debug: log current roles for the authenticated user
  try {
    const { data: roles } = await supabase.rpc("get_roles_for_auth_user");
    console.log("[createNewsletter] Roles:", roles);
  } catch (e) {
    console.warn("[createNewsletter] Could not fetch roles via RPC", e);
  }

  console.log("[createNewsletter] Attempting insert:", {
    subject,
    contentLength: content?.length ?? 0,
  });

  const { error } = await supabase
    .from("newsletters")
    .insert([{ subject, content }]);

  console.log({error})

  if (error) {
    console.error("[createNewsletter] Insert failed:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { message: "Error creating newsletter", error: error.message };
  }

  revalidatePath("/admin/newsletter");
  return { message: "Newsletter created successfully" };
}

export async function getNewsletter(id: string): Promise<Newsletter | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("newsletters")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching newsletter:", error);
    return null;
  }

  return data;
}

export async function updateNewsletter(
  prevState: ActionState,
  formData: FormData
) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const subject = formData.get("subject") as string;
  const content = formData.get("content") as string;

  const { error } = await supabase
    .from("newsletters")
    .update({ subject, content })
    .eq("id", id);

  if (error) {
    return { message: "Error updating newsletter", error: error.message };
  }

  revalidatePath("/admin/newsletter");
  revalidatePath(`/admin/newsletter/edit/${id}`);
  return { message: "Newsletter updated successfully" };
}

export async function sendNewsletter(
  prevState: ActionState,
  formData: FormData
) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  console.log("[sendNewsletter] Start", { id });
  if (!id) {
    console.error("[sendNewsletter] Missing id in formData");
    return { message: "Missing newsletter id" };
  }

  const { data: newsletter, error: nErr } = await supabase
    .from("newsletters")
    .select("id, subject, content")
    .eq("id", id)
    .single();

  if (nErr || !newsletter) {
    console.error("[sendNewsletter] Failed to fetch newsletter", nErr);
    return { message: "Unable to load newsletter" };
  }

  const { data: signups, error: sErr } = await supabase
    .from("newsletter_signups")
    .select("email");

  if (sErr) {
    console.error("[sendNewsletter] Failed to fetch signups", sErr);
    return { message: "Unable to load recipients" };
  }

  const recipients = (signups ?? []).map((s) => s.email).filter(Boolean) as string[];
  if (recipients.length === 0) {
    console.warn("[sendNewsletter] No recipients found");
    return { message: "No signups to send to" };
  }

  // Use newsletter.content as HTML in the email body
  const html = newsletter.content;

  const { sendTransactionalEmail } = await import("@/lib/brevo");

  const results = await Promise.allSettled(
    recipients.map((email) =>
      sendTransactionalEmail({ email, name: email }, newsletter.subject, html)
    )
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - succeeded;

  console.log("[sendNewsletter] Completed", { total: results.length, succeeded, failed });

  revalidatePath("/admin/newsletter");
  return { message: `Sent to ${succeeded} signups (${failed} failed)` };
}
