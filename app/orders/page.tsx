import MainLayout from "@/components/layouts/MainLayout";
import { createClient } from "@/lib/supabase/server";
import { OrderWithLineItems } from "@/lib/schema";
import { redirect } from "next/navigation";
import OrderHistoryClientPage from "./OrderHistoryClientPage";

export default async function OrderHistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=You must be logged in to view your order history.");
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!customer) {
    return (
      <MainLayout>
        <div className="pt-40 min-h-screen container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-8">
            Order History
          </h1>
          <p>Could not find customer profile. Please contact support.</p>
        </div>
      </MainLayout>
    );
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*, line_items(*, products(*, product_images(*)))")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return (
      <MainLayout>
        <div className="pt-40 min-h-screen container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-8">
            Order History
          </h1>
          <p>There was an error fetching your orders. Please try again later.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="pt-40 min-h-screen text-black dark:text-white">
        <OrderHistoryClientPage orders={orders as OrderWithLineItems[]} />
      </div>
    </MainLayout>
  );
}
