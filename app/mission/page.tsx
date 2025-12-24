"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import PageShell from "@/app/components/layouts/PageShell";
import CTA from "../components/CTA";
import { ShieldCheck, Leaf, HeartHandshake, Zap } from "lucide-react";

export default function MissionPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Parallax like About
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const stagger: Variants = {
    visible: { transition: { staggerChildren: 0.1 } },
  };

  return (
    <PageShell>
      <div
        ref={containerRef}
        className="bg-white dark:bg-neutral-950 min-h-screen text-neutral-900 dark:text-white selection:bg-emerald-100 selection:text-emerald-900"
      >
        {/* --- SECTION 1: EDITORIAL HERO (match About) --- */}
        <div className="relative pt-32 pb-12 sm:pt-40 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl mx-auto">
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50 mb-6"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                The Mission
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter text-neutral-900 dark:text-white leading-[1.1]"
            >
              Define your ride. <br className="hidden sm:block" />
              <span className="text-emerald-600 dark:text-emerald-500">Protect the miles.</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mt-6 text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed"
            >
              We build cyclist-first care products designed on the bike, refined by the community, and engineered for
              comfort that lasts.
            </motion.p>
          </motion.div>
        </div>

        {/* --- SECTION 2: CINEMATIC IMAGE (same layout mechanics as About) --- */}
        <div className="w-full px-4 sm:px-6 lg:px-8 mb-24 sm:mb-32">
          <motion.div
            style={{ opacity }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="relative h-[50vh] sm:h-[65vh] w-full max-w-[1600px] mx-auto rounded-3xl overflow-hidden shadow-2xl"
          >
            <motion.div style={{ y }} className="absolute inset-0 h-[120%] w-full">
              <Image
                src="/images/mission-hero-image.webp"
                alt="Cyclist on a challenging and inspiring journey"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            </motion.div>

            <div className="absolute bottom-0 left-0 p-8 sm:p-12 text-black dark:text-white">
              <p className="text-sm font-semibold tracking-widest uppercase opacity-80 mb-2">The promise</p>
              <p className="text-2xl sm:text-3xl font-medium max-w-lg leading-tight">
                Comfort that stays put — so you can stay on pace.
              </p>
            </div>
          </motion.div>
        </div>

        {/* --- SECTION 3: “WHY” GRID (match About’s card style) --- */}
        <section className="px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32 max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl font-bold tracking-tight">What we stand for</h2>
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
                icon: Zap,
                title: "Performance first",
                desc: "Made to work on long days: hot climbs, cold descents, grit, and sweat.",
              },
              {
                icon: ShieldCheck,
                title: "All-day defense",
                desc: "Protection that stays comfortable without the burn, tingle, or gimmicks.",
              },
              {
                icon: HeartHandshake,
                title: "Community refined",
                desc: "We iterate with feedback from real riders on real roads and trails.",
              },
              {
                icon: Leaf,
                title: "Light footprint",
                desc: "Thoughtful ingredients and decisions that respect the places we ride.",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="group p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 transition-colors hover:border-emerald-500/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
              >
                <div className="h-10 w-10 rounded-lg bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-neutral-900 dark:text-white">{feature.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* --- SECTION 4: SPLIT STORY (use your original copy but in About’s layout) --- */}
        <section className="bg-neutral-900 text-white overflow-hidden py-24 sm:py-32 relative">
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
                  Excellence in every detail, <br />
                  <span className="text-neutral-400">purpose in every drop.</span>
                </h2>

                <div className="space-y-6 text-lg text-neutral-300 leading-relaxed">
                  <p>
                    We&apos;re on a mission to craft top-notch products that push boundaries, designed to help you crush
                    your goals and make every ride (or run, or hike) more enjoyable.
                  </p>
                  <p>
                    We relentlessly focus on high quality and peak performance, while keeping a light environmental
                    footprint.
                  </p>
                  <p>
                    From the drawing board to your gear bag, every Zevlin product is engineered with a singular purpose:
                    enhance comfort, protect skin, and elevate your experience on two wheels.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950"
              >
                <div className="p-6 sm:p-8">
                  <div className="text-sm font-semibold tracking-widest uppercase text-neutral-400 mb-4">
                    Community & purpose
                  </div>

                  <div className="space-y-5 text-neutral-300 leading-relaxed">
                    <p>
                      Beyond products, we&apos;re dedicated to cultivating a culture that&apos;s as inclusive, diverse,
                      and welcoming as your favorite group ride.
                    </p>
                    <p>
                      We design with purpose, market with heart, and keep the fun in functional — one comfortable mile at
                      a time.
                    </p>
                    <p>
                      Our commitment is to you, the rider: every interaction with Zevlin should inspire confidence and
                      adventure.
                    </p>
                  </div>

                  <div className="mt-8 pt-8 border-t border-neutral-800 grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-3xl font-bold text-emerald-400">Rider</div>
                      <div className="text-sm text-neutral-500">first, always</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-emerald-400">No</div>
                      <div className="text-sm text-neutral-500">gimmicks</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- SECTION 5: CTA (reuse your component) --- */}
        <CTA />
      </div>
    </PageShell>
  );
}

