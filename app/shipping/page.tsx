"use client";

import { motion, Variants } from "framer-motion";

export default function ShippingInfoPage() {
  const contentVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  return (
    <div className="grid justify-center items-start px-4 pt-40 pb-8 min-h-screen bg-gradient-to-br from-gray-50 to-white sm:px-6 lg:px-8 dark:from-gray-900 dark:to-black">
      <motion.article
        className="p-8 mx-auto max-w-3xl bg-white rounded-2xl border border-gray-100 shadow-xl dark:bg-gray-800 dark:border-gray-700"
        variants={contentVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <header className="mb-8 space-y-2">
          <h1 className="text-4xl font-extrabold leading-tight text-gray-900 md:text-5xl dark:text-white">
            Shipping Information
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            How we pack, ship, and deliver your Zevlin gear.
          </p>
        </header>

        <section className="space-y-10 text-gray-700 dark:text-gray-300">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Processing Time
            </h2>
            <p>
              Orders are typically processed and shipped within 1–2 business
              days. During sales or high-volume periods, this may extend
              slightly.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Shipping Methods
            </h2>
            <p>
              We ship via USPS and UPS. At checkout, you&apos;ll see available
              shipping options based on your location.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Estimated Delivery Times
            </h2>
            <ul className="space-y-1 list-disc list-inside">
              <li>
                <strong>Domestic (U.S.):</strong> 2–5 business days
              </li>
              <li>
                <strong>International:</strong> 7–21 business days (if
                applicable)
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Free Shipping
            </h2>
            <p>
              Orders over $49 automatically qualify for free standard shipping
              within the U.S.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Tracking
            </h2>
            <p>
              Once your order ships, you&apos;ll receive a tracking number via
              email. You can use it to monitor delivery progress in real-time.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Lost or Damaged Packages
            </h2>
            <p>
              If your package is delayed, lost, or arrives damaged, reach out to
              us immediately at{" "}
              <a
                href="mailto:zevlinbike@gmail.com"
                className="text-blue-600 transition-colors duration-200 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                zevlinbike@gmail.com
              </a>
              . We’ll make it right.
            </p>
          </div>
        </section>
      </motion.article>
    </div>
  );
}
