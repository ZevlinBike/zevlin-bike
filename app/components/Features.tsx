"use client";
import { Bike, Shield, Leaf, Trophy } from "lucide-react";
import { motion } from "framer-motion"; // Import motion

const features = [
  {
    title: "All-Day Comfort",
    description:
      "Our formula reduces friction and prevents saddle sores, keeping you comfortable on your longest rides. Experience seamless performance, mile after mile.",
    icon: Bike,
    color: "blue", // Use color name for better Tailwind class generation
  },
  {
    title: "Skin Protection",
    description:
      "Creates a long-lasting, protective barrier on your skin to fight friction, chafing, and irritation. Your skin stays healthy, ride after ride.",
    icon: Shield,
    color: "green",
  },
  {
    title: "Natural Formula",
    description:
      "Made with natural, non-tingle ingredients, our cream is gentle on your skin and perfect for everyday use. Feel good about what you put on your body.",
    icon: Leaf,
    color: "purple",
  },
  {
    title: "Pro-Cyclist Approved",
    description:
      "Developed with and trusted by professional cyclists to perform at the highest levels. Get the edge that pros rely on for peak performance.",
    icon: Trophy,
    color: "orange",
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
};

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function Features() {
  return (
    <section className="overflow-hidden relative py-20 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black">
      {/* Optional: Abstract background shapes/gradients for visual interest */}
      <div className="absolute left-0 top-1/4 w-48 h-48 rounded-full opacity-50 bg-blue-500/10 mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute right-0 bottom-1/4 w-64 h-64 rounded-full opacity-50 bg-purple-500/10 mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />

      <div className="container relative z-10 px-4 mx-auto lg:px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
            Why Cyclists Choose Zevlin Crack
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            Engineered for cyclists who demand performance and style without
            compromise.
          </p>
        </div>

        {/* Feature Grid: Using Framer Motion container */}
        <motion.div
          className="grid gap-12 md:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible" // Animate when element comes into view
          viewport={{ once: true, amount: 0.3 }} // Only animate once, when 30% visible
        >
          {features.map(({ title, description, icon: Icon, color }, i) => (
            <motion.div
              key={i}
              className="flex relative flex-col items-center p-8 rounded-2xl border border-gray-100 shadow-lg transition-all duration-300 dark:border-gray-700 hover:shadow-xl bg-white/70 backdrop-blur-md group dark:bg-gray-800/70 hover:scale-[1.02]"
              variants={itemVariants} // Apply item animation variants
            >
              {/* Dynamic Color Ring/Glow */}
              <div
                className={`absolute inset-0 rounded-2xl ring-2 ring-${color}-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
              />
              <div
                className={`absolute w-32 h-32 rounded-full blur-2xl opacity-10 ${
                  color === "blue"
                    ? "bg-blue-500"
                    : color === "green"
                      ? "bg-green-500"
                      : color === "purple"
                        ? "bg-purple-500"
                        : "bg-orange-500"
                }`}
              />

              {/* Icon Container: Larger, more prominent */}
              <div
                className={`relative z-10 flex justify-center items-center mb-6 w-20 h-20 rounded-full ${
                  color === "blue"
                    ? "bg-blue-600"
                    : color === "green"
                      ? "bg-green-600"
                      : color === "purple"
                        ? "bg-purple-600"
                        : "bg-orange-600"
                } shadow-lg transform transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}
              >
                <Icon className="w-10 h-10 text-white" />
              </div>

              {/* Text Content */}
              <h3 className="mb-3 text-2xl font-semibold text-center text-gray-900 dark:text-white">
                {title}
              </h3>
              <p className="text-center text-gray-600 dark:text-gray-400">
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
