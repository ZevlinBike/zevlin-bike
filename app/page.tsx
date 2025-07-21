import CTA from "./components/CTA";
import FeaturedProducts from "./components/FeaturedProducts";
import Features from "./components/Features";
import Hero from "./components/hero";
import Newsletter from "./components/Newsletter";
import Testimonials from "./components/Testimonials";

export default function ZevlinCrackLanding() {
  return (
    <div className="min-h-screen text-black bg-gray-100">
      <Hero />
      <FeaturedProducts />
      <Features />
      <Testimonials />
      <CTA />
      <Newsletter />
    </div>
  );
}
