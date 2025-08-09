"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type Notice = {
  id: string;
  title?: string | null;
  message: string;
  cta_label?: string | null;
  cta_url?: string | null;
  variant?: "promo" | "info" | "success" | "warning" | "danger";
  priority?: number;
  rotation_interval_ms?: number;
  ticker?: boolean;
  ticker_speed_px_s?: number;
  dismissible?: boolean;
};

export default function NotificationBanner({
  scrolled,
  notices,
}: {
  scrolled: boolean;
  notices: Notice[]; // already filtered to "active" + ordered by priority on the server if you want
}) {
  // --- dismissed storage ---
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  useEffect(() => {
    const raw = localStorage.getItem("dismissed_notices");
    if (raw) setDismissed(new Set(JSON.parse(raw)));
  }, []);
  const saveDismissed = (next: Set<string>) => {
    setDismissed(next);
    localStorage.setItem("dismissed_notices", JSON.stringify([...next]));
  };

  const active = useMemo(
    () => notices.filter((n) => !dismissed.has(n.id)),
    [notices, dismissed]
  );

  // --- open/close state ---
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (active.length === 0) setClosed(true);
  }, [active.length]);

  // --- rotation ---
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = active[index];

  useEffect(() => setIndex(0), [active.length]);

  useEffect(() => {
    if (!current || paused || scrolled || active.length < 2) return;
    const interval = Math.max(current.rotation_interval_ms ?? 6000, 2000);
    const t = setInterval(() => setIndex((i) => (i + 1) % active.length), interval);
    return () => clearInterval(t);
  }, [current, paused, scrolled, active.length]);

  // pause on tab hidden
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const isBannerVisible = !closed && !scrolled && !!current;

  const variantClass = (v: Notice["variant"]) => {
    switch (v) {
      case "info":
        return "from-sky-700 via-sky-600 to-sky-800";
      case "success":
        return "from-emerald-700 via-emerald-600 to-emerald-800";
      case "warning":
        return "from-amber-700 via-amber-600 to-amber-800";
      case "danger":
        return "from-rose-700 via-rose-600 to-rose-800";
      default:
        return "from-red-700 via-red-600 to-red-800"; // promo
    }
  };

  const handleClose = () => {
    if (!current) return;
    if (current.dismissible !== false) {
      const next = new Set(dismissed);
      next.add(current.id);
      saveDismissed(next);
    }
    // if there are more, advance; otherwise collapse
    if (active.length > 1) {
      setIndex((i) => (i + 1) % active.length);
    } else {
      setClosed(true);
    }
  };

  return (
    <>
      {/* Fixed Re-open Button (always visible above everything) */}
      <AnimatePresence>
        {closed && active.length > 0 && !scrolled && (
          <motion.button
            key="reopen"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.25 }}
            onClick={() => setClosed(false)}
            className="
              fixed top-0 left-1/2 -translate-x-1/2 z-[9999]
              px-2 py-1 rounded-b-lg shadow-lg
              bg-gradient-to-b from-neutral-800 to-neutral-900
              text-white hover:brightness-110 transition
            "
            aria-label="Show announcements"
          >
            <ArrowDown className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main slim banner */}
      <AnimatePresence initial={false}>
        {isBannerVisible && (
          <motion.div
            key={current?.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 40, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className={`relative z-10 flex h-10 items-center justify-center overflow-hidden text-white shadow-md bg-gradient-to-r ${variantClass(
              current?.variant
            )}`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="container mx-auto h-10 px-3 sm:px-6 lg:px-8">
              <div className="flex h-10 items-center justify-between gap-2">
                {/* Ticker-aware message */}
                <div className="min-w-0 flex-1">
                  <Ticker
                    title={current?.title ?? ""}
                    text={current?.message ?? ""}
                    speed={current?.ticker_speed_px_s ?? 60}
                    enabled={current?.ticker !== false}
                  />
                </div>

                {/* CTA (optional) */}
                {current?.cta_url && current?.cta_label && (
                  <Link
                    href={current.cta_url}
                    className="
                      inline-flex h-7 flex-shrink-0 items-center gap-1 rounded-md
                      bg-white/10 px-2 text-[11px] font-semibold
                      transition hover:bg-white/20
                    "
                  >
                    <span className="hidden xs:inline">{current.cta_label}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}

                {/* Close (optional) */}
                {(current?.dismissible ?? true) && (
                  <button
                    onClick={handleClose}
                    className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md transition hover:bg-black/20"
                    aria-label="Close announcement"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* --------- ticker component ---------- */
function Ticker({
  title,
  text,
  speed = 60, // px/s
  enabled = true,
}: {
  title?: string;
  text: string;
  speed?: number;
  enabled?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const [needsScroll, setNeedsScroll] = useState(false);
  const [duration, setDuration] = useState(0);

  // measure overflow & compute duration
  useEffect(() => {
    const check = () => {
      if (!wrapRef.current || !textRef.current) return;
      const wrapW = wrapRef.current.offsetWidth;
      const textW = textRef.current.scrollWidth;
      const overflow = textW > wrapW + 8;
      setNeedsScroll(enabled && overflow);
      if (overflow) setDuration(textW / Math.max(24, speed)); // seconds
    };
    check();
    const ro = new ResizeObserver(() => check());
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", check);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [title, text, speed, enabled]);

  // static (no marquee)
  if (!needsScroll) {
    return (
      <p
        className="flex h-10 items-center truncate text-[12px] font-medium sm:text-sm"
        title={text}
      >
        {title ? (
          <>
            <span className="mr-2 hidden font-black uppercase sm:inline-block">{title}</span>
            {text}
          </>
        ) : (
          text
        )}
      </p>
    );
  }

  // marquee (duplicate for seamless loop)
  return (
    <div ref={wrapRef} className="relative h-10 overflow-hidden">
      <div
        className="absolute left-0 top-0 flex h-10 items-center"
        style={{ animation: `ticker ${duration}s linear infinite`, whiteSpace: "nowrap" }}
      >
        <div ref={textRef} className="pr-10 text-[12px] font-medium sm:text-sm">
          {title && <span className="mr-2 hidden font-black uppercase sm:inline-block">{title}</span>}
          {text}
        </div>
        <div className="pr-10 text-[12px] font-medium sm:text-sm">
          {title && <span className="mr-2 hidden font-black uppercase sm:inline-block">{title}</span>}
          {text}
        </div>
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

