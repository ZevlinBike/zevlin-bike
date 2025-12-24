"use client";

import { AnimatePresence, motion } from "framer-motion";
import PageShell from "@/app/components/layouts/PageShell";
import { Plus } from "lucide-react";
import { useState } from "react";

// The FAQ data
const faqs = [
  {
    id: 1,
    q: "Is this really a cream for my... you know?",
    a: "Yes. Zevlin's chamois creams are specifically designed to reduce friction and protect sensitive areas during long rides. It's like a helmet for your nether regions — don’t ride raw.",
  },
  {
    id: 2,
    q: "Is it safe for all skin types?",
    a: "Absolutely. Our formulas are made with natural, skin-friendly ingredients and have been tested on all kinds of cyclists — not animals.",
  },
  {
    id: 3,
    q: "Do you offer discreet shipping?",
    a: "We ship in plain packaging — no flashy branding or product names on the outside. Your business stays your business.",
  },
  {
    id: 4,
    q: "What’s your return policy?",
    a: "If you're not satisfied within 30 days — opened or not — reach out. We’ll make it right. It’s not weird. We’re cyclists too.",
  },
  {
    id: 5,
    q: "Can I use it off the bike?",
    a: "We’re not here to judge. Technically, yes — anywhere that needs a little extra glide or protection. Use responsibly.",
  },
];

export default function FAQPage() {
  // Allow multiple to be open? If not, switch `useState<number | null>(null)`
  const [openItem, setOpenItem] = useState<number | null>(1);

  return (
    <PageShell>
      <div className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl mb-4">
              FAQs
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Real questions from real riders. <br className="hidden sm:block" />
              <span className="opacity-70 text-sm">(Yes, even that one).</span>
            </p>
          </motion.div>

          {/* FAQ List */}
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <FAQItem
                key={faq.id}
                faq={faq}
                isOpen={openItem === faq.id}
                toggle={() => setOpenItem(openItem === faq.id ? null : faq.id)}
                index={index}
              />
            ))}
          </div>
          
        </div>
      </div>
    </PageShell>
  );
}

// Extracted Component for cleaner animation logic
function FAQItem({ 
  faq, 
  isOpen, 
  toggle, 
  index 
}: { 
  faq: typeof faqs[0]; 
  isOpen: boolean; 
  toggle: () => void; 
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }} // Staggered entrance
      className="border-b border-neutral-200 dark:border-neutral-800"
    >
      <button
        onClick={toggle}
        className="flex w-full items-start justify-between py-6 text-left focus:outline-none group"
        aria-expanded={isOpen}
      >
        <span className={`text-base sm:text-lg font-medium transition-colors duration-200 ${isOpen ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200"}`}>
          {faq.q}
        </span>
        <span className="ml-6 flex h-7 items-center">
            {/* Animated Icon */}
          <motion.span
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex items-center justify-center rounded-full border border-neutral-200 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <Plus className={`h-4 w-4 ${isOpen ? "text-neutral-900 dark:text-white" : "text-neutral-400 dark:text-neutral-500"}`} />
          </motion.span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-base leading-relaxed text-neutral-600 dark:text-neutral-400 pr-12">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
