"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import Image from "next/image";
import { motion, Variants } from "framer-motion"; // Import motion for animations

export default function CTA() {
  // Framer Motion variants for subtle animation
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
        duration: 0.7,
        ease: "easeOut",
      },
    },
  } satisfies Variants;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  } satisfies Variants;

  return (
    <section className="flex overflow-hidden relative justify-center items-center py-20 min-h-[500px] border-t border-black/25 dark:border-white/25">
      {/* Background Image with Enhanced Overlay */}
      <div className="absolute inset-0">
        <Image
          className="object-cover opacity-50 grayscale saturate-150" // Increased opacity, added saturation for a punchier grayscale
          src="/images/hero-image.jpeg"
          alt="Zevlin Bike Hero"
          fill
          priority
        />
        {/* Darker, more gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b dark:from-black/50 dark:via-black/70 dark:to-neutral-900 from-white/50 via-white/70 to-gray-100" />
      </div>

      {/* Content Container - now animated */}
      <motion.div
        className="container relative z-10 px-4 mx-auto text-center lg:px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.h2
          className="mb-4 text-4xl font-extrabold text-blue-700 dark:text-yellow-400 md:text-5xl drop-shadow-lg" // Larger, bolder text, added drop shadow
          variants={itemVariants}
        >
          Ready for Your Smoothest Ride Yet?
        </motion.h2>

        <motion.p
          className="mx-auto mb-8 max-w-2xl text-xl text-gray-800 dark:text-gray-200" // Slightly lighter gray for more contrast
          variants={itemVariants}
        >
          Join thousands of riders who trust Zevlin for a chafe-free experience,
          ride after ride.
        </motion.p>

        {/* Integrated Benefits - now part of the main paragraph flow or just before the button */}
        <motion.div
          className="flex flex-col gap-4 justify-center items-center mb-10 text-lg font-medium text-gray-800 dark:text-gray-200 sm:flex-row" // Larger text for benefits
          variants={itemVariants}
        >
          <div className="flex items-center italic">
            <CheckCircle className="mr-2 w-6 h-6 text-blue-700 dark:text-yellow-400 animate-pulse" />{" "}
            {/* Slightly larger icon, added subtle pulse animation */}
            Long-lasting comfort
          </div>
          <div className="flex items-center italic">
            <CheckCircle className="mr-2 w-6 h-6 text-blue-700 dark:text-yellow-400 animate-pulse animation-delay-500" />{" "}
            {/* Added animation delay for second icon */}
            Made with natural ingredients
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            size="lg"
            className="py-4 px-10 text-xl font-bold text-gray-100 dark:text-gray-900 bg-blue-700 dark:bg-yellow-400 rounded-full shadow-xl transition-all duration-300 transform hover:bg-yellow-500 hover:shadow-2xl hover:scale-105 group" // Bolder button, larger padding, scale/shadow on hover
          >
            Gear Up Now
            <ArrowRight className="ml-2 w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" />{" "}
            {/* Larger arrow, slides on hover */}
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
