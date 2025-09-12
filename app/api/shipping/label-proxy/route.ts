import { NextRequest, NextResponse } from "next/server";

// Very small proxy to fetch a label PDF cross-origin and return with permissive CORS,
// so the client can render it with pdf.js and print alongside the packing slip.

const ALLOWED_HOST_PATTERNS = [
  // Common Shippo label domains; adjust if needed
  /shippo/i,
  /amazonaws\.com/i,
];

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(urlParam);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (target.protocol !== "https:") {
    return NextResponse.json({ error: "Only https urls are allowed" }, { status: 400 });
  }

  const allowed = ALLOWED_HOST_PATTERNS.some((re) => re.test(target.hostname));
  if (!allowed) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(target.toString(), { cache: "no-store" });
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
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch label" }, { status: 500 });
  }
}

