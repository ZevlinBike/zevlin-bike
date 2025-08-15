import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  try {
    const { data: packages, error } = await supabase
      .from("shipping_packages")
      .select("*")
      .order("is_default", { ascending: false })
      .order("name");

    if (error) {
      throw error;
    }

    return NextResponse.json(packages);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch shipping packages";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
