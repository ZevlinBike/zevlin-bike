"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ApiReview = {
  id: string;
  product_id: string;
  customer_id?: string | null;
  rating: number;
  title?: string | null;
  body?: string | null;
  verified?: boolean | null;
  helpful_count?: number | null;
  created_at?: string | null;
  author_display?: string | null;
};

function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  const full = Math.floor(rating);
  const frac = rating - full;
  return (
    <div className={`flex items-center gap-0.5 ${className}`} aria-label={`${rating.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = i < full ? 1 : i === full ? frac : 0;
        return (
          <div key={i} className="relative w-5 h-5">
            <Star aria-hidden fill="currentColor" className="text-gray-300 dark:text-neutral-700 absolute inset-0 w-5 h-5" />
            <Star
              aria-hidden
              fill="currentColor"
              className="text-yellow-400 absolute inset-0 w-5 h-5"
              style={{ clipPath: `inset(0 ${100 - fill * 100}% 0 0)` }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function ReviewsSection({ productSlug }: { productSlug: string }) {
  const [show, setShow] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ApiReview[]>([]);

  useEffect(() => {
    let abort = false;
    setLoading(true);
    setError(null);
    fetch(`/api/products/${encodeURIComponent(productSlug)}/reviews`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => {
        if (!abort) setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      })
      .catch(() => { if (!abort) setError("Failed to load reviews"); })
      .finally(() => { if (!abort) setLoading(false); });
    return () => { abort = true; };
  }, [productSlug]);

  const stats = useMemo(() => {
    const count = reviews.length;
    const avg = count ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / count : 0;
    const buckets = [1, 2, 3, 4, 5].map((s) => reviews.filter((r) => r.rating === s).length);
    return { count, avg, buckets };
  }, [reviews]);

  return (
    <section className="mt-24" aria-labelledby="reviews-heading">
      <div className="mb-6">
        <h2 id="reviews-heading" className="text-2xl md:text-3xl font-extrabold font-product-display">Rider Reviews</h2>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          {loading ? (
            <div className="h-5 w-40 rounded bg-gray-200/70 dark:bg-neutral-800/70 animate-pulse" />
          ) : (
            <>
              <Stars rating={stats.avg} />
              <span>{stats.avg.toFixed(1)} average</span>
              <span className="opacity-70">•</span>
              <span>{stats.count} reviews</span>
            </>
          )}
        </div>
      </div>

      {/* Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="space-y-6">
            <AnimatePresence initial={false}>
            {reviews.slice(0, show).map((r, idx) => (
              <motion.article
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: "easeOut", delay: idx * 0.03 }}
                className="pb-6 border-b border-gray-200/70 dark:border-neutral-800/80"
              >
                <div className="flex items-center gap-3">
                  <Stars rating={r.rating} />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {r.author_display && r.author_display.trim() ? r.author_display : "Customer"}
                  </span>
                  {r.verified && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                      <Check className="w-3.5 h-3.5" /> Verified Purchase
                    </span>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
                {r.title && (
                  <h3 className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100">{r.title}</h3>
                )}
                {r.body && (
                  <p className="mt-2 text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">{r.body}</p>
                )}
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">Helpful • {r.helpful_count ?? 0}</div>
              </motion.article>
            ))}
            </AnimatePresence>

            {!loading && show < reviews.length && (
              <div className="pt-2">
                <button
                  onClick={() => setShow((s) => Math.min(reviews.length, s + 3))}
                  className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-neutral-700 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Load more reviews
                </button>
              </div>
            )}
            {loading && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="pb-6 border-b border-gray-200/70 dark:border-neutral-800/80">
                    <div className="h-4 w-48 bg-gray-200/70 dark:bg-neutral-800/70 rounded animate-pulse" />
                    <div className="mt-2 h-4 w-72 bg-gray-200/70 dark:bg-neutral-800/70 rounded animate-pulse" />
                    <div className="mt-2 h-4 w-[85%] bg-gray-200/70 dark:bg-neutral-800/70 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            )}
            {error && !loading && (
              <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
            )}
          </div>
        </div>

        {/* Summary + mock form placeholder */}
        <div>
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3">Rating breakdown</h4>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.buckets[star - 1];
                const pct = stats.count ? (count / stats.count) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="w-8 text-xs text-gray-600 dark:text-gray-400">{star}★</span>
                    <div className="flex-1 h-2 rounded bg-gray-200/70 dark:bg-neutral-800/70 overflow-hidden">
                      <div className="h-full bg-yellow-400/80 transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-xs text-gray-600 dark:text-gray-400 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-neutral-800 p-4">
            <h4 className="text-sm font-semibold mb-2">Write a review</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Reviews are limited to authorized customers. Sign in to add your experience.
            </p>
            <button className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" disabled>
              Sign in to review
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
