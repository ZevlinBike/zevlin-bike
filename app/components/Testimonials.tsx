"use client";

import { CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { testimonials } from "@/store/reviews"; // Assuming this is defined correctly
import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion"; // Import motion for animations

export default function Testimonials() {
  const [shuffledTestimonials, setShuffledTestimonials] = useState<
    typeof testimonials
  >([]);

  useEffect(() => {
    // Ensure we always get 3 testimonials, or handle fewer gracefully
    const shuffled = [...testimonials].sort(() => 0.5 - Math.random());
    setShuffledTestimonials(shuffled.slice(0, 3));
  }, []);

  // Framer Motion variants for section and cards
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
        duration: 0.6,
        ease: "easeOut",
      },
    },
  } satisfies Variants;

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  } satisfies Variants;

  return (
    // Enhanced section background with gradient for separation
    <section className="overflow-hidden relative py-20 bg-gray-100 dark:bg-neutral-900">
      {/* Optional: Subtle background pattern/texture overlay */}
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: "url('/patterns/dots.svg')",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container relative z-10 px-4 mx-auto lg:px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
            What Our Riders Say
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            Hear directly from the cycling community about their Zevlin
            experience.
          </p>
        </div>

        {/* Testimonial Grid with Framer Motion */}
        <motion.div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }} // Animate when 30% of element is visible
        >
          {shuffledTestimonials.map((testimonial, index) => (
            <motion.div
              key={index} // Use index as key if testimonials array isn't guaranteed unique IDs
              variants={cardVariants}
              // Enhanced Card Styling
              className="overflow-hidden relative bg-white rounded-xl border border-gray-200 shadow-lg transition-all duration-300 dark:bg-gray-800 dark:border-gray-700 hover:shadow-xl group hover:scale-[1.01]"
            >
              {/* Subtle background glow/overlay for premium feel */}
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none group-hover:opacity-100 bg-blue-500/5 blur-xl" />

              <CardContent className="flex flex-col p-6 h-full">
                {/* Star Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="mr-0.5 w-5 h-5 text-yellow-500 fill-current" // Stronger yellow, slight margin
                      aria-hidden="true" // Decorative stars
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="flex-grow mb-6 text-lg italic leading-relaxed text-gray-800 dark:text-gray-200">
                  {" "}
                  {/* Larger, italicized quote */}
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Reviewer Info */}
                <div className="flex items-center pt-4 mt-auto border-t border-gray-100 dark:border-gray-700">
                  {" "}
                  {/* Separator line */}
                  <div
                    className={`flex justify-center items-center mr-3 w-12 h-12 rounded-full flex-shrink-0 ${testimonial.bgColor} shadow-md`} // Slightly larger avatar
                  >
                    <span className="text-base font-bold text-white">
                      {testimonial.initials}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.title}
                    </p>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
