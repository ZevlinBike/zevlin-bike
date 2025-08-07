"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const profileFormSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
});

export async function createProfile(formData: unknown) {
  const validatedFields = profileFormSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  const { error } = await supabase.from("customers").insert({
    first_name: validatedFields.data.firstName,
    last_name: validatedFields.data.lastName,
    phone: validatedFields.data.phone,
    email: user.email,
    auth_user_id: user.id,
  });

  if (error) {
    return { errors: { _form: ["Could not create profile."] } };
  }

  redirect("/checkout");
}
