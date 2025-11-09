import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ReqBody = {
  type: "post" | "product" | "page";
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  limit?: number;
  slugs?: string[];
};

type ViewRow = { slug: string; day: string; views: number; uniques: number };
type RefRow = { slug: string; referrer_domain: string; day: string; views: number };

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    let body: Partial<ReqBody> | null = null;
    try {
      body = (await req.json()) as Partial<ReqBody> | null;
    } catch {
      body = null;
    }
    if (!body || !body.type || !body.start || !body.end) {
      return NextResponse.json({ error: "Missing type/start/end" }, { status: 400 });
    }

    const type = body.type;
    if (!["post", "product", "page"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const start = body.start;
    const end = body.end;
    const limit = Math.max(1, Math.min(1000, Number(body.limit ?? 100)));
    const slugs = Array.isArray(body.slugs) ? body.slugs.filter(Boolean) : undefined;

    // fetch view counts
    let vq = supabase
      .from("analytics_view_counts")
      .select("slug,day,views,uniques")
      .eq("type", type)
      .gte("day", start)
      .lte("day", end)
      .limit(100000);
    if (slugs && slugs.length) vq = vq.in("slug", slugs);
    const { data: vrows, error: verr } = await vq;
    if (verr) throw verr;
    const views = (vrows || []) as ViewRow[];

    // fetch referrer counts
    let rq = supabase
      .from("analytics_referrer_counts")
      .select("slug,referrer_domain,day,views")
      .eq("type", type)
      .gte("day", start)
      .lte("day", end)
      .limit(100000);
    if (slugs && slugs.length) rq = rq.in("slug", slugs);
    const { data: rrows, error: rerr } = await rq;
    if (rerr) throw rerr;
    const refs = (rrows || []) as RefRow[];

    // Aggregate by day
    const byDayMap = new Map<string, { day: string; views: number; uniques: number }>();
    for (const r of views) {
      const cur = byDayMap.get(r.day) || { day: r.day, views: 0, uniques: 0 };
      cur.views += r.views || 0;
      cur.uniques += r.uniques || 0;
      byDayMap.set(r.day, cur);
    }
    const byDay = Array.from(byDayMap.values()).sort((a, b) => (a.day < b.day ? -1 : 1));

    // Aggregate by item
    const byItemMap = new Map<string, { slug: string; views: number; uniques: number }>();
    for (const r of views) {
      const cur = byItemMap.get(r.slug) || { slug: r.slug, views: 0, uniques: 0 };
      cur.views += r.views || 0;
      cur.uniques += r.uniques || 0;
      byItemMap.set(r.slug, cur);
    }
    const byItem = Array.from(byItemMap.values()).sort((a, b) => b.views - a.views).slice(0, limit);

    // Referrers per item (top 5)
    const refByItem: { slug: string; referrers: { domain: string; views: number }[] }[] = [];
    const topSet = new Set(byItem.map((x) => x.slug));
    const refMap = new Map<string, Map<string, number>>();
    for (const r of refs) {
      if (!topSet.has(r.slug)) continue;
      const dm = refMap.get(r.slug) || new Map<string, number>();
      dm.set(r.referrer_domain, (dm.get(r.referrer_domain) || 0) + (r.views || 0));
      refMap.set(r.slug, dm);
    }
    for (const slug of topSet) {
      const dm = refMap.get(slug);
      if (!dm) continue;
      const refList = Array.from(dm.entries())
        .map(([domain, v]) => ({ domain, views: v }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
      refByItem.push({ slug, referrers: refList });
    }

    const totalViews = byDay.reduce((s, r) => s + r.views, 0);
    const totalUniques = byDay.reduce((s, r) => s + r.uniques, 0);
    const days = byDay.length || 1;
    const items = byItem.length;

    return NextResponse.json({
      summary: { totalViews, totalUniques, days, items, avgPerDay: Math.round(totalViews / days) },
      byDay,
      byItem,
      referrers: refByItem,
    });
  } catch (e) {
    console.error("/api/admin/analytics error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
