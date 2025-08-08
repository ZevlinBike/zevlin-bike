"use server";

import { createClient } from "@/lib/supabase/server";
import { Customer } from "@/lib/schema";

export async function getCustomers(): Promise<Customer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching customers:", error);
    return [];
  }

  return data as Customer[];
}
