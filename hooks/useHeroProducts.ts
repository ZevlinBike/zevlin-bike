"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Product } from '@/lib/schema';

export default function useHeroProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images ( url, alt_text, is_featured )
        `)
        .limit(3);

      if (error) {
        console.error("Error fetching hero products:", error);
        setError(error);
      } else {
        // This is the corrected logic
        const productsWithCorrectedImages = data.map((product) => {
          const images = Array.isArray(product.product_images)
            ? product.product_images
            : product.product_images ? [product.product_images] : [];
          
          const featuredImage =
            images.find((img: any) => img.is_featured)?.url ||
            images[0]?.url ||
            "/images/placeholder.png";

          return {
            ...product,
            product_images: images, // Ensure product_images is always an array
            featured_image: featuredImage, // Keep for components that use it
          };
        });
        setProducts(productsWithCorrectedImages as any);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
}
