"use client";

import { Star, Quote } from "lucide-react";
import { testimonials } from "@/store/reviews";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, Variants } from "framer-motion";

export default function Testimonials() {
  const [items, setItems] = useState<typeof testimonials>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const shuffled = [...testimonials].sort(() => 0.5 - Math.random());
    // Show a good variety; keep up to 9
    setItems(shuffled.slice(0, 9));
  }, []);

  // Section animation
  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const handleScroll = (dir: "prev" | "next") => {
    const node = scrollerRef.current;
    if (!node) return;
    const amount = node.clientWidth * 0.85; // Scroll ~one card
    node.scrollBy({ left: dir === "next" ? amount : -amount, behavior: "smooth" });
  };

  const ratingText = useMemo(
    () => (count: number) => `${count} out of 5 stars`,
    []
  );

  return (
    <section className="relative overflow-hidden py-16 bg-gray-50 dark:bg-neutral-950">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 dark:to-white/5" />

      <div className="container relative z-10 mx-auto px-4 lg:px-6">
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mb-10 text-center"
        >
          <p className="mx-auto mb-2 w-fit rounded-full border border-gray-200/60 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-700 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-black/40 dark:text-gray-300">
            Testimonials
          </p>
          <h2 className="text-balance mx-auto max-w-3xl text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
            Loved by riders everywhere
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600 dark:text-gray-400">
            Real feedback from the community using Zevlin on big days out.
          </p>
        </motion.div>

        {/* Horizontal scroll-snap carousel */}
        <div className="relative">
          {/* Controls */}
          <div className="pointer-events-none absolute -top-14 right-0 flex gap-2 md:-top-16">
            <button
              type="button"
              onClick={() => handleScroll("prev")}
              className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 dark:bg-black dark:text-gray-200 dark:hover:bg-neutral-900"
              aria-label="Scroll testimonials left"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="currentColor" d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>
            <button
              type="button"
              onClick={() => handleScroll("next")}
              className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 dark:bg-black dark:text-gray-200 dark:hover:bg-neutral-900"
              aria-label="Scroll testimonials right"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="currentColor" d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L12.17 12z"/></svg>
            </button>
          </div>

          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] scroll-smooth"
            style={{
              maskImage:
                "linear-gradient(to right, transparent 0, black 48px, black calc(100% - 48px), transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0, black 48px, black calc(100% - 48px), transparent 100%)",
              scrollPaddingInline: 24,
            }}
          >
            {/* Hide scrollbar for WebKit */}
            <style>{`.snap-x::-webkit-scrollbar{display:none}`}</style>
            {items.map((t, idx) => (
              <motion.article
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                className="group relative flex min-w-[clamp(16rem,65vw,20rem)] shrink-0 snap-center flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-transparent transition hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-500/20 dark:border-gray-800 dark:bg-black dark:hover:ring-blue-400/20"
              >
                {/* Accent gradient border on hover */}
                <div className="pointer-events-none absolute inset-px rounded-2xl bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:via-blue-500/5 group-hover:to-blue-500/10" />

                {/* Quote icon */}
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300">
                  <Quote className="h-4 w-4" aria-hidden="true" />
                </div>

                {/* Stars */}
                <div className="mb-3 flex items-center" aria-label={ratingText(t.rating)}>
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="mr-0.5 h-4 w-4 fill-yellow-400 text-yellow-500" aria-hidden="true" />
                  ))}
                  <span className="sr-only">{ratingText(t.rating)}</span>
                </div>

                {/* Quote text */}
                <p className="mb-6 text-pretty text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Footer */}
                <div className="mt-auto flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${t.bgColor} text-white shadow-sm`}>{t.initials}</div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{t.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t.title}</div>
                  </div>
                </div>
              </motion.article>
            ))}
            {/* Mask-based edge fade applied to scroller above */}
          </div>
        </div>
      </div>
    </section>
  );
}
