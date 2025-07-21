"use client"; // Retained for Framer Motion

import Image from "next/image";
import { motion, Variants } from "framer-motion"; // For animations
import CTA from "../components/CTA";

export default function MissionPage() {
  // Framer Motion variants for staggered content reveal
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3, // Slightly more delay for hero content
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  // Variants for individual mission statement paragraphs
  const missionTextVariants: Variants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  return (
    // Main container uses the subtle gradient for the overall page background
    <div className="relative min-h-screen text-gray-900 bg-gradient-to-b from-gray-100 to-white dark:text-white dark:from-neutral-900 dark:to-neutral-900">
      {/* Hero Section - Visually impactful, similar to About Page hero */}
      <div className="flex overflow-hidden relative justify-center items-center pt-32 h-[450px] md:h-[550px]">
        <Image
          src="/images/mission-hero-image.jpeg" // Replace with a compelling image representing "mission," "journey," "crushing goals"
          alt="Cyclist on a challenging and inspiring journey"
          fill
          style={{ objectFit: "cover", zIndex: 0 }}
          className="opacity-40 grayscale saturate-150 rotate-y-180" // Consistent image styling
          priority
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-b to-gray-100 from-gray-50/50 via-gray-100/50 dark:from-neutral-950/50 dark:via-neutral-900/50 dark:to-neutral-900" />
        <motion.div
          className="relative z-20 px-4 text-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h1
            className="mb-4 text-4xl font-extrabold leading-tight dark:text-white md:text-6xl drop-shadow-lg"
            variants={itemVariants}
          >
            Our Mission: Define Your Ride.
          </motion.h1>
          <motion.p
            className="mx-auto max-w-2xl text-lg dark:text-gray-200 md:text-xl drop-shadow"
            variants={itemVariants}
          >
            Empowering every cyclist through quality, performance, and
            community.
          </motion.p>
        </motion.div>
      </div>

      {/* Main Mission Content - Elevated and structured */}
      <section className="flex justify-center py-16 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid relative z-20 gap-8 p-8 mx-auto -mt-24 max-w-5xl bg-white rounded-2xl border border-gray-100 shadow-2xl md:grid-cols-2 md:gap-12 md:p-12 dark:bg-gray-800 dark:border-gray-700" // Larger max-width, grid layout
          initial="hidden"
          whileInView="visible"
          variants={containerVariants}
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Column 1: Core Mission & Products */}
          <div>
            <motion.h2
              className="mb-4 text-3xl font-bold text-gray-900 dark:text-white"
              variants={itemVariants}
            >
              Excellence in Every Detail
            </motion.h2>
            <div className="text-gray-700 dark:text-gray-300 prose prose-lg dark:prose-invert">
              <motion.p className="mb-4" variants={missionTextVariants}>
                We&apos;re on a{" "}
                <span className="italic">
                  mission to craft top-notch products
                </span>{" "}
                that push boundaries, designed to help you{" "}
                <span className="italic">crush your goals</span> and make every
                ride (or run, or hike) significantly more enjoyable. We
                relentlessly focus on{" "}
                <span className="italic">
                  high quality and peak performance
                </span>
                , while always maintaining a{" "}
                <span className="italic">light environmental footprint</span>.
              </motion.p>
              <motion.p className="mb-4" variants={missionTextVariants}>
                From the drawing board to your gear bag, every Zevlin product is
                engineered with a singular{" "}
                <span className="italic">purpose</span>: to enhance your
                comfort, protect your skin, and elevate your experience on two
                wheels.
              </motion.p>
            </div>
          </div>

          {/* Column 2: Community & Philosophy */}
          <div>
            <motion.h2
              className="mb-4 text-3xl font-bold text-gray-900 dark:text-white"
              variants={itemVariants}
            >
              Community & Purpose
            </motion.h2>
            <div className="text-gray-700 dark:text-gray-300 prose prose-lg dark:prose-invert">
              <motion.p className="mb-4" variants={missionTextVariants}>
                Beyond products, we&apos;re dedicated to cultivating a{" "}
                <span className="italic">culture</span>
                that&apos;s as{" "}
                <span className="italic">
                  inclusive, diverse, and welcoming
                </span>{" "}
                as your favorite group ride. We believe the joy of cycling is
                best shared, and we strive to build connections that extend far
                beyond the finish line.
              </motion.p>
              <motion.p variants={missionTextVariants}>
                We <span className="italic">design with purpose</span>,{" "}
                <span className="italic">market with heart</span>, and always
                keep the <span className="italic">fun in functional</span>, one
                comfortable &quot;tingle&quot; at a time. Our commitment is to
                you, the rider, ensuring every interaction with Zevlin Bike
                inspires confidence and adventure.
              </motion.p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Optional: Call to Action or Unique Selling Point Section */}
      <CTA />
    </div>
  );
}
