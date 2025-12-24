"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { Variants, Easing } from "framer-motion";
import PageShell from "@/app/components/layouts/PageShell";
import Newsletter from "../components/Newsletter";
import { ShieldCheck, Mail, FileText, Lock, Database, Cookie, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // subtle hero parallax (no Image needed for privacy page)
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const easeOutCubic: Easing = [0.16, 1, 0.3, 1];

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOutCubic } },
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.1 } },
  };

  return (
    <PageShell>
      <div
        ref={containerRef}
        className="bg-white dark:bg-neutral-950 min-h-screen text-neutral-900 dark:text-white selection:bg-emerald-100 selection:text-emerald-900"
      >
        {/* --- SECTION 1: EDITORIAL HERO (mirrors About) --- */}
        <div className="relative pt-32 pb-10 sm:pt-40 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl mx-auto">
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50 mb-6"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Legal
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter text-neutral-900 dark:text-white leading-[1.1]"
            >
              Customer <span className="text-emerald-600 dark:text-emerald-500">Privacy</span> Policy
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mt-6 text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed"
            >
              We do not buy or sell personal information. We collect only what we need to run the business and fulfill
              orders—nothing more.
            </motion.p>

            <motion.p variants={fadeInUp} className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
              Last updated: July 20, 2025
            </motion.p>
          </motion.div>
        </div>

        {/* --- SECTION 2: CINEMATIC “POLICY SLAB” (mirrors the big image block) --- */}
        <div className="w-full px-4 sm:px-6 lg:px-8 mb-20 sm:mb-28">
          <motion.div
            style={{ opacity }}
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: easeOutCubic, delay: 0.15 }}
            className="relative w-full max-w-[1600px] mx-auto rounded-3xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800"
          >
            <motion.div style={{ y }} className="relative">
              {/* decorative gradient “hero” surface */}
              <div className="relative h-[44vh] sm:h-[52vh] bg-neutral-50 dark:bg-neutral-900">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.18),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.22),transparent_55%)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/[0.05] via-transparent to-transparent dark:from-black/30" />

                {/* overlay text like About */}
                <div className="absolute bottom-0 left-0 p-8 sm:p-12">
                  <p className="text-sm font-semibold tracking-widest uppercase text-neutral-600 dark:text-neutral-300 mb-2">
                    The principle
                  </p>
                  <p className="text-2xl sm:text-3xl font-medium max-w-xl leading-tight text-neutral-900 dark:text-white">
                    “Collect less. Store less. Share less.”
                  </p>
                  <p className="mt-3 max-w-xl text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    We handle customer data the way we’d want ours handled: minimal, explicit, and purposeful.
                  </p>
                </div>

                {/* icon row */}
                <div className="absolute top-8 right-8 hidden sm:flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-2 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/50">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">Data-respectful</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* --- SECTION 3: “POLICY PILLARS” (mirrors About’s feature grid) --- */}
        <section className="px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28 max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl font-bold tracking-tight">What this policy covers</h2>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                icon: Database,
                title: "Data we collect",
                desc: "Checkout details, shipping info, order history, and support messages—only what's needed to operate.",
              },
              {
                icon: Lock,
                title: "How we protect it",
                desc: "We use practical safeguards and limit access to necessary business operations.",
              },
              {
                icon: Cookie,
                title: "Analytics & cookies",
                desc: "We may use basic analytics to understand site performance; we avoid invasive tracking.",
              },
              {
                icon: FileText,
                title: "Sharing",
                desc: "We do not sell personal information. We share only with service providers needed to fulfill orders.",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="group p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 transition-colors hover:border-emerald-500/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
              >
                <div className="h-10 w-10 rounded-lg bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 group-hover:scale-110 transition-transform duration-300">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-neutral-900 dark:text-white">{f.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* --- SECTION 4: “SPLIT STORY” BUT LEGAL (mirrors About’s dark section) --- */}
        <section className="bg-neutral-900 text-white overflow-hidden py-20 sm:py-28 relative">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
                  Plain language, <br />
                  <span className="text-neutral-400">no games.</span>
                </h2>

                <div className="space-y-5 text-lg text-neutral-300 leading-relaxed">
                  <p>
                    Zevlin Bike does not buy or sell personal information. We collect what we need to run the shop, ship
                    orders, and provide support.
                  </p>
                  <p>
                    If we use vendors (payments, shipping, email), they receive only what is necessary to perform their
                    service. We do not authorize hidden profiling of customers.
                  </p>
                  <p>
                    You can contact us at any time to ask what we store, request corrections, or ask for deletion where
                    applicable.
                  </p>
                </div>

                <div className="mt-8 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row gap-4 sm:items-center">
                  <Button
                    size="lg"
                    className="rounded-full h-12 px-8 text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                    asChild
                  >
                    <a href="mailto:zevlinbike@gmail.com">
                      Email support <Mail className="ml-2 h-4 w-4" />
                    </a>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full h-12 px-8 text-base border-neutral-700 text-white hover:bg-neutral-800"
                    asChild
                  >
                    <Link href="/contact">
                      Contact page <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950"
              >
                <div className="p-6 sm:p-8">
                  <div className="text-sm font-semibold tracking-widest uppercase text-neutral-400 mb-3">
                    Quick answers
                  </div>

                  <div className="space-y-5">
                    {[
                      {
                        q: "Do you sell customer data?",
                        a: "No. We do not buy or sell personal information.",
                      },
                      {
                        q: "Do you store card numbers?",
                        a: "No. Payments are handled by payment processors. We do not store raw card numbers.",
                      },
                      {
                        q: "Who sees my info?",
                        a: "Only Zevlin Bike and essential service providers (e.g., shipping/payment) to fulfill orders.",
                      },
                      {
                        q: "How do I ask a question?",
                        a: "Email us at zevlinbike@gmail.com and we’ll respond.",
                      },
                    ].map((row, i) => (
                      <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                        <div className="font-semibold text-white">{row.q}</div>
                        <div className="mt-1 text-sm text-neutral-300 leading-relaxed">{row.a}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 text-xs text-neutral-500">
                    This page is for transparency and general information and is not legal advice.
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- SECTION 5: CTA (Newsletter, styled like About CTA) --- */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
          >
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-6 text-neutral-900 dark:text-white">
              Want the short version?
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-10 max-w-2xl mx-auto">
              We keep data collection minimal and never sell personal information.
            </p>

          </motion.div>
        </section>
      </div>
              <Newsletter />
    </PageShell>
  );
}
