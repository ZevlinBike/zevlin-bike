import MainLayout from "@/components/layouts/MainLayout";
import CTA from "./components/CTA";
import FeaturedProducts from "./components/FeaturedProducts";
import Features from "./components/Features";
import Hero from "./components/hero";
import Newsletter from "./components/Newsletter";
import Testimonials from "./components/Testimonials";

export default function ZevlinCrackLanding() {
  return (
    <MainLayout>
      <Hero />
      <FeaturedProducts />
      <Features />
      <Testimonials />
      <CTA />
      <Newsletter />
    </MainLayout>
  );
}
