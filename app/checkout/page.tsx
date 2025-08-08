import { createClient } from "@/lib/supabase/server";
import CheckoutClientPage from "./CheckoutClientPage";

export default async function CheckoutPage() {
  console.log("CheckoutPage: Fetching user and customer data...");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let customer = null;
  if (user) {
    console.log("CheckoutPage: User found, fetching customer data for user:", user.id);
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();
    customer = data;
    console.log("CheckoutPage: Customer data fetched:", customer);
  } else {
    console.log("CheckoutPage: No user found.");
  }

  return <CheckoutClientPage user={user} customer={customer} />;
}
