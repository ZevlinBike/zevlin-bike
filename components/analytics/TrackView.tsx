"use client";

import { useEffect } from "react";

type Props = {
  type: "post" | "product" | "page";
  slug: string;
};

export default function TrackView({ type, slug }: Props) {
  useEffect(() => {
    const controller = new AbortController();
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    fetch("/api/track-view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ type, slug, referrer }),
      signal: controller.signal,
    }).catch(() => {});
    return () => controller.abort();
  }, [type, slug]);
  return null;
}

