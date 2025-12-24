"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import PageShell from "@/app/components/layouts/PageShell";
import { ArrowRight, ShieldCheck, Leaf, Zap, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

export default function AboutPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Parallax effect for the hero image
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.1 } },
  };

  return (
    <PageShell>
      <div ref={containerRef} className="bg-white dark:bg-neutral-950 min-h-screen text-neutral-900 dark:text-white selection:bg-[#2c92ac]/20 selection:text-[#2c92ac]">
        
        {/* --- SECTION 1: EDITORIAL HERO --- */}
        <div className="relative pt-32 pb-12 sm:pt-40 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl mx-auto">
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50 mb-6">
              <span className="flex h-2 w-2 rounded-full bg-[#2c92ac] animate-pulse"></span>
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Est. 2024
              </span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter text-neutral-900 dark:text-white leading-[1.1]">
              Performance care for the <br className="hidden sm:block" />
              <span className="text-[#2c92ac]">extra mile.</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="mt-6 text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              We create cyclist-first care products designed on the bike and refined by the community. No gimmicks, just comfort that lasts.
            </motion.p>
          </motion.div>
        </div>

        {/* --- SECTION 2: CINEMATIC IMAGE --- */}
        <div className="w-full px-4 sm:px-6 lg:px-8 mb-24 sm:mb-32">
          <motion.div 
            style={{ opacity }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative h-[50vh] sm:h-[65vh] w-full max-w-[1600px] mx-auto rounded-3xl overflow-hidden shadow-2xl"
          >
            <motion.div style={{ y }} className="absolute inset-0 h-[120%] w-full">
              <Image
                src="/images/about-hero-image.webp" // Ensure this path exists or swap to a placeholder
                alt="Cyclists at sunrise"
                fill
                className="object-cover object-bottom"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </motion.div>
            
            {/* Overlay Text */}
            <div className="absolute bottom-0 left-0 p-8 sm:p-12 text-white ">
              <p className="text-sm font-semibold tracking-widest uppercase opacity-80 mb-2">The Philosophy</p>
              <p className="text-2xl sm:text-3xl font-medium max-w-xs leading-tight">
                &quot;Don&apos;t ride raw. It&apos;s like a helmet for your skin.&quot;
              </p>
            </div>
          </motion.div>
        </div>

        {/* --- SECTION 3: THE FOUR PILLARS --- */}
        <section className="px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32 max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Why we exist</h2>
          </div>
          
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { icon: Zap, title: "No Tingle", desc: "Gentle, non-tingle formulas engineered for daily comfort without the shock." },
              { icon: ShieldCheck, title: "All-Day Defense", desc: "Proven protection that stays put on century rides and grit-filled gravel days." },
              { icon: HeartHandshake, title: "Rider Tested", desc: "Refined on real roads and trails by a community of obsessives." },
              { icon: Leaf, title: "Pure Ingredients", desc: "No parabens, no harsh alcohols. Just clean, effective science." },
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                variants={fadeInUp}
                className="group p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 transition-colors hover:border-[#2c92ac]/30 hover:bg-[#2c92ac]/5 dark:hover:bg-[#2c92ac]/10"
              >
                <div className="h-10 w-10 rounded-lg bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center text-[#2c92ac] mb-5 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-neutral-900 dark:text-white">{feature.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* --- SECTION 4: SPLIT STORY --- */}
        <section className="bg-neutral-900 text-white overflow-hidden py-24 sm:py-32 relative">
          {/* Decorative background blur */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-[#2c92ac]/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
                  Built by cyclists, <br />
                  <span className="text-neutral-400">for cyclists.</span>
                </h2>
                <div className="space-y-6 text-lg text-neutral-300 leading-relaxed">
                  <p>
                    Zevlin started with a simple idea: care products should enhance your ride, not distract from it. We obsess over texture, longevity, and feel so you can focus on the road ahead.
                  </p>
                  <p>
                    Every jar is the result of countless test rides and real-world feedback. That’s why our products just work — no gimmicks, no burn, no learning curve.
                  </p>
                </div>
                <div className="mt-8 pt-8 border-t border-neutral-800 flex items-center gap-8">
                  <div>
                    <div className="text-3xl font-bold text-[#2c92ac]">10k+</div>
                    <div className="text-sm text-neutral-500">Rides Protected</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-[#2c92ac]">100%</div>
                    <div className="text-sm text-neutral-500">Rider Owned</div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.6 }}
                 className="relative aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-800"
              >
                 <Image src="/images/owner-0.webp" alt="Zevlin Team" fill className="object-cover opacity-90 hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- SECTION 5: CALL TO ACTION --- */}
        <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
          >
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-6 text-neutral-900 dark:text-white">
              Ready to ride smoothly?
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-10 max-w-2xl mx-auto">
              Join thousands of riders who have upgraded their daily routine. 
              Find your new go-to today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="rounded-full h-12 px-8 text-base bg-[#2c92ac] hover:bg-[#277f96] text-white shadow-lg shadow-[#2c92ac]/20" asChild>
                <Link href="/products">
                  Shop the Lineup <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-base border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800" asChild>
                <Link href="/contact">
                  Get in Touch
                </Link>
              </Button>
            </div>
          </motion.div>
        </section>

      </div>
    </PageShell>
  );
}
