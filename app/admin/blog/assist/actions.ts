"use server";

import { getTrendingTopicsFromRss } from "@/lib/blog/trends";
import { draftOutlineAndIntro, expandOutlineToBody } from "@/lib/ai/summarize";
import { searchUnsplash, type UnsplashPhoto } from "@/lib/media/unsplash";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { BlogPost } from "@/lib/schema";
import { loadKeywordList, injectKeywordsParagraph, injectRelatedLinks } from "@/lib/blog/seo";
import { validateAssist, type AssistValidationResult, fixAssist } from "@/lib/blog/assistValidation";

export async function getTrendingTopicsAction(input?: { limit?: number; seed?: number; exclude?: string[] }) {
  const limit = Math.max(1, Math.min(24, input?.limit ?? 8));
  // Fetch a larger pool, then shuffle for variety
  const pool = await getTrendingTopicsFromRss({ poolLimit: Math.max(64, limit * 8), perFeed: 25 });
  const excludeSet = new Set((input?.exclude || []).map((s) => simplify(s)));
  // Fisher-Yates shuffle (optionally seeded for deterministic refresh)
  const rnd = (() => {
    if (typeof input?.seed !== 'number') return Math.random;
    let s = input.seed >>> 0;
    return () => {
      // xorshift32
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1_000_000) / 1_000_000;
    };
  })();

  // Brand-focused curation and scoring to bias topics toward Zevlin and chamois creams
  const curated: string[] = [
    "What is chamois cream and when to use it",
    "How to prevent chafing on long rides",
    "Saddle comfort checklist: fit, shorts, and skin care",
    "How to wash and care for your chamois",
    "Pre-ride routine: applying chamois cream the right way",
    "Post-ride skin care for cyclists",
    "Gravel vs. road: comfort tips for mixed terrain",
    "Indoor training comfort: sweat, heat, and chafing",
    "Bikepacking hygiene: staying comfortable day after day",
    "Choosing the right bib shorts for long-distance comfort",
  ];
  const brandKeywords = [
    'chamois', 'cream', 'anti chafe', 'anti-chafe', 'chafing', 'saddle', 'comfort', 'skin', 'skincare', 'skin care', 'bib', 'shorts', 'hygiene', 'laundry', 'wash', 'rash', 'sores', 'irritation', 'lubricant', 'lube'
  ];

  const fetched = pool
    .map((t) => t.topic)
    .filter((t) => t && !excludeSet.has(simplify(t)));

  const score = (t: string) => {
    const s = t.toLowerCase();
    let sc = 0;
    for (const k of brandKeywords) if (s.includes(k)) sc += 2;
    if (s.includes('gravel') || s.includes('indoor') || s.includes('training')) sc += 1; // adjacent
    if (s.includes('zevlin')) sc += 3;
    return sc;
  };

  const ranked = fetched
    .map((t) => ({ t, sc: score(t) + rnd() * 0.25 }))
    .sort((a, b) => b.sc - a.sc)
    .map((x) => x.t);

  const out: string[] = [];
  const seen = new Set<string>();
  const push = (t: string) => {
    const key = simplify(t);
    if (!key || seen.has(key) || excludeSet.has(key)) return;
    seen.add(key);
    out.push(t);
  };

  // Seed with curated (up to half)
  for (const t of curated) {
    if (out.length >= Math.ceil(limit / 2)) break;
    push(t);
  }
  // Fill from ranked fetched
  for (const t of ranked) {
    if (out.length >= limit) break;
    push(t);
  }
  // If still short, add random curated
  const cur = curated.slice();
  for (let i = cur.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cur[i], cur[j]] = [cur[j], cur[i]]; }
  for (const t of cur) { if (out.length >= limit) break; push(t); }

  return out.slice(0, limit);
}

