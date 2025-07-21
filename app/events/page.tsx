"use client";

import { motion, Variants } from "framer-motion";

export default function EventsPage() {
  const variants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div className="grid justify-center items-start px-4 pt-40 min-h-screen bg-gradient-to-br from-gray-50 to-white sm:px-6 lg:px-8 dark:from-gray-900 dark:to-black">
      <motion.article
        className="p-8 mx-auto max-w-3xl bg-white rounded-2xl border border-gray-100 shadow-xl dark:bg-gray-800 dark:border-gray-700"
        initial="hidden"
        animate="visible"
        variants={variants}
      >
        <header className="mb-8 space-y-2 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 md:text-5xl dark:text-white">
            Events & Rides
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Join us for local group rides, races, or special Zevlin Bike events.
          </p>
        </header>

        {/* Placeholder event layout */}
        <section className="space-y-8">
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              No upcoming events yet.
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              We’re currently working on the next big ride — check back soon or
              follow us on social.
            </p>
          </div>
        </section>
      </motion.article>
    </div>
  );
}
