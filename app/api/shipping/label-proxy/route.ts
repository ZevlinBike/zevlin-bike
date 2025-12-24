import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

// Very small proxy to fetch a label PDF cross-origin and return with permissive CORS,
// so the client can render it with pdf.js and print alongside the packing slip.

const ALLOWED_HOST_PATTERNS = [
  // Common Shippo label domains; adjust if needed
  /shippo/i,
  // ShipEngine downloads/CDN
  /shipengine/i,
  /amazonaws\.com/i,
  /googleapis\.com/i,
];

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  // Handle data URLs directly to support local/mock labels
  if (urlParam.startsWith("data:")) {
    try {
      const comma = urlParam.indexOf(",");
      if (comma === -1) return NextResponse.json({ error: "Invalid data URL" }, { status: 400 });
      const header = urlParam.slice(5, comma); // e.g., image/webp;base64
      const data = urlParam.slice(comma + 1);
      const isBase64 = /;base64/i.test(header);
      const mime = header.replace(/;base64/i, "") || "application/octet-stream";
      const bytes = isBase64 ? Buffer.from(data, "base64") : Buffer.from(decodeURIComponent(data), "utf8");
      return new NextResponse(bytes, { status: 200, headers: { "Content-Type": mime, "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } });
    } catch {
      return NextResponse.json({ error: "Failed to decode data URL" }, { status: 400 });
    }
  }

  let target: URL;
  try {
    // Allow same-origin relative URLs by resolving against current origin
    if (urlParam.startsWith("/")) {
      target = new URL(urlParam, req.nextUrl.origin);
    } else {
      target = new URL(urlParam);
    }
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (target.protocol !== "https:" && target.origin !== req.nextUrl.origin) {
    return NextResponse.json({ error: "Only https urls are allowed" }, { status: 400 });
  }

  const allowed = ALLOWED_HOST_PATTERNS.some((re) => re.test(target.hostname));
  if (!allowed && target.origin !== req.nextUrl.origin) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const headers: Record<string, string> = {};
    // ShipEngine downloads may require API-Key even for direct links
    if (/shipengine\.com$/i.test(target.hostname) || /shipengine/i.test(target.hostname)) {
      const key = env.SHIPENGINE_API_KEY || process.env.SHIPENGINE_API_KEY;
      if (key) headers["API-Key"] = key;
      headers.Accept = "application/pdf,application/octet-stream;q=0.8,*/*;q=0.5";
    }
    const upstream = await fetch(target.toString(), { cache: "no-store", headers });
    if (!upstream.ok) {
      return NextResponse.json({ error: `Upstream error: ${upstream.status}` }, { status: 502 });
    }

    const arrayBuf = await upstream.arrayBuffer();
    return new NextResponse(arrayBuf, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/pdf",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch label" }, { status: 500 });
  }
}
