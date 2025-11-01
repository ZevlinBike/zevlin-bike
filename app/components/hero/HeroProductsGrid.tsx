
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import HeroProduct from "./HeroProduct";
import { Product } from "@/lib/schema";
// removed unused imports

export default function HeroProductGrid({
  products,
}: {
  products: (Product & { featured_image: string })[];
}) {
  const heroProducts = products.slice(0, 2);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [transitionMode, setTransitionMode] = useState<"auto" | "swipe">("auto");
  const [isDragging, setIsDragging] = useState(false);
  const [clickLocked, setClickLocked] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [wrapperWidth, setWrapperWidth] = useState(0);
  const startXRef = useRef<number | null>(null);
  const handledRef = useRef(false);
  const [pointerMoved, setPointerMoved] = useState(false);
  const triggeredRef = useRef(false);
  const pointerActiveRef = useRef(false);

  const current = heroProducts[index];

  // Auto-rotate
  useEffect(() => {
    if (paused || heroProducts.length < 2) return;
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setTransitionMode("auto");
      setIndex((i) => (i === heroProducts.length - 1 ? 0 : i + 1));
    }, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, heroProducts.length]);

  // Measure wrapper width for swipe threshold
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setWrapperWidth(el.getBoundingClientRect().width || 0);
    });
    ro.observe(el);
    setWrapperWidth(el.getBoundingClientRect().width || 0);
    return () => ro.disconnect();
  }, []);

  if (heroProducts.length === 0) return null;

  // Pause on hover/focus
  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);
  const handleFocus = () => setPaused(true);
  const handleBlur = () => setPaused(false);

  // Swipe/drag handlers (mouse + touch)
  const handleDragStart = () => {
    if (triggeredRef.current) return;
    setPaused(true);
    setIsDragging(true);
    setClickLocked(true);
    handledRef.current = false;
    triggeredRef.current = false;
  };
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    const x = offset.x;
    const v = velocity.x;
    const threshold = 30; // quick swipe threshold in px
    const hasEnoughSwipe = Math.abs(x) > threshold || Math.abs(v) > 500;
    if (!hasEnoughSwipe || heroProducts.length < 2) {
      // Resume auto-rotate if not swiping
      setPaused(false);
      setIsDragging(false);
      // briefly lock click to avoid accidental nav after drag
      setTimeout(() => setClickLocked(false), 200);
      return;
    }
    if (x < 0) {
      // Swiped left: next
      setDirection(1);
      setTransitionMode("swipe");
      setIndex((i) => (i === heroProducts.length - 1 ? 0 : i + 1));
    } else if (x > 0) {
      // Swiped right: previous
      setDirection(-1);
      setTransitionMode("swipe");
      setIndex((i) => (i === 0 ? heroProducts.length - 1 : i - 1));
    }
    handledRef.current = true;
    triggeredRef.current = true;
    // Resume auto-rotate
    setPaused(false);
    setIsDragging(false);
    // small delay before allowing click again
    setTimeout(() => setClickLocked(false), 200);
  };

  // Pointer tracking for small drags that may not start Framer's drag
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.isPrimary) {
      pointerActiveRef.current = true;
      startXRef.current = e.clientX;
      setPointerMoved(false);
      setPaused(true);
      setIsDragging(true);
      setClickLocked(true);
      handledRef.current = false;
      triggeredRef.current = false;
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!e.isPrimary || startXRef.current == null) return;
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 5 && !pointerMoved) {
      setPointerMoved(true);
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    pointerActiveRef.current = false;
    const startX = startXRef.current;
    startXRef.current = null;
    const dx = startX == null ? 0 : e.clientX - startX;
    const threshold = 30;
    if (!handledRef.current && !triggeredRef.current && Math.abs(dx) >= threshold && heroProducts.length > 1) {
      if (dx < 0) {
        setDirection(1);
        setTransitionMode("swipe");
        setIndex((i) => (i === heroProducts.length - 1 ? 0 : i + 1));
      } else if (dx > 0) {
        setDirection(-1);
        setTransitionMode("swipe");
        setIndex((i) => (i === 0 ? heroProducts.length - 1 : i - 1));
      }
      triggeredRef.current = true;
      handledRef.current = true;
    }
    setPaused(false);
    setIsDragging(false);
    triggeredRef.current = false;
    handledRef.current = false;
    setPointerMoved(false);
    // Keep click locked briefly to suppress navigation on release
    setTimeout(() => setClickLocked(false), 120);
  };

  // Keep badge + carousel perfectly centered by sharing the same width container
  const containerWidths =
    "w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto";

  return (
    <div className="flex flex-col items-center p-2 sm:p-4 mt-8 sm:mt-10 w-full">
      {/* Product Carousel */}
      <div
        className={`relative flex flex-col items-center ${containerWidths}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        tabIndex={0}
        aria-label="Featured products carousel"
      >
        {/* Product Image (no card, just image) */}
        <div className="flex flex-col w-full items-center">
          <div
            ref={wrapperRef}
            className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] xl:w-[32rem] xl:h-[32rem] mb-0 flex items-center justify-center"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -160 : 160 }}
                transition={{ duration: transitionMode === "swipe" ? 0.15 : 0.5, ease: "easeInOut" }}
                className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                drag={heroProducts.length > 1 ? "x" : false}
                dragElastic={0.2}
                dragMomentum={false}
                dragSnapToOrigin
                onDragStart={handleDragStart}
                onDrag={(e, info) => {
                  // Trigger swipe while dragging once threshold reached
                  if (triggeredRef.current || heroProducts.length < 2) return;
                  const x = info.offset.x;
                  const threshold = 30;
                  if (Math.abs(x) >= threshold) {
                    if (x < 0) {
                      setDirection(1);
                      setTransitionMode("swipe");
                      setIndex((i) => (i === heroProducts.length - 1 ? 0 : i + 1));
                    } else if (x > 0) {
                      setDirection(-1);
                      setTransitionMode("swipe");
                      setIndex((i) => (i === 0 ? heroProducts.length - 1 : i - 1));
                    }
                    triggeredRef.current = true;
                    handledRef.current = true;
                    setIsDragging(false);
                    // keep click locked; will release shortly on pointer up / drag end
                  }
                }}
                onDragEnd={handleDragEnd}
                onAnimationComplete={() => {
                  // Safety: if something got stuck during the swap, allow next drags
                  if (!pointerActiveRef.current) {
                    triggeredRef.current = false;
                    handledRef.current = false;
                    setPointerMoved(false);
                  }
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                style={{ touchAction: "pan-y" }}
              >
                <HeroProduct product={current} disableClick={isDragging || clickLocked || pointerMoved} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
