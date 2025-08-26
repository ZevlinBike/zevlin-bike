"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("*")
    .order("sort_order");
  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
  return data;
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("product_categories").insert([
    {
      name: formData.get("name"),
      slug: formData.get("slug"),
      sort_order: Number(formData.get("sort_order") || 0),
      active: formData.get("active") === "on",
      show_in_footer: formData.get("show_in_footer") === "on",
    },
  ]);
  if (error) {
    console.error("Error creating category:", error);
    return { error: error.message };
  }
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
  return { success: true };
}

export async function updateCategory(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id");
  const { error } = await supabase
    .from("product_categories")
    .update({
      name: formData.get("name"),
      slug: formData.get("slug"),
      sort_order: Number(formData.get("sort_order") || 0),
      active: formData.get("active") === "on",
      show_in_footer: formData.get("show_in_footer") === "on",
    })
    .eq("id", id);
  if (error) {
    console.error("Error updating category:", error);
    return { error: error.message };
  }
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  // Note: products with this category_id will be set to NULL via FK behavior
  const { error } = await supabase
    .from("product_categories")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("Error deleting category:", error);
    return { error: error.message };
  }
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
  return { success: true };
}

