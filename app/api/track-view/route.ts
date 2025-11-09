import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

function extractDomain(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json().catch(() => ({}));
    const type = String(body?.type || "").toLowerCase();
    const slug = String(body?.slug || "");
    const clientReferrer: string | undefined = body?.referrer;

    if (!type || !slug || (type !== "post" && type !== "product" && type !== "page")) {
      return NextResponse.json({ ok: false, error: "Invalid type or slug" }, { status: 400 });
    }

    // Determine referrer domain (prefer client-provided document.referrer)
    const headerReferer = req.headers.get("referer");
    const refDomain = extractDomain(clientReferrer) || extractDomain(headerReferer) || "(direct)";

    // Best-effort pseudo visitor id via cookie
    const cookieStore = req.cookies;
    let pvid = cookieStore.get("pvid")?.value;
    if (!pvid) {
      try {
        pvid = randomUUID();
      } catch {
        // Fallback if crypto unavailable
        pvid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      }
    }

    const today = new Date();
    const day = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
      .toISOString()
      .slice(0, 10); // YYYY-MM-DD

    const { data, error } = await supabase.rpc("track_view", {
      _type: type,
      _slug: slug,
      _referrer_domain: refDomain,
      _day: day,
      _pvid: pvid,
    });

    if (error) {
      console.error("track_view RPC error", error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    const res = NextResponse.json({ ok: true, data });
    // Persist pvid for ~1 year
    res.cookies.set("pvid", pvid!, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  } catch (e) {
    console.error("track-view handler error", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
