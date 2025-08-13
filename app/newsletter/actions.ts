
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function signUp(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  if (!email) {
    return { message: "Email is required" };
  }

  const { error } = await supabase
    .from("newsletter_signups")
    .insert([{ email }]);

  console.log({error})

  if (error) {
    if (error.code === "23505") { // unique constraint violation
      return { message: "You are already signed up!" };
    }
    return { message: "Error signing up, please try again later." };
  }

  revalidatePath("/");
  return { message: "Thanks for signing up!" };
}
