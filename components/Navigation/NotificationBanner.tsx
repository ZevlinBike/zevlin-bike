"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Megaphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type Notice = {
  id: string;
  title?: string | null;
  message: string;
  cta_label?: string | null;
  cta_url?: string | null;
  variant?: "promo" | "info" | "success" | "warning" | "danger";
  rotation_interval_ms?: number;
  ticker?: boolean;
  ticker_speed_px_s?: number; // pixels/sec
  dismissible?: boolean;
};

export default function NotificationBanner({
  scrolled,
  notices,
}: {
  scrolled: boolean;
  notices: Notice[];
}) {
  const [closed, setClosed] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = notices[index];

  useEffect(() => setIndex(0), [notices.length]);

  useEffect(() => {
    if (!current || paused || scrolled || notices.length < 2) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % notices.length);
    }, Math.max(current.rotation_interval_ms ?? 6000, 2000));
    return () => clearInterval(t);
  }, [current, paused, scrolled, notices.length]);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const isBannerVisible = !closed && !scrolled && !!current;

  const variantClass = (v: Notice["variant"]) =>
    ({
      info: "from-sky-700 via-sky-600 to-sky-800",
      success: "from-emerald-700 via-emerald-600 to-emerald-800",
      warning: "from-amber-700 via-amber-600 to-amber-800",
      danger: "from-rose-700 via-rose-600 to-rose-800",
      promo: "from-red-700 via-red-600 to-red-800",
      undefined: "from-red-700 via-red-600 to-red-800",
    }[v ?? "promo"]);

  return (
    <>
      {/* Floating reopen FAB (no persistence; always available when closed) */}
      <AnimatePresence>
        {closed && !scrolled && notices.length > 0 && (
          <motion.button
            key="reopen-fab"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            onClick={() => setClosed(false)}
            className={`
              fixed top-0 left-1/2 -translate-x-1/2 z-[9999]
              inline-flex items-center gap-2 px-3 px-1 py-0.5 rounded-b-lg 
              text-white bg-black shadow-lg 
              hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50
              ${variantClass}
            `}
            aria-label="Show announcements"
          >
            <Megaphone className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main slim banner */}
      <AnimatePresence initial={false}>
        {isBannerVisible && (
          <motion.div
            key={current.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 25, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`fixed top-0 left-0 right-0 z-[999] flex items-center justify-center overflow-hidden text-white overflow-hidden shadow-md bg-gradient-to-r ${variantClass(
              current.variant
            )}`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="container mx-auto h-10 px-3 sm:px-6 lg:px-8">
              <div className="flex h-10 items-center justify-between gap-2">
                {/* Ticker-aware message */}
                <div className="min-w-0 flex-1">
                  <Ticker
                    title={current.title ?? ""}
                    text={current.message}
                    speed={current.ticker_speed_px_s ?? 60}
                    enabled={current.ticker !== false}
                  />
                </div>

                {/* CTA */}
                {current.cta_url && current.cta_label && (
                  <Link
                    href={current.cta_url}
                    className="inline-flex h-7 flex-shrink-0 items-center gap-1 rounded-md bg-white/10 px-2 text-[11px] font-semibold transition hover:bg-white/20"
                  >
                    <span className="hidden xs:inline">{current.cta_label}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}

                {/* Close (no persistence; shows again after refresh) */}
                {(current.dismissible ?? true) && (
                  <button
                    onClick={() => setClosed(true)}
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
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [needsScroll, setNeedsScroll] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const check = () => {
      if (!wrapRef.current || !measureRef.current) return;
      const wrapW = wrapRef.current.offsetWidth;
      const textW = measureRef.current.scrollWidth;
      const overflow = textW > wrapW + 8;
      setNeedsScroll(enabled && overflow);
      if (overflow) setDuration(textW / Math.max(24, speed));
    };
    const raf = requestAnimationFrame(check);
    const ro = new ResizeObserver(check);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", check);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [title, text, speed, enabled]);

  return (
    <div ref={wrapRef} className="relative h-10 overflow-hidden">
      {/* always-mounted measurer */}
      <div
        ref={measureRef}
        className="pointer-events-none absolute -z-10 invisible whitespace-nowrap"
      >
        {title && <span className="mr-2 hidden font-black uppercase sm:inline-block">{title}</span>}
        {text}
      </div>

      {!needsScroll ? (
        <p className="flex h-10 items-center truncate text-[12px] font-medium sm:text-sm" title={text}>
          {title ? (
            <>
              <span className="mr-2 hidden font-black uppercase sm:inline-block">{title}</span>
              {text}
            </>
          ) : (
            text
          )}
        </p>
      ) : (
        <div className="absolute inset-0">
          <div
            className="absolute left-0 top-0 flex h-10 items-center whitespace-nowrap"
            style={{ animation: `notification-ticker ${duration}s linear infinite` }}
          >
            <div className="pr-10 text-[12px] font-medium sm:text-sm">
              {title && <span className="mr-2 hidden font-black uppercase sm:inline-block">{title}</span>}
              {text}
            </div>
            <div className="pr-10 text-[12px] font-medium sm:text-sm">
              {title && <span className="mr-2 hidden font-black uppercase sm:inline-block">{title}</span>}
              {text}
            </div>
          </div>
        </div>
      )}

      {/* make keyframes GLOBAL so the name matches */}
      <style jsx global>{`
        @keyframes notification-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); } /* one copy width */
        }
        @media (prefers-reduced-motion: reduce) {
          .notification-ticker {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

