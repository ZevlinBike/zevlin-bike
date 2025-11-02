"use server";

import { getTrendingTopicsFromRss } from "@/lib/blog/trends";
import { draftOutlineAndIntro, expandOutlineToBody } from "@/lib/ai/summarize";
import { searchUnsplash, type UnsplashPhoto } from "@/lib/media/unsplash";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getTrendingTopicsAction() {
  const topics = await getTrendingTopicsFromRss(8);
  return topics.map((t) => t.topic);
}

export async function draftAction(topic: string) {
  const draft = await draftOutlineAndIntro({ topic });
  return draft;
}

export async function unsplashAction(topic: string): Promise<{ photos: UnsplashPhoto[]; missingKey: boolean }> {
  const missingKey = !process.env.UNSPLASH_ACCESS_KEY;
  const photos = missingKey ? [] : await searchUnsplash(`${topic} cycling`);
  return { photos, missingKey };
}

export async function listProductsAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug")
    .order("name");
  if (error) return [];
  return data || [];
}

export async function publishAssistPostAction(input: {
  title: string;
  outline: string;
  intro: string;
  body?: string;
  imageUrl?: string | null;
  imageCredit?: { name: string; link: string } | null;
  product?: { id: string; name: string; slug: string } | null;
  publish?: boolean;
}) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Build excerpt from first sentence of intro
  const firstSentence = (input.intro || "").split(/(?<=[.!?])\s+/)[0] || "";
  const excerpt = firstSentence.slice(0, 260);

  // Compose body markdown
  const lines: string[] = [];
  lines.push(`# ${input.title}`);
  lines.push("");
  if (input.outline?.trim()) {
    lines.push("## In This Post");
    lines.push(input.outline.trim());
    lines.push("");
  }
  if (input.intro?.trim()) {
    lines.push(input.intro.trim());
    lines.push("");
  }
  if (input.body?.trim()) {
    lines.push(input.body.trim());
    lines.push("");
  }
  if (input.product) {
    lines.push("---");
    lines.push(`> Upgrade your ride with [${input.product.name}](/products?focus=${input.product.slug}).`);
    lines.push("");
  }
  if (input.imageCredit) {
    lines.push("");
    lines.push(`_Header photo by [${input.imageCredit.name}](${input.imageCredit.link}) on Unsplash_`);
  }

  const { error } = await supabase.from("blog_posts").insert({
    title: input.title,
    slug: input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
    excerpt,
    body: lines.join("\n"),
    image_url: input.imageUrl || null,
    author_name: "Zevlin Team",
    published: !!input.publish,
    published_at: input.publish ? now : null,
    created_at: now,
  });
  if (error) throw error;
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return { ok: true };
}

export async function expandAction({ topic, outline, intro }: { topic: string; outline: string; intro: string }) {
  const body = await expandOutlineToBody({ topic, outline, intro, targetWords: 800 });
  return { body };
}
