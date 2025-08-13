
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
  const supabase = createClient();
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

export async function createNewsletter(prevState: any, formData: FormData) {
  const supabase = createClient();
  const subject = formData.get("subject") as string;
  const content = formData.get("content") as string;

  const { error } = await supabase
    .from("newsletters")
    .insert([{ subject, content }]);

  if (error) {
    return { message: "Error creating newsletter", error: error.message };
  }

  revalidatePath("/admin/newsletter");
  return { message: "Newsletter created successfully" };
}

export async function getNewsletter(id: string): Promise<Newsletter | null> {
  const supabase = createClient();
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

export async function updateNewsletter(prevState: any, formData: FormData) {
  const supabase = createClient();
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
