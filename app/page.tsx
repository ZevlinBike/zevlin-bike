import Navigation from "@/components/Navigation";
import CTA from "./components/CTA";
import FeaturedProducts from "./components/FeaturedProducts";
import Features from "./components/Features";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Newsletter from "./components/Newsletter";
import Testimonials from "./components/Testimonials";

export default function ZevlinCrackLanding() {
  return (
    <div className="min-h-screen text-white bg-gray-900">
      <Navigation />
      <Hero />
      <FeaturedProducts />
      <Features />
      <Testimonials />
      <CTA />
      <Newsletter />
      <Footer />
    </div>
  );
}
