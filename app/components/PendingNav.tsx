"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function PendingNav() {
  const pathname = usePathname();
  const isAdmin =
    typeof window !== "undefined" && pathname?.startsWith("/admin");

  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number>(0);
  const cancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drive a simple progress animation while pending
  useEffect(() => {
    if (isAdmin) return;
    let raf: number | null = null;
    if (pending) {
      setProgress(10);
      const tick = () => {
        setProgress((p) => (p < 85 ? p + Math.max(0.5, (90 - p) * 0.02) : p));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pending, isAdmin]);

  // When we transition from pending -> not pending, finish to 100%
  const prevPendingRef = useRef(false);
  useEffect(() => {
    if (isAdmin) return;
    if (prevPendingRef.current && !pending) {
      setProgress(100);
    }
    prevPendingRef.current = pending;
  }, [pending, isAdmin]);

  const stopPending = useCallback(() => {
    setPending(false);
    setTimeout(() => {
      setProgress(0);
      if (cancelTimerRef.current) {
        clearTimeout(cancelTimerRef.current);
        cancelTimerRef.current = null;
      }
    }, 150);
  }, []);

  const startPending = useCallback(() => {
    startTimeRef.current = performance.now();
    setPending(true);
    if (cancelTimerRef.current) clearTimeout(cancelTimerRef.current);
    // Fallback: if navigation is prevented, clear pending to avoid a stuck UI
    cancelTimerRef.current = setTimeout(() => {
      stopPending();
    }, 4000);
  }, [stopPending]);

  // Mark pending only on navigational anchor clicks
  useEffect(() => {
    if (isAdmin) return;
    const onClick = (e: MouseEvent) => {
      // If another handler already called preventDefault (e.g., an in-card button), skip
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Allow opt-out
      const optOut = target.closest('[data-pending-ignore="true"]');
      if (optOut) return;

      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.getAttribute("data-pending-ignore") === "true") return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const rawHref = anchor.getAttribute("href") || "";
      if (!rawHref || rawHref.startsWith("#")) return; // in-page hash

      try {
        const url = new URL(anchor.href, window.location.href);
        // Only in-app same-origin navigations
        if (url.origin !== window.location.origin) return;
        const navPath = url.pathname + url.search;
        const currentPath = window.location.pathname + window.location.search;
        if (navPath === currentPath) return; // same page (avoid flicker)
        // Ignore admin navigations (admin has its own handler)
        if (url.pathname.startsWith("/admin")) return;
        startPending();
      } catch {
        return;
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [startPending, isAdmin]);

  // Clear pending when the pathname changes
  const lastPathRef = useRef(pathname);
  useEffect(() => {
    if (isAdmin) return;
    if (!pending) {
      lastPathRef.current = pathname;
      return;
    }
    if (pathname !== lastPathRef.current) {
      const elapsed = performance.now() - startTimeRef.current;
      const remaining = Math.max(120 - elapsed, 0);
      const t = setTimeout(() => stopPending(), remaining);
      return () => clearTimeout(t);
    }
  }, [pathname, pending, stopPending, isAdmin]);

  if (isAdmin) return null;

  return (
    <div aria-hidden>
      {/* Top progress bar */}
      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-0 top-0 right-0 h-1 z-[10000] pointer-events-none"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner spinner for extra visibility */}
      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed top-3 right-3 z-[10000] pointer-events-none"
          >
            <div className="h-6 w-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
