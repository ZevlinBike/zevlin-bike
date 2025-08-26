import MainLayout from "@/app/components/layouts/MainLayout";
import CTA from "./components/CTA";
import FeaturedProducts from "./components/FeaturedProducts";
import Features from "./components/Features";
import Hero from "./components/hero";
import Newsletter from "./components/Newsletter";
import Testimonials from "./components/Testimonials";
import { getFeaturedProducts } from "./admin/products/actions";

export default async function ZevlinCrackLanding() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <MainLayout>
      <Hero />
      <FeaturedProducts products={featuredProducts} />
      <Features />
      <Testimonials />
      <CTA />
      <Newsletter />
    </MainLayout>
  );
}
