"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import Newsletter from "../components/Newsletter";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
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
    console.log("Submitted form:", form);
    alert("Your message has been sent!");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  const variants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div className="grid justify-center items-start px-4 pt-40 min-h-screen bg-gradient-to-b from-gray-200 to-gray-300 sm:px-6 lg:px-8 dark:from-neutral-950 dark:to-neutral-900">
      <motion.div
        className="p-8 mx-auto w-full max-w-3xl bg-white rounded-2xl border border-gray-100 shadow-xl dark:bg-gray-800 dark:border-gray-700"
        variants={variants}
        initial="hidden"
        animate="visible"
      >
        <header className="mb-8 space-y-2 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            Get in Touch
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Have a question, suggestion, or just want to say hi? Fill out the
            form below and we&apos;ll get back to you ASAP.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className="block mt-1 w-full rounded-md border border-gray-300 shadow-sm dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
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
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="block mt-1 w-full rounded-md border border-gray-300 shadow-sm dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Subject
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              value={form.subject}
              onChange={handleChange}
              className="block mt-1 w-full rounded-md border border-gray-300 shadow-sm dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              value={form.message}
              onChange={handleChange}
              className="block mt-1 w-full rounded-md border border-gray-300 shadow-sm dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            ></textarea>
          </div>

          <button
            type="submit"
            className="py-2 px-5 w-full font-medium text-white bg-blue-600 rounded-md transition-colors duration-200 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400"
          >
            Send Message
          </button>
        </form>
      </motion.div>
      <div className="mt-16">
        <Newsletter />
      </div>
    </div>
  );
}