function simplify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+[-–—|:].*$/, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

  // Compose body markdown (avoid duplicating header if body already has one)
  let finalBody = "";
  const providedBody = input.body?.trim() || "";
  const startsWithHeader = /^\s*#\s/.test(providedBody);
  if (providedBody && startsWithHeader) {
    finalBody = providedBody;
  } else {
    const parts: string[] = [];
    parts.push(`# ${input.title}`);
    parts.push("");
    if (input.outline?.trim()) {
      parts.push("## In This Post");
      parts.push(input.outline.trim());
      parts.push("");
    }
    if (input.intro?.trim()) {
      parts.push(input.intro.trim());
      parts.push("");
    }
    if (providedBody) {
      parts.push(providedBody);
      parts.push("");
    }
    finalBody = parts.join("\n");
  }
  // Optional product + image credit footers
  if (input.product) {
    finalBody += `\n---\n> Upgrade your ride with [${input.product.name}](/products/${input.product.slug}).\n\n`;
  }
  if (input.imageCredit) {
    finalBody += `\n_Header photo by [${input.imageCredit.name}](${input.imageCredit.link}) on Unsplash_`;
  }

  // Validate and sanitize when publishing
  if (input.publish) {
    const recent = await getRecentBlogSlugs();
    const validation = validateAssist({
      title: input.title,
      outline: input.outline,
      intro: input.intro,
      // validate body content without duplicating the H1 (we already add it above)
      body: finalBody.replace(/^\s*#\s+[^\n]+\n+/, ""),
      companyName: "Zevlin",
      keywords: [],
      internalDomains: ["zevlinbike.com", "www.zevlinbike.com"],
      internalPaths: ["/blog/"],
      recentBlogSlugs: recent,
    });
    if (validation.errors.length > 0) {
      throw new Error(`Content validation failed:\n- ${validation.errors.join("\n- ")}`);
    }
    finalBody = validation.sanitizedMarkdown;
  }

  const { error } = await supabase.from("blog_posts").insert({
    title: input.title,
    slug: input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
    excerpt,
    body: finalBody,
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

// Fetch single post for prefill
export async function getPostByIdAction(id: string): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as BlogPost;
}

// Update an existing post using Assist-composed content
export async function updateAssistPostAction(input: {
  id: string;
  title: string;
  outline: string;
  intro: string;
  body?: string;
  imageUrl?: string | null;
  publish?: boolean;
}) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Fetch existing to preserve slug and author
  const { data: existing, error: fetchErr } = await supabase
    .from("blog_posts")
    .select("slug, author_name, published")
    .eq("id", input.id)
    .single();
  if (fetchErr || !existing) throw fetchErr || new Error("Post not found");

  // Build excerpt from first sentence of intro
  const firstSentence = (input.intro || "").split(/(?<=[.!?])\s+/)[0] || "";
  const excerpt = firstSentence.slice(0, 260);

  // Compose body markdown (avoid duplicating header if body already has one)
  let finalBody = "";
  const providedBody = input.body?.trim() || "";
  const startsWithHeader = /^\s*#\s/.test(providedBody);
  if (providedBody && startsWithHeader) {
    finalBody = providedBody;
  } else {
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
    if (providedBody) {
      lines.push(providedBody);
      lines.push("");
    }
    finalBody = lines.join("\n");
  }

  // Validate and sanitize when publishing
  if (input.publish) {
    const recent = await getRecentBlogSlugs();
    const validation = validateAssist({
      title: input.title,
      outline: input.outline,
      intro: input.intro,
      body: finalBody.replace(/^\s*#\s+[^\n]+\n+/, ""),
      companyName: "Zevlin",
      keywords: [],
      internalDomains: ["zevlinbike.com", "www.zevlinbike.com"],
      internalPaths: ["/blog/"],
      recentBlogSlugs: recent,
    });
    if (validation.errors.length > 0) {
      throw new Error(`Content validation failed:\n- ${validation.errors.join("\n- ")}`);
    }
    finalBody = validation.sanitizedMarkdown;
  }

  const { error } = await supabase
    .from("blog_posts")
    .update({
      title: input.title,
      // preserve slug
      excerpt,
      body: finalBody,
      image_url: input.imageUrl ?? null,
      author_name: existing.author_name || "Zevlin Team",
      published: !!input.publish,
      published_at: input.publish ? now : existing.published ? now : null,
      updated_at: now,
    })
    .eq("id", input.id);
  if (error) throw error;

  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/edit/${input.id}`);
  revalidatePath(`/blog/${existing.slug}`);
  return { ok: true };
}

// SEO helpers
export async function getKeywordListAction(): Promise<string[]> {
  return await loadKeywordList();
}

export async function optimizeBodyAction(input: {
  body: string;
  selectedKeywords?: string[];
  includeRelatedLinks?: boolean;
  excludeSlug?: string | null;
}): Promise<{ body: string }>{
  let out = input.body || "";
  const selected = (input.selectedKeywords || []).filter(Boolean);
  if (selected.length > 0) {
    out = injectKeywordsParagraph(out, selected);
  }
  if (input.includeRelatedLinks) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("blog_posts")
      .select("title, slug, published")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(5);
    const posts = (data || [])
      .filter((p) => (input.excludeSlug ? p.slug !== input.excludeSlug : true))
      .map((p) => ({ title: p.title as string, slug: p.slug as string }));
    out = injectRelatedLinks(out, posts, 3);
  }
  return { body: out };
}

// Server-side validation for Assist UI (DB-aware)
export async function validateAssistContentAction(input: {
  title: string;
  outline: string;
  intro: string;
  body: string;
  selectedKeywords?: string[];
}): Promise<AssistValidationResult> {
  const recent = await getRecentBlogSlugs();
  return validateAssist({
    title: input.title,
    outline: input.outline,
    intro: input.intro,
    body: input.body,
    companyName: "Zevlin",
    keywords: input.selectedKeywords || [],
    internalDomains: ["zevlinbike.com", "www.zevlinbike.com"],
    internalPaths: ["/blog/"],
    recentBlogSlugs: recent,
  });
}

// Server-side auto-fix for Assist UI
export async function fixAssistContentAction(input: {
  title: string;
  outline: string;
  intro: string;
  body: string;
  selectedKeywords?: string[];
}): Promise<{ body: string; applied: string[]; validation: AssistValidationResult }>{
  const supabase = await createClient();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const { data } = await supabase
    .from("blog_posts")
    .select("title, slug, published_at")
    .eq("published", true)
    .gte("published_at", oneYearAgo.toISOString())
    .order("published_at", { ascending: false })
    .limit(12);
  const posts = (data || []).map((p) => ({ title: p.title as string, slug: p.slug as string }));
  const recentSlugs = new Set(posts.map((p) => p.slug));
  const res = fixAssist({
    title: input.title,
    outline: input.outline,
    intro: input.intro,
    body: input.body,
    companyName: "Zevlin",
    keywords: input.selectedKeywords || [],
    internalDomains: ["zevlinbike.com", "www.zevlinbike.com"],
    internalPaths: ["/blog/"],
    recentBlogSlugs: recentSlugs,
    recentPosts: posts,
    minInternalLinks: 4,
    minExternalLinks: 2,
  });
  return { body: res.fixedMarkdown, applied: res.appliedFixes, validation: res.postValidation };
}

async function getRecentBlogSlugs(): Promise<Set<string>> {
  const supabase = await createClient();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const { data } = await supabase
    .from("blog_posts")
    .select("slug, published_at")
    .eq("published", true)
    .gte("published_at", oneYearAgo.toISOString())
    .limit(1000);
  return new Set((data || []).map((p: { slug: string }) => p.slug));
}
