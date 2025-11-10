import MainLayout from "@/app/components/layouts/MainLayout";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Product, ProductImage, ProductVariant } from "@/lib/schema";
import Link from "next/link";
import TrackView from "./track-view";
import EpicHero from "./EpicHero";
import ParallaxGrid from "./ParallaxGrid";
import ReviewsSection from "./ReviewsSection";

export const dynamic = "force-dynamic";

async function getProductBySlug(slug: string): Promise<(Product & { category?: { id: string; name: string; slug: string } | null }) | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), product_variants(*), category:product_categories(id,name,slug)")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;

  type SupabaseProduct = Omit<Product, 'product_images' | 'product_variants'> & {
    product_images: ProductImage | ProductImage[] | null;
    product_variants: ProductVariant | ProductVariant[] | null;
    category?: { id: string; name: string; slug: string } | null;
  };
  const p = data as SupabaseProduct;
  return {
    ...p,
    product_images: Array.isArray(p.product_images) ? p.product_images : p.product_images ? [p.product_images] : [],
    product_variants: Array.isArray(p.product_variants) ? p.product_variants : p.product_variants ? [p.product_variants] : [],
  } as Product & { category?: { id: string; name: string; slug: string } | null };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const title = `${product.name} | Zevlin`;
  const description = product.description || `${product.name} by Zevlin.`;
  const image = product.product_images?.find((i) => i.is_featured)?.url || product.product_images?.[0]?.url || undefined;
  return {
    title,
    description,
    openGraph: { title, description, images: image ? [{ url: image }] : [] },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : [] },
  };
}

function SpecRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-neutral-800">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{String(value)}</span>
    </div>
  );
}

function formatDimensions(p: Product) {
  if (p.length_cm && p.width_cm && p.height_cm) return `${p.length_cm} × ${p.width_cm} × ${p.height_cm} cm`;
  return undefined;
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return notFound();

  const images: ProductImage[] = product.product_images || [];
  const variants: ProductVariant[] = product.product_variants || [];

  return (
    <MainLayout>
      <div className="relative pt-28 pb-24 min-h-screen overflow-x-hidden bg-gradient-to-b from-white via-gray-50 to-gray-100 text-black dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 dark:text-white">
        <ParallaxGrid />
        <div className="container mx-auto px-4 lg:px-6 relative z-10">
          <TrackView slug={product.slug} />
          {/* Breadcrumbs */}
          <nav className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/products" className="hover:underline">Products</Link>
            {product.category?.slug ? (
              <>
                <span className="mx-2">/</span>
                <Link href={`/products?category=${product.category.slug}`} className="hover:underline">{product.category.name}</Link>
              </>
            ) : null}
            <span className="mx-2">/</span>
            <span className="text-gray-900 dark:text-gray-200">{product.name}</span>
          </nav>

          {/* EPIC HERO Section */}
          <EpicHero
            product={product}
            images={images}
            variants={variants}
          />

          {/* Details Section */}
          <section id="details" className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Why You&apos;ll Love It</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base md:text-lg">
                  Designed for riders who demand comfort and reliability. Whether you’re grinding gravel or pushing watts on the trainer, {product.name} delivers consistent performance so you can focus on the ride—not discomfort.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">Highlights</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm md:text-base text-gray-700 dark:text-gray-300">
                  <li>• Premium materials and build</li>
                  <li>• Optimized for long-distance comfort</li>
                  <li>• Easy to use and maintain</li>
                  <li>• Rider-tested in real conditions</li>
                </ul>
              </div>
            </div>
            <aside className="lg:col-span-1">
              <div className="sticky top-28">
                <h3 className="text-xl font-bold mb-3">Specifications</h3>
                <div className="divide-y divide-gray-200/60 dark:divide-neutral-800">
                  <SpecRow label="Weight" value={product.weight ? `${product.weight} ${product.weight_unit || ''}`.trim() : undefined} />
                  <SpecRow label="Dimensions" value={formatDimensions(product)} />
                  {product.category?.name && <SpecRow label="Category" value={product.category.name} />}
                  <SpecRow label="SKU" value={(variants[0]?.sku) || undefined} />
                </div>
              </div>
            </aside>
          </section>

          {/* Reviews */}
          <ReviewsSection productSlug={product.slug} />
        </div>
      </div>
    </MainLayout>
  );
}
