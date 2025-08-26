import { NextResponse } from "next/server";
import { checkAdminRole } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { isAdmin } = await checkAdminRole();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ products: [], orders: [], customers: [] });
  }

  const supabase = await createClient();

  // Products: search name/slug/description
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, description")
    .or(`name.ilike.%${q}%,slug.ilike.%${q}%,description.ilike.%${q}%`)
    .limit(5);

  // Orders: search id, customer fields
  const { data: orders } = await supabase
    .from("orders")
    .select("id, customers(first_name,last_name,email)")
    .or(`id.ilike.%${q}%,customers.first_name.ilike.%${q}%,customers.last_name.ilike.%${q}%,customers.email.ilike.%${q}%`)
    .limit(5);

  // Customers: search name/email
  const { data: customers } = await supabase
    .from("customers")
    .select("id, first_name, last_name, email")
    .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
    .limit(5);

  // Discounts: search code/description
  const { data: discounts } = await supabase
    .from("discounts")
    .select("id, code, description")
    .or(`code.ilike.%${q}%,description.ilike.%${q}%`)
    .limit(5);

  // Categories: search name/slug
  const { data: categories } = await supabase
    .from("product_categories")
    .select("id, name, slug")
    .or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
    .limit(5);

  // Blog posts: search title/slug
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug")
    .or(`title.ilike.%${q}%,slug.ilike.%${q}%`)
    .limit(5);

  return NextResponse.json({
    products: (products || []).map((p) => ({
      id: p.id,
      title: p.name,
      subtitle: p.slug,
      href: `/admin/products?q=${encodeURIComponent(p.name)}`,
    })),
    orders: ((orders || []) as unknown as { id: string; customers: { first_name: string; last_name: string; email: string } | null }[]).map((o) => ({
      id: o.id,
      title: `Order ${o.id.substring(0, 8)}…`,
      subtitle: o.customers ? `${o.customers.first_name} ${o.customers.last_name} • ${o.customers.email}` : undefined,
      href: `/admin/orders?query=${encodeURIComponent(q)}`,
    })),
    customers: (customers || []).map((c) => ({
      id: c.id,
      title: `${c.first_name} ${c.last_name}`,
      subtitle: c.email,
      href: `/admin/customers?q=${encodeURIComponent(c.email || "")}`,
    })),
    discounts: (discounts || []).map((d) => ({
      id: d.id,
      title: d.code,
      subtitle: d.description,
      href: `/admin/discounts`,
    })),
    categories: (categories || []).map((c) => ({
      id: c.id,
      title: c.name,
      subtitle: c.slug,
      href: `/admin/categories`,
    })),
    posts: (posts || []).map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: p.slug,
      href: `/admin/blog`,
    })),
  });
}
