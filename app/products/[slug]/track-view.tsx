"use client";

import { useEffect } from "react";

export default function TrackView({ slug }: { slug: string }) {
  useEffect(() => {
    const controller = new AbortController();
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    fetch("/api/track-view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ type: "product", slug, referrer }),
      signal: controller.signal,
    }).catch(() => {});
    return () => controller.abort();
  }, [slug]);
  return null;
}

