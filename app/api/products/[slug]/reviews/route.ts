import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    // Derive slug from the request path: /api/products/:slug/reviews
    const pathname = _req.nextUrl.pathname;
    const match = pathname.match(/\/api\/products\/([^/]+)\/reviews/i);
    const slug = match ? decodeURIComponent(match[1]) : "";
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const { data: product, error: pErr } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .single();
    if (pErr || !product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Try selecting with author_display (new column). If the column doesn't exist yet,
    // fall back to RPC or plain select.
    const attemptSelect = async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, product_id, customer_id, rating, title, body, verified, helpful_count, created_at, author_display")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false });
      return { data, error } as const;
    };

    const { data, error } = await attemptSelect();
    if (error && /author_display/i.test(error.message || "")) {
      // Fallback 1: RPC that joins customers with SECURITY DEFINER
      const rpc = await supabase.rpc("get_reviews_with_authors", { _product_id: product.id });
      if (!rpc.error) {
        type RpcReview = {
          id: string;
          product_id: string;
          customer_id: string | null;
          rating: number;
          title: string | null;
          body: string | null;
          verified: boolean | null;
          helpful_count: number | null;
          created_at: string | null;
          author_first_name: string | null;
          author_last_name: string | null;
        };
        const normalized = ((rpc.data || []) as RpcReview[]).map((r) => ({
          id: r.id,
          product_id: r.product_id,
          customer_id: r.customer_id,
          rating: r.rating,
          title: r.title,
          body: r.body,
          verified: r.verified,
          helpful_count: r.helpful_count,
          created_at: r.created_at,
          author_display: [
            r.author_first_name || undefined,
            r.author_last_name ? `${r.author_last_name.charAt(0)}.` : undefined,
          ]
            .filter(Boolean)
            .join(" ") || "Customer",
        }));
        return NextResponse.json({ reviews: normalized });
      }
      // Fallback 2: Plain select without author data
      const plain = await supabase
        .from("reviews")
        .select("id, product_id, customer_id, rating, title, body, verified, helpful_count, created_at")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false });
      if (plain.error) return NextResponse.json({ error: plain.error.message }, { status: 500 });
      type PlainReview = {
        id: string;
        product_id: string;
        customer_id: string | null;
        rating: number;
        title: string | null;
        body: string | null;
        verified: boolean | null;
        helpful_count: number | null;
        created_at: string | null;
      };
      const withFallbackNames = ((plain.data || []) as PlainReview[]).map((r) => ({ ...r, author_display: "Customer" }));
      return NextResponse.json({ reviews: withFallbackNames });
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reviews: data || [] });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
