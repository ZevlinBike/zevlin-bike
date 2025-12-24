"use client";

import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { testimonials } from "@/store/reviews";

type Testimonial = (typeof testimonials)[number];

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < rating;
        return (
          <Star
            key={i}
            className={[
              "h-4 w-4",
              filled ? "fill-yellow-400 text-yellow-500" : "text-black/15 dark:text-white/15",
            ].join(" ")}
            aria-hidden="true"
          />
        );
      })}
      <span className="sr-only">{rating} out of 5 stars</span>
    </div>
  );
}

function Avatar({ t }: { t: Testimonial }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm",
          t.bgColor,
        ].join(" ")}
      >
        <span className="text-sm font-semibold">{t.initials}</span>
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {t.name}
        </div>
        <div className="truncate text-xs text-gray-500 dark:text-gray-400">{t.title}</div>
      </div>
    </div>
  );
}

function TestimonialCard({
  t,
  expanded,
}: {
  t: Testimonial;
  expanded?: boolean;
}) {
  return (
    <article className="group relative h-full rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-neutral-950">
      <div className="mb-3 flex items-start justify-between gap-3">
        <Stars rating={t.rating} />
        <span className="rounded-full border border-black/10 bg-black/[0.03] px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-gray-300">
          Verified
        </span>
      </div>

      <p
        className={[
          "text-pretty leading-relaxed text-gray-800 dark:text-gray-200",
          expanded ? "text-base" : "text-base line-clamp-4",
        ].join(" ")}
      >
        &ldquo;{t.quote}&rdquo;
      </p>

      <div className="mt-5 border-t border-black/5 pt-4 dark:border-white/10">
        <Avatar t={t} />
      </div>
    </article>
  );
}

export default function TestimonialsSection() {
  // Deterministic initial render for SSR + hydration:
  const [items, setItems] = useState<Testimonial[]>(() => testimonials);
  const [showAll, setShowAll] = useState(false);

  // Shuffle only after mount (client), avoiding hydration mismatch.
  useEffect(() => {
    setItems(shuffle(testimonials));
  }, []);

  const featuredCount = 3;
  const visible = showAll ? items : items.slice(0, featuredCount);

  return (
    <section className="relative overflow-hidden bg-gray-50 py-14 dark:bg-neutral-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.10),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.14),transparent_55%)]" />

      <div className="container relative mx-auto px-4 lg:px-6">
        <header className="mx-auto mb-8 max-w-3xl text-center">
          <div className="mx-auto mb-3 w-fit rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700 backdrop-blur dark:border-white/10 dark:bg-black/30 dark:text-gray-300">
            Testimonials
          </div>

          <h2 className="text-balance text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl dark:text-white">
            Loved by riders everywhere
          </h2>

          <p className="mt-3 text-pretty text-gray-600 dark:text-gray-400">
            Real feedback from the community using Zevlin on big days out.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((t, idx) => (
            <TestimonialCard key={`${t.name}-${t.title}-${idx}`} t={t} expanded={showAll} />
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/10 dark:bg-black dark:text-white dark:hover:bg-neutral-900"
          >
            {showAll ? "Show less" : `Show all (${items.length})`}
          </button>

          {!showAll && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing {featuredCount} highlights. Expand to read the rest.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
