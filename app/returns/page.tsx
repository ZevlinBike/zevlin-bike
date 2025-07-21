"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";

export default function ReturnsPage() {
  const [form, setForm] = useState({
    orderNumber: "",
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Submitted:", form);
    // TODO: Replace with actual email sending, webhook, or API call
    alert("Return request submitted. We'll get back to you shortly.");
    setForm({ orderNumber: "", name: "", email: "", message: "" });
  };

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
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold leading-tight text-gray-900 md:text-5xl dark:text-white">
            Returns & Refunds
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Hassle-free returns within 30 days.
          </p>
        </header>

        <section className="mb-12 text-gray-700 dark:text-gray-300 prose prose-lg dark:prose-invert">
          <p>
            <strong>Returns:</strong>
            <br />
            Return any product within 30 days of purchase, even if it&apos;s
            opened or used.
          </p>
          <p>
            <strong>Simple Process:</strong>
            <br />
            Reach out to us directly—we&apos;ll guide you every step of the way.
          </p>
          <p>
            <strong>Refunds:</strong>
            <br />
            Refunds will be credited to the card used to make the initial
            purchase.
          </p>
        </section>

        {/* FORM */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            Start a Return
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="orderNumber"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Order Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="orderNumber"
                name="orderNumber"
                required
                value={form.orderNumber}
                onChange={handleChange}
                className="block mt-1 w-full rounded-md border-gray-300 shadow-sm dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="block mt-1 w-full rounded-md border-gray-300 shadow-sm dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="block mt-1 w-full rounded-md border-gray-300 shadow-sm dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Additional Info (optional)
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={form.message}
                onChange={handleChange}
                className="block mt-1 w-full rounded-md border-gray-300 shadow-sm dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
              ></textarea>
            </div>

            <button
              type="submit"
              className="inline-flex justify-center py-2 px-5 text-sm font-medium text-white bg-blue-600 rounded-md border border-transparent shadow-sm dark:bg-blue-500 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:hover:bg-blue-400"
            >
              Submit Return Request
            </button>
          </form>
        </section>
      </motion.article>
    </div>
  );
}
