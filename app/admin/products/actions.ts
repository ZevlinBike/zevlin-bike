"use server";

import { createClient } from "@/lib/supabase/server";
import { Product } from "@/lib/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  price: z.coerce.number(),
  slug: z.string(),
});

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .order("name");

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  // Ensure product_images is always an array
  return data.map((product) => ({
    ...product,
    product_images: Array.isArray(product.product_images)
      ? product.product_images
      : product.product_images ? [product.product_images] : [],
  })) as any[];
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .limit(3);

  if (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }

  // Ensure product_images is always an array
  return data.map((product) => ({
    ...product,
    product_images: Array.isArray(product.product_images)
      ? product.product_images
      : product.product_images ? [product.product_images] : [],
  })) as any[];
}

export async function addOrUpdateProduct(formData: FormData) {
  const supabase = await createClient();
  const rawData = Object.fromEntries(formData.entries());

  const validated = productSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: "Invalid product data." };
  }
  const { id, name, description, price, slug } = validated.data;

  // 1. Upsert the product details
  const { data: productData, error: productError } = await supabase
    .from("products")
    .upsert({
      id: id || undefined,
      name,
      description,
      price_cents: price,
      slug,
    })
    .select()
    .single();

  if (productError) {
    console.error("Error upserting product:", productError);
    return { error: "Could not save product details." };
  }

  // 2. Handle multiple image uploads
  const imageFiles = formData.getAll("images") as File[];
  if (imageFiles.length > 0 && imageFiles[0].size > 0) {
    for (const [index, file] of imageFiles.entries()) {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
      const filePath = `${productData.id}/${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error(`Error uploading image ${file.name}:`, uploadError);
        // Continue to next file, but maybe collect errors to show the user
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);

      // Insert a new record for each image
      const { error: imageError } = await supabase
        .from("product_images")
        .insert({
          product_id: productData.id,
          url: publicUrl,
          // Mark the first uploaded image as featured
          is_featured: index === 0, 
        });

      if (imageError) {
        console.error(`Error saving image URL for ${file.name}:`, imageError);
      }
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);

  return { success: true };
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();

  // Note: We are not deleting the image from storage here,
  // as other products might be using it in the future.
  // A more robust system would have a cleanup process for orphaned images.

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    console.error("Error deleting product:", error);
    return { error: "Could not delete product." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");

  return { success: true };
}
