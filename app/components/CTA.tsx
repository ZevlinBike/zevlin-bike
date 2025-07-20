import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function CTA() {
  return (
    <section className="relative py-20 bg-black/80">
      <Image
        className="opacity-10 grayscale"
        src="/images/hero-image.jpeg"
        alt="Zevlin Bike Hero"
        fill
        style={{ objectFit: "cover", zIndex: 0 }}
        priority
      />
      <div className="container px-4 mx-auto text-center lg:px-6">
        <h2 className="mb-4 text-3xl font-bold md:text-4xl">
          Ready for Your Smoothest Ride Yet?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-300">
          Join thousands of riders who trust Zevlin for a chafe-free experience,
          ride after ride.
        </p>
        <div className="flex flex-col gap-4 justify-center items-center mb-8 sm:flex-row">
          <div className="flex items-center text-gray-300">
            <CheckCircle className="mr-2 w-5 h-5 text-yellow-400" />
            Long-lasting comfort
          </div>
          <div className="flex items-center text-gray-300">
            <CheckCircle className="mr-2 w-5 h-5 text-yellow-400" />
            Made with natural ingredients
          </div>
        </div>
        <Button
          size="lg"
          className="py-3 px-8 text-lg font-semibold text-gray-900 bg-yellow-400 hover:bg-yellow-500"
        >
          Gear Up Now
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </section>
  );
}
