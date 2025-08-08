"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Product } from '@/lib/schema';

export default function useFeaturedProducts() {
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
        // This is a placeholder for how you might identify featured products.
        // You might have a dedicated 'is_featured' column on the products table,
        // or filter by a category, etc. For now, we'll just take the first 3.
        .limit(3);

      if (error) {
        console.error('Error fetching featured products:', error);
        setError(error);
      } else {
        // Note: This is a temporary mapping to fit the old ProductCard structure.
        const mappedData = data.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: p.price_cents / 100,
          // @ts-ignore
          image: p.product_images.find(img => img.is_featured)?.url || '/images/placeholder.png',
          featured: true,
          qtyInStock: 100,
          categories: ['Cycling'],
          rating: 5,
        }));
        setProducts(mappedData as any);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
}
