"use client";

import { useActionState } from "react";
import { motion, Variants } from "framer-motion";
import Newsletter from "../components/Newsletter";
import { ContactFormState, sendContactMessage } from "./actions";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PageShell from "../components/layouts/PageShell";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    honeypot: "",
  });
  const [blocked, setBlocked] = useState(false);

  const initialState: ContactFormState = {
    success: false,
    message: "",
  };
  const [state, formAction] = useActionState(sendContactMessage, initialState);

  // Check for rate-limit cookie on mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      const cookie = document.cookie || "";
      if (cookie.includes("contact_sent=1")) {
        setBlocked(true);
      }
    }
  }, []);

  useEffect(() => {
    if (state.success) {
      toast.success("Message sent to our admins. Thank you!");
      setForm({
        name: "",
        email: "",
        subject: "",
        message: "",
        honeypot: "",
      });
      // Set a cookie to block re-submission for 12 hours
      const twelveHours = 60 * 60 * 12;
      if (typeof document !== "undefined") {
        document.cookie = `contact_sent=1; Max-Age=${twelveHours}; Path=/; SameSite=Lax`;
      }
      setBlocked(true);
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state.success, state.message]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const variants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (blocked) {
      e.preventDefault();
      toast.error("You recently sent a message. Please try again later.");
    }
  }

  return (
    <PageShell>
      <div className="grid justify-center items-start px-4 pt-40 min-h-screen mb-16 bg-gradient-to-b from-amber-50 to-rose-50 sm:px-6 lg:px-8 dark:from-neutral-950 dark:to-neutral-900">
        <motion.div
          className="p-8 mx-auto w-full max-w-3xl bg-white/90 backdrop-blur rounded-2xl ring-1 ring-black/5 shadow-xl dark:bg-neutral-900/90 dark:ring-white/10"
          variants={variants}
          initial="hidden"
          animate="visible"
        >
        <header className="mb-8 space-y-3 text-center">
          <div className="text-2xl" aria-hidden>👋</div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">Say hello</h1>
          <p className="text-base text-gray-600 dark:text-gray-400">We love notes from riders, tinkerers, and the just‑curious. Share questions, ideas, or wild dreams — we actually read every one.</p>
        </header>

        <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
              Name <span className="font-normal text-gray-500">(what should we call you?)</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Ada, Alex, Captain Banana…"
              required
              value={form.name}
              onChange={handleChange}
              disabled={blocked}
              className="block mt-1 w-full rounded-xl border border-gray-300/70 bg-white text-gray-900 placeholder-gray-400 shadow-sm p-1 disabled:bg-gray-100 disabled:text-gray-500 dark:text-white dark:bg-neutral-800 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
              Email <span className="font-normal text-gray-500">(so we can reply)</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@yourdomain.com"
              required
              value={form.email}
              onChange={handleChange}
              disabled={blocked}
              className="block mt-1 w-full rounded-xl border border-gray-300/70 bg-white text-gray-900 placeholder-gray-400 shadow-sm p-1 disabled:bg-gray-100 disabled:text-gray-500 dark:text-white dark:bg-neutral-800 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
              Subject <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              placeholder="Quick question about…"
              value={form.subject}
              onChange={handleChange}
              disabled={blocked}
              className="block mt-1 w-full rounded-xl border border-gray-300/70 bg-white text-gray-900 placeholder-gray-400 shadow-sm p-1 disabled:bg-gray-100 disabled:text-gray-500 dark:text-white dark:bg-neutral-800 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={6}
              placeholder="Tell us what you’re thinking. The more details the better."
              required
              value={form.message}
              onChange={handleChange}
              disabled={blocked}
              className="block mt-1 w-full rounded-xl border border-gray-300/70 bg-white text-gray-900 placeholder-gray-400 shadow-sm p-1 disabled:bg-gray-100 disabled:text-gray-500 dark:text-white dark:bg-neutral-800 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            ></textarea>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">We reply within a day or two. No bots. No auto‑replies.</p>
          </div>

          <div className="hidden">
            <label
              htmlFor="honeypot"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Honeypot
            </label>
            <input
              id="honeypot"
              name="honeypot"
              type="text"
              value={form.honeypot}
              onChange={handleChange}
              className="block mt-1 w-full rounded-md border border-gray-300 shadow-sm p-1 dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={blocked}
            className="py-3 px-6 w-full text-base font-bold text-white bg-fuchsia-600 rounded-xl shadow-sm transition-transform duration-200 disabled:opacity-60 hover:scale-[1.02] hover:bg-fuchsia-700 active:scale-[0.99] dark:bg-fuchsia-500 dark:hover:bg-fuchsia-600"
          >
            Send it 🚀
          </button>
          {blocked && (
            <p className="text-sm text-gray-600 dark:text-gray-300">You recently sent a message from this device. Thanks for your enthusiasm — try again in a few hours.</p>
          )}
          {state.message && (
            <p
              className={`text-sm ${
                state.success ? "text-green-500" : "text-red-500"
              }`}
            >
              {state.message}
            </p>
          )}
        </form>
        </motion.div>
      </div>
      {/* Spacer before full-width newsletter */}
      <Newsletter />
    </PageShell>
  );
}
