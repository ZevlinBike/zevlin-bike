"use server";

import { createClient } from "@/lib/supabase/server";
import { BlogPost } from "@/lib/schema";

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching published posts:", error);
    return [];
  }

  return data;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error) {
    console.error(`Error fetching post by slug "${slug}":`, error);
    return null;
  }

  return data;
}

type ViewRow = { views: number; uniques: number };

export async function getPostViewTotals(slug: string): Promise<{ views: number; uniques: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analytics_view_counts")
    .select("views, uniques")
    .eq("type", "post")
    .eq("slug", slug);

  if (error) {
    console.error("Error fetching view totals:", error);
    return { views: 0, uniques: 0 };
  }

  const totals = (data || []).reduce(
    (acc, r: ViewRow) => {
      acc.views += r.views || 0;
      acc.uniques += r.uniques || 0;
      return acc;
    },
    { views: 0, uniques: 0 }
  );
  return totals;
}

export async function getPostViewsForSlugs(slugs: string[]): Promise<Record<string, number>> {
  if (!slugs.length) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analytics_view_counts")
    .select("slug, views")
    .eq("type", "post")
    .in("slug", slugs);

  if (error) {
    console.error("Error fetching views for slugs:", error);
    return {};
  }

  const map: Record<string, number> = {};
  (data || []).forEach((r: { slug: string; views: number }) => {
    map[r.slug] = (map[r.slug] || 0) + (r.views || 0);
  });
  return map;
}
