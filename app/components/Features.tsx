"use client";
import { Bike, Shield, Leaf, Trophy, CheckCircle2 } from "lucide-react";
import { motion, Variants } from "framer-motion"; // Import motion

type Feature = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "green" | "purple" | "orange";
  badge: string;
  highlights: string[];
};

const features: Feature[] = [
  {
    title: "All-Day Comfort",
    description:
      "Our formula reduces friction and prevents saddle sores so you stay focused and comfortable on your longest rides.",
    icon: Bike,
    color: "blue",
    badge: "Most Loved",
    highlights: [
      "Reduces friction and hot spots",
      "Stays put on long efforts",
      "Works with bibs and liners",
    ],
  },
  {
    title: "Skin Protection",
    description:
      "Creates a durable barrier to help fight chafing and irritation so your skin stays calm ride after ride.",
    icon: Shield,
    color: "green",
    badge: "Barrier Care",
    highlights: [
      "Shields high‑friction zones",
      "Helps reduce saddle sores",
    ],
  },
  {
    title: "Natural Formula",
    description:
      "Made with gentle, non‑tingle ingredients you can use every day and feel good about.",
    icon: Leaf,
    color: "purple",
    badge: "Clean Feel",
    highlights: [
      "Non‑tingle, gentle on skin",
      "No harsh dyes or parabens",
    ],
  },
  {
    title: "Pro‑Cyclist Approved",
    description:
      "Developed with and trusted by professional cyclists to perform when it matters most.",
    icon: Trophy,
    color: "orange",
    badge: "Pro Tested",
    highlights: [
      "Refined with elite riders",
      "Ready for race day",
    ],
  },
];

// Animation variants for Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2, // Stagger animation for each feature card
      delayChildren: 0.1,
    },
  },
} satisfies Variants;

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
} satisfies Variants;

function colorClasses(color: Feature["color"]) {
  return {
    ring:
      color === "blue"
        ? "ring-blue-500/30"
        : color === "green"
          ? "ring-green-500/30"
          : color === "purple"
            ? "ring-purple-500/30"
            : "ring-orange-500/30",
    solid:
      color === "blue"
        ? "bg-blue-600"
        : color === "green"
          ? "bg-green-600"
          : color === "purple"
            ? "bg-purple-600"
            : "bg-orange-600",
    soft:
      color === "blue"
        ? "from-blue-500/10 to-blue-500/0"
        : color === "green"
          ? "from-green-500/10 to-green-500/0"
          : color === "purple"
            ? "from-purple-500/10 to-purple-500/0"
            : "from-orange-500/10 to-orange-500/0",
    text:
      color === "blue"
        ? "text-blue-600"
        : color === "green"
          ? "text-green-600"
          : color === "purple"
            ? "text-purple-600"
            : "text-orange-600",
    badgeBg:
      color === "blue"
        ? "bg-blue-600"
        : color === "green"
          ? "bg-green-600"
          : color === "purple"
            ? "bg-purple-600"
            : "bg-orange-600",
  } as const;
}

export default function Features() {
  return (
    <section className="overflow-hidden relative py-20 bg-gray-100 dark:bg-neutral-900">
      {/* Optional: Abstract background shapes/gradients for visual interest */}
      <div className="absolute left-0 top-1/4 w-48 h-48 rounded-full opacity-50 bg-blue-500/10 mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute right-0 bottom-1/4 w-64 h-64 rounded-full opacity-50 bg-purple-500/10 mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />

      <div className="container relative z-10 px-4 mx-auto lg:px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
            Why Cyclists Choose Zevlin Crack
          </h2>
        </div>

        {/* Feature Grid: compact, uniform, bold styling */}
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible" // Animate when element comes into view
          viewport={{ once: true, amount: 0.3 }} // Only animate once, when 30% visible
        >
          {features.map(({ title, description, icon: Icon, color, badge, highlights }, i) => {
            const colors = colorClasses(color);
            const index = (i + 1).toString().padStart(2, "0");

            return (
              <motion.div
                key={i}
                className="group relative flex h-full min-h-[220px] flex-col justify-between overflow-hidden rounded-xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-neutral-700 dark:bg-neutral-950"
                variants={itemVariants}
                aria-label={title}
              >
                {/* Bold left accent */}
                <div className={`absolute left-0 top-0 h-full w-1 ${colors.badgeBg}`} />

                {/* Ghost index for attitude */}
                <div className={`pointer-events-none absolute right-3 top-1 text-6xl font-black ${colors.text} opacity-10 select-none`}>{index}</div>

                {/* Badge */}
                <span className={`absolute right-3 top-3 rounded-full ${colors.badgeBg} px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm`}>{badge}</span>

                {/* Header */}
                <div className="mb-3 flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colors.solid} text-white shadow-md transition-transform group-hover:rotate-1 group-hover:scale-105`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-extrabold uppercase tracking-wide text-gray-900 dark:text-white">
                    {title}
                  </h3>
                </div>

                {/* Body */}
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {description}
                </p>

                {/* Highlights */}
                <ul className="mt-4 grid gap-1.5">
                  {highlights.map((h, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-300">
                      <CheckCircle2 className={`mt-0.5 h-4 w-4 ${colors.text}`} />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                {/* Bottom gradient indicator */}
                <span className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${colors.soft} transition-all duration-300 group-hover:w-full`} />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
