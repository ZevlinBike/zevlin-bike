"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { testimonials } from "@/store/reviews";
import { useEffect, useState } from "react";

export default function Testimonials() {
  const [shuffledTestimonials, setShuffledTestimonials] = useState<
    typeof testimonials
  >([]);

  useEffect(() => {
    const shuffled = [...testimonials].sort(() => 0.5 - Math.random());
    setShuffledTestimonials(shuffled.slice(0, 3));
  }, []);

  return (
    <section className="py-20 bg-gray-800/30">
      <div className="container px-4 mx-auto lg:px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            What Our Riders Say
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
          {shuffledTestimonials.map((testimonial, index) => (
            <Card key={index} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      stroke="currentColor"
                    />
                  ))}
                </div>

                <p className="mb-4 text-gray-300">{testimonial.quote}</p>

                <div className="flex items-center">
                  <div
                    className={`flex justify-center items-center mr-3 w-10 h-10 ${testimonial.bgColor} rounded-full`}
                  >
                    <span className="text-sm font-bold text-white">
                      {testimonial.initials}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-400">{testimonial.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
