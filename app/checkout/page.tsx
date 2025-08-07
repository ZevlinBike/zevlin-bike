import { createClient } from "@/lib/supabase/server";
import CheckoutClientPage from "./CheckoutClientPage";

export default async function CheckoutPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let customer = null;
  if (user) {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();
    customer = data;
  }

  return <CheckoutClientPage user={user} customer={customer} />;
}
