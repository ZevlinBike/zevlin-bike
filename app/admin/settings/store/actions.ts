"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const FormSchema = z.object({
  shipping_origin_name: z.string().min(1),
  shipping_origin_phone: z.string().optional(),
  shipping_origin_email: z.string().email(),
  shipping_origin_address1: z.string().min(1),
  shipping_origin_address2: z.string().optional(),
  shipping_origin_city: z.string().min(1),
  shipping_origin_state: z.string().min(1),
  shipping_origin_postal_code: z.string().min(1),
  shipping_origin_country: z.string().min(1),
});

export async function getStoreSettings() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .single();
  return data;
}

export async function updateStoreSettings(formData: FormData) {
  const validatedFields = FormSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("store_settings")
    .update(validatedFields.data)
    .eq("id", 1);

  if (error) {
    return {
      errors: { _form: ["Could not update store settings."] },
    };
  }

  revalidatePath("/admin/settings/store");
  return { success: true };
}
