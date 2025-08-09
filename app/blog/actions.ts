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
