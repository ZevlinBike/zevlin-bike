"use client";

import Image from "next/image";
import { motion, Variants } from "framer-motion";
import MainLayout from "@/components/layouts/MainLayout";

export default function AboutPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  } satisfies Variants;

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  } satisfies Variants;

  return (
    <MainLayout>
    <div className="relative pt-24 min-h-screen text-gray-900 bg-gray-100 dark:text-gray-100 dark:bg-neutral-900">
      {/* Hero Section */}
      <div className="flex overflow-hidden relative justify-center items-center pt-32 h-[400px] md:h-[500px] lg:h-[600px]">
        <Image
          src="/images/about-hero-image.png"
          alt="Cyclist riding on open road"
          fill
          style={{ objectFit: "cover" }}
          className="opacity-70 contrast-125 saturate-125" // Slightly increased opacity for more vibrancy
          priority
        />
        {/* Gradient Overlay for more depth */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b to-gray-100 from-gray-50/50 via-gray-100/50 dark:from-neutral-950/50 dark:via-neutral-900/50 dark:to-neutral-900" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r to-gray-100 from-gray-100 via-transparent dark:from-neutral-950/50 dark:via-neutral-900/50 dark:to-neutral-900" />
        <motion.div
          className="relative z-10 px-4 text-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h1
            className="mb-4 text-4xl font-extrabold leading-tight text-black dark:text-white md:text-6xl drop-shadow-lg font-montserrat" // Added a new font class (assuming Montserrat is linked)
            variants={itemVariants}
          >
            Our Passion Fuels Your Ride
          </motion.h1>
          <motion.p
            className="mx-auto max-w-2xl text-lg text-gray-800 dark:text-gray-200 md:text-xl drop-shadow-md" // Slightly more pronounced shadow
            variants={itemVariants}
          >
            Discover the dedication behind Zevlin Bike – crafting premium
            solutions for every cyclist.
          </motion.p>
        </motion.div>
      </div>

      {/* Main Content */}
      <section className="flex justify-center py-24 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative z-20 p-10 mx-auto max-w-4xl bg-white bg-opacity-95 rounded-2xl border border-blue-100 shadow-xl md:p-14 dark:bg-gray-800 dark:border-gray-700 backdrop-blur-sm" // Added blue border and slight blur/opacity
          initial="hidden"
          whileInView="visible"
          variants={containerVariants}
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.h2
            className="mb-8 text-3xl font-bold text-center text-gray-900 dark:text-white font-poppins" // Added a new font class (assuming Poppins is linked)
            variants={itemVariants}
          >
            About Zevlin Bike
          </motion.h2>
          <div className="mx-auto text-gray-700 dark:text-gray-300 prose prose-lg dark:prose-invert">
            <motion.p className="mb-4" variants={itemVariants}>
              At Zevlin Bike, we are more than just a brand; we are cyclists
              ourselves, deeply passionate about the sport and committed to
              enhancing every ride. We specialize in creating{" "}
              <strong>
                high-quality skincare products meticulously designed for
                cyclists, by cyclists.
              </strong>
            </motion.p>
            <motion.p className="mb-4" variants={itemVariants}>
              Our journey began with a simple mission: to provide the cycling
              community with the finest products on the market, engineered to
              deliver unparalleled comfort, protection, and performance. We
              believe that every mile should be enjoyed, free from discomfort,
              allowing you to focus on the road ahead and the joy of cycling.
            </motion.p>
            <motion.p variants={itemVariants}>
              From our innovative chamois creams
              every Zevlin product is a testament to our dedication to quality,
              natural ingredients, and rigorous testing by professional riders.
              We don&apos;t just sell products; we offer solutions crafted from
              real-world experience, ensuring you have the edge you need for
              your longest and most challenging rides.
            </motion.p>
          </div>
        </motion.div>
      </section>

      {/* Why We Ride Section */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <motion.div
          className="p-10 mx-auto max-w-4xl bg-white bg-opacity-95 rounded-2xl border border-blue-100 shadow-xl md:p-14 dark:bg-gray-800 dark:border-gray-700 backdrop-blur-sm" // Added blue border and slight blur/opacity
          initial="hidden"
          whileInView="visible"
          variants={containerVariants}
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.h2
            className="mb-8 text-3xl font-bold text-center text-gray-900 dark:text-white font-poppins" // Added new font class
            variants={itemVariants}
          >
            Why We Ride
          </motion.h2>
          <div className="flex flex-col gap-10 items-center mx-auto md:flex-row md:gap-8">
            <motion.div
              className="grid overflow-hidden relative justify-center items-center w-64 rounded-full border-4 border-blue-300 shadow-lg transition-transform duration-300 ease-out transform hover:scale-105 aspect-square" // Larger, more prominent image and hover effect
              variants={itemVariants}
            >
              <Image
                fill
                className="object-cover"
                alt="Glenn, Zevlin Bike Team Member" // More descriptive alt text
                src="/images/owner-0.png"
              />
            </motion.div>
            <div className="text-center md:text-left">
              <motion.p
                className="mb-6 font-serif text-xl italic text-gray-800 dark:text-gray-200" // Slightly larger, more distinctive italic font
                variants={itemVariants}
              >
                “Every product we create at Zevlin Bike stems from a deep
                understanding of a cyclist&apos;s needs. We&apos;re not just
                selling gear—we’re sharing our passion for the ride.”
              </motion.p>
              <motion.p
                className="text-xl font-semibold text-blue-700 dark:text-blue-300" // Accent color for signature
                variants={itemVariants}
              >
                — The Zevlin Team
              </motion.p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
    </MainLayout>
  );
}
