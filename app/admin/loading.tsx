"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function AdminLoading() {
  return (
    <div className="min-h-[50vh] w-full relative">
      {/* Top progress shimmer */}
      <AnimatePresence>
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "70%", opacity: 1 }}
          exit={{ width: "100%", opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
          className="fixed left-0 top-0 h-0.5 bg-blue-600/80 z-[60]"
        />
      </AnimatePresence>

      {/* Content skeletons */}
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="h-8 w-56 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
              <div className="h-5 w-32 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse mb-3" />
              <div className="h-3 w-full rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse mb-2" />
              <div className="h-3 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

