"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function PendingNav() {
  const pathname = usePathname();
  // Avoid SSR/CSR markup differences by rendering only after mount
  const [mounted, setMounted] = useState(false);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const clickedElRef = useRef<HTMLElement | null>(null);
  const startTimeRef = useRef<number>(0);
  const cancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drive a simple progress animation while pending
  useEffect(() => {
    setMounted(true);
    let raf: number | null = null;
    if (pending) {
      setProgress(10);
      const tick = () => {
        setProgress((p) => (p < 85 ? p + Math.max(0.5, (90 - p) * 0.02) : p));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    } else {
      setProgress(100);
    }
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pending]);

  const stopPending = useCallback(() => {
    setPending(false);
    setTimeout(() => {
      clickedElRef.current?.classList.remove("animate-pulse");
      clickedElRef.current = null;
      setProgress(0);
      if (cancelTimerRef.current) {
        clearTimeout(cancelTimerRef.current);
        cancelTimerRef.current = null;
      }
    }, 200);
  }, []);

  const startPending = useCallback((el: HTMLElement) => {
    startTimeRef.current = performance.now();
    clickedElRef.current = el;
    el.classList.add("animate-pulse");
    setPending(true);
    if (cancelTimerRef.current) clearTimeout(cancelTimerRef.current);
    // Fallback: if navigation is prevented, clear pending to avoid a stuck UI
    cancelTimerRef.current = setTimeout(() => {
      stopPending();
    }, 4000);
  }, [stopPending]);

  // Mark pending only on navigational anchor clicks within admin
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Ignore any subtree that opts out
      const optOut = target.closest('[data-pending-ignore="true"]');
      if (optOut) return;

      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) {
        // Support non-anchor elements that are known to navigate via router.push
        const navigatesEl = target.closest('[data-navigates="true"]') as HTMLElement | null;
        if (navigatesEl) {
          startPending(navigatesEl);
        }
        return;
      }
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
        startPending(anchor);
      } catch {
        // If URL parsing fails, be conservative and skip
        return;
      }
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
    };
  }, [startPending]);

  // Clear pending when the pathname changes
  const lastPathRef = useRef(pathname);
  useEffect(() => {
    if (!pending) {
      lastPathRef.current = pathname;
      return;
    }
    if (pathname !== lastPathRef.current) {
      // ensure a minimal display time to avoid flicker
      const elapsed = performance.now() - startTimeRef.current;
      const remaining = Math.max(120 - elapsed, 0);
      const t = setTimeout(() => stopPending(), remaining);
      return () => clearTimeout(t);
    }
  }, [pathname, pending, stopPending]);

  

  if (!mounted) return null;

  return (
    <div aria-hidden="true">
      {/* Top progress bar */}
      <AnimatePresence initial={false}>
        {pending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-0 top-0 right-0 h-0.5 z-[70]"
          >
            <motion.div
              className="h-full bg-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner spinner */}
      <AnimatePresence initial={false}>
        {pending && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed top-3 right-3 z-[70]"
          >
            <div className="h-7 w-7 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
