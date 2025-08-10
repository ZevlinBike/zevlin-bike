"use server";

import { createClient } from "@/lib/supabase/server";

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

export async function deletePackage(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("shipping_packages").delete().eq("id", id);
  if (error) throw new Error(error.message || "Failed to delete package");
}

export async function setDefaultPackage(id: string) {
  const supabase = await createClient();
  // Clear previous default and set this one
  const { error: e1 } = await supabase.from("shipping_packages").update({ is_default: false }).eq("is_default", true);
  if (e1) throw new Error(e1.message || "Failed to update defaults");
  const { error: e2 } = await supabase.from("shipping_packages").update({ is_default: true }).eq("id", id);
  if (e2) throw new Error(e2.message || "Failed to set default");
}

