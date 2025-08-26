"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function checkAdminRole(): Promise<{ isAdmin: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false };
  }

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (customerError || !customer) {
    return { isAdmin: false };
  }

  const { data: userRoles, error: rolesError } = await supabase.rpc(
    "get_user_roles",
    {
      user_id: customer.id,
    },
  );

  if (rolesError) {
    return { isAdmin: false };
  }

  const isAdmin = userRoles?.includes("admin");

  return { isAdmin: !!isAdmin };
}

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Not authenticated. Please try the password reset process again.",
    };
  }

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0].message,
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  redirect("/");
}
