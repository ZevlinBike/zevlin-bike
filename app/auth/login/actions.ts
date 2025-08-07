"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const loginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export async function login(formData: unknown) {
  const validatedFields = loginFormSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword(validatedFields.data);

  if (error) {
    return {
      errors: { _form: [error.message] },
    };
  }

  redirect("/checkout");
}
