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
    <section className="relative overflow-hidden py-20 bg-black text-white border-y border-white/10">
      <div className="container relative z-10 px-4 mx-auto lg:px-6">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h3
            className="mb-3 text-4xl md:text-5xl font-extrabold leading-tight tracking-tight"
            variants={fadeInRise}
          >
            A mediocre newsletter. Occasionally.
          </motion.h3>

          <motion.p
            className="mx-auto mb-8 max-w-xl text-lg text-gray-300"
            variants={fadeInRise}
          >
            Every once in a while — when we actually have something cool to share.
            No spam. No fluff. Just the good stuff, when it exists.
          </motion.p>

          <motion.div
            className="flex flex-col gap-4 mx-auto max-w-md sm:flex-row"
            variants={fadeInRise}
          >
            <form action={formAction} ref={formRef} className="flex flex-col gap-4 mx-auto max-w-md sm:flex-row">
              <Input
                type="email"
                name="email"
                placeholder="you@yourdomain.com"
                className="flex-grow h-12 py-2.5 px-4 placeholder-gray-400 text-white bg-gray-800 rounded-lg border border-white/10 shadow-sm transition-all duration-300 focus:border-white/30 focus:ring-1 focus:ring-white/30"
                required
              />
              <Button
                type="submit"
                className="h-12 px-6 text-base font-bold text-black whitespace-nowrap bg-white shadow-md transition-all duration-300 hover:bg-gray-200 hover:scale-105"
              >
                Fine, sign me up
              </Button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
