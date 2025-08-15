"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function listPackages() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shipping_packages")
    .select("*")
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw new Error("Failed to load packages");
  return data || [];
}

export async function createPackage(input: {
  name: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  weight_g: number;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("shipping_packages").insert({
    name: input.name,
    length_cm: input.length_cm,
    width_cm: input.width_cm,
    height_cm: input.height_cm,
    weight_g: input.weight_g,
  });
  if (error) throw new Error(error.message || "Failed to create package");
}

export async function updatePackage(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const length_in = Number(formData.get("length_in") || 0);
  const width_in = Number(formData.get("width_in") || 0);
  const height_in = Number(formData.get("height_in") || 0);
  const weight_oz = Number(formData.get("weight_oz") || 0);

  if (!id || !name || !length_in || !width_in || !height_in) return;

  const length_cm = length_in * 2.54;
  const width_cm = width_in * 2.54;
  const height_cm = height_in * 2.54;
  const weight_g = weight_oz * 28.3495;

  const supabase = await createClient();
  const { error } = await supabase
    .from("shipping_packages")
    .update({
      name,
      length_cm,
      width_cm,
      height_cm,
      weight_g,
    })
    .eq("id", id);

  if (error) throw new Error(error.message || "Failed to update package");
  revalidatePath("/admin/settings/packages");
}

export async function deletePackage(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("shipping_packages").delete().eq("id", id);
  if (error) throw new Error(error.message || "Failed to delete package");
  revalidatePath("/admin/settings/packages");
}

export async function setDefaultPackage(id: string) {
  const supabase = await createClient();
  // Clear previous default and set this one
  const { error: e1 } = await supabase.from("shipping_packages").update({ is_default: false }).eq("is_default", true);
  if (e1) throw new Error(e1.message || "Failed to update defaults");
  const { error: e2 } = await supabase.from("shipping_packages").update({ is_default: true }).eq("id", id);
  if (e2) throw new Error(e2.message || "Failed to set default");
  revalidatePath("/admin/settings/packages");
}