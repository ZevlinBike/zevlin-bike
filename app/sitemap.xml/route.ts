import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const site = process.env.APP_URL?.replace(/\/$/, "") || "https://example.com";
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(200);

  const staticPaths = ["/", "/products", "/blog" /* add more static routes as needed */];

  const urls = [
    ...staticPaths.map((path) => (
      `<url><loc>${site}${path}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`
    )),
    ...(posts || []).map((p) => (
      `<url><loc>${site}/blog/${p.slug}</loc>${lastmodTag(p.updated_at || p.published_at)}</url>`
    )),
  ].join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`;
  return new NextResponse(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}

function lastmodTag(iso?: string | null) {
  if (!iso) return "";
  return `<lastmod>${new Date(iso).toISOString()}</lastmod>`;
}

