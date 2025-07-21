"use client";

import { motion, Variants } from "framer-motion";
import Newsletter from "../components/Newsletter";

export default function PrivacyPage() {
  const contentVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  } satisfies Variants;

  return (
    <div className="grid justify-center items-start px-4 pt-40 min-h-screen bg-gradient-to-br from-gray-50 to-white sm:px-6 lg:px-8 dark:from-gray-900 dark:to-black">
      <motion.article
        className="p-8 mx-auto max-w-3xl bg-white rounded-2xl border border-gray-100 shadow-xl dark:bg-gray-800 dark:border-gray-700"
        variants={contentVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold leading-tight text-gray-900 md:text-5xl dark:text-white">
            Customer Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Last Updated: July 20, 2025
          </p>
        </header>

        <section className="text-gray-700 dark:text-gray-300 prose prose-lg dark:prose-invert">
          <p>
            At Zevlin Bike, LLC, we do not buy or sell customers’ personal
            information. We treat our customers and their data the way we would
            like to be treated. We only collect the information that we need to
            run our business, and we don’t collect, or ask any third party to
            collect, information about our customers without their knowledge and
            consent.
          </p>
          <p className="pt-4">
            If you have any questions about our Privacy Policy, please feel free
            to contact us:
            <a
              href="mailto:zevlinbike@gmail.com"
              className="ml-1 text-blue-600 transition-colors duration-200 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              zevlinbike@gmail.com
            </a>
          </p>
        </section>
      </motion.article>

      {/* Optional call-to-action */}
      <div className="mt-16">
        <Newsletter />
      </div>
    </div>
  );
}
