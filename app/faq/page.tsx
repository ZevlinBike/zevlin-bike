"use client";

import { motion, Variants } from "framer-motion";

export default function FAQPage() {
  const variants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const faqs = [
    {
      q: "Is this really a cream for my... you know?",
      a: "Yes. Zevlin's chamois creams are specifically designed to reduce friction and protect sensitive areas during long rides. It's like a helmet for your nether regions — don’t ride raw.",
    },
    {
      q: "Is it safe for all skin types?",
      a: "Absolutely. Our formulas are made with natural, skin-friendly ingredients and have been tested on all kinds of cyclists — not animals.",
    },
    {
      q: "Do you offer discreet shipping?",
      a: "We ship in plain packaging — no flashy branding or product names on the outside. Your business stays your business.",
    },
    {
      q: "What’s your return policy?",
      a: "If you're not satisfied within 30 days — opened or not — reach out. We’ll make it right. It’s not weird. We’re cyclists too.",
    },
    {
      q: "Can I use it off the bike?",
      a: "We’re not here to judge. Technically, yes — anywhere that needs a little extra glide or protection. Use responsibly.",
    },
  ];

  return (
    <div className="grid justify-center items-start px-4 pt-40 pb-8 min-h-screen bg-gradient-to-b from-gray-50 to-white sm:px-6 lg:px-8 dark:from-neutral-950 dark:to-neutral-900">
      <motion.article
        className="p-8 mx-auto max-w-3xl bg-white rounded-2xl border border-gray-100 shadow-xl dark:bg-gray-800 dark:border-gray-700"
        initial="hidden"
        animate="visible"
        variants={variants}
      >
        <header className="mb-8 space-y-2 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 md:text-5xl dark:text-white">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real questions from real riders. Yes, even that one.
          </p>
        </header>

        <section className="divide-y divide-gray-200 dark:divide-gray-700">
          {faqs.map((faq, i) => (
            <div key={i} className="py-6">
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {faq.q}
              </h2>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {faq.a}
              </p>
            </div>
          ))}
        </section>
      </motion.article>
    </div>
  );
}
