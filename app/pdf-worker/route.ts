import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Serve the pdf.js worker from node_modules on the same origin,
// so the client can load it without CORS/module issues.
export async function GET() {
  const base = path.join(process.cwd(), "node_modules", "pdfjs-dist", "build");
  const candidates = [
    "pdf.worker.min.mjs",
    "pdf.worker.mjs",
  ];
  for (const file of candidates) {
    try {
      const buf = await fs.readFile(path.join(base, file));
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": "text/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      // try next
    }
  }
  return NextResponse.json({ error: "pdf.worker not found" }, { status: 500 });
}

