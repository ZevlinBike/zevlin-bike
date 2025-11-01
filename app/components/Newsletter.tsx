"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, Variants } from "framer-motion";
import { useActionState, useEffect, useRef } from "react";
import { signUp } from "@/app/newsletter/actions";
import { toast } from "sonner";

export default function Newsletter() {
  const [state, formAction] = useActionState<{ message: string; error?: string }, FormData>(
    signUp,
    { message: "" }
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      toast(state.message);
      if (state.message === "Thanks for signing up!") {
        formRef.current?.reset();
      }
    }
  }, [state]);

  const fadeInRise = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  } satisfies Variants;

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  } satisfies Variants;

  return (
    <section className="overflow-hidden relative py-20 text-gray-900 dark:text-white dark:from-gray-900 dark:to-black">
      <div className="container relative z-10 px-4 mx-auto lg:px-6">
        <motion.div
          className="p-8 mx-auto max-w-3xl text-center bg-white rounded-2xl border border-gray-100 shadow-xl dark:bg-black dark:border-gray-700"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h3
            className="mb-4 text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl dark:text-white"
            variants={fadeInRise}
          >
            Unlock Your Edge: Join the Zevlin Crew!
          </motion.h3>

          <motion.p
            className="mx-auto mb-8 max-w-xl text-lg text-gray-600 dark:text-gray-400"
            variants={fadeInRise}
          >
            Get exclusive access to cutting-edge cycling tips, early product
            releases, and members-only deals straight to your inbox.
          </motion.p>

          <motion.div
            className="flex flex-col gap-4 mx-auto max-w-md sm:flex-row"
            variants={fadeInRise}
          >
            <form action={formAction} ref={formRef} className="flex flex-col gap-4 mx-auto max-w-md sm:flex-row">
              <Input
                type="email"
                name="email"
                placeholder="Your email address"
                className="flex-grow py-2.5 px-4 placeholder-gray-400 text-gray-900 bg-gray-50 rounded-lg border border-gray-200 shadow-sm transition-all duration-300 dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
              <Button
                type="submit"
                className="font-bold text-white whitespace-nowrap bg-blue-600 shadow-md transition-all duration-300 hover:bg-blue-700 hover:scale-105"
              >
                Subscribe Now
              </Button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
