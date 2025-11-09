import fs from "node:fs/promises";
import path from "node:path";

export async function loadKeywordList(): Promise<string[]> {
  try {
    const file = path.join(process.cwd(), "SEO", "keywords.txt");
    const raw = await fs.readFile(file, "utf8");
    return raw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function suggestKeywordsForText(body: string, keywords: string[], limit = 8): { keyword: string; count: number }[] {
  const text = body.toLowerCase();
  const scores = keywords.map((k) => {
    const phrase = k.toLowerCase();
    // count simple occurrences
    const re = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "g");
    const matches = text.match(re)?.length || 0;
    return { keyword: k, count: matches };
  });
  // prefer keywords not already present (count=0), but keep a few with low counts
  const sorted = scores.sort((a, b) => a.count - b.count || a.keyword.localeCompare(b.keyword));
  return sorted.slice(0, limit);
}

export function injectKeywordsParagraph(body: string, selected: string[]): string {
  const clean = selected.filter(Boolean);
  if (clean.length === 0) return body;
  // Avoid duplicate insertion if any of our headings are already present
  const headingGuard = /(^|\n)##\s+(Ride Longer, Hurt Less|Comfort & Care Essentials|Make Every Mile Feel Better|From Saddle To Skin: What Matters)/i;
  if (headingGuard.test(body)) return body;

  // Use up to 5 keywords and craft a short, energetic paragraph
  const picks = clean.slice(0, 5);
  const title = pickHeadingVariant(body + picks.join("|"));
  const narrative = craftNarrativeParagraph(picks);

  const section = `\n\n## ${title}\n${narrative}\n`;
  return body.trimEnd() + section;
}

export function injectRelatedLinks(body: string, posts: { title: string; slug: string }[], limit = 3): string {
  const items = posts.slice(0, limit);
  if (items.length === 0) return body;
  const alreadyHas = /(^|\n)##\s+Related Reading/i.test(body);
  const list = items.map((p) => `- [${p.title}](/blog/${p.slug})`).join("\n");
  const section = `\n\n## Related Reading\n${list}\n`;
  return alreadyHas ? body : body.trimEnd() + section;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pickHeadingVariant(seed: string): string {
  const variants = [
    "Ride Longer, Hurt Less",
    "Comfort & Care Essentials",
    "Make Every Mile Feel Better",
    "From Saddle To Skin: What Matters",
  ];
  const i = simpleHash(seed) % variants.length;
  return variants[i];
}

function craftNarrativeParagraph(terms: string[]): string {
  // Build a natural, non-listy paragraph that weaves in terms
  const t = terms;
  const leadIns = [
    "In this guide, we roll past buzzwords and get practical—",
    "No fluff, just ride-tested advice—",
    "What actually helps on the bike—",
  ];
  const closers = [
    "so you can focus on pedaling, not problems.",
    "so hard miles feel easier and more fun.",
    "to keep you comfortable from warm-up to cooldown.",
  ];
  const lead = leadIns[simpleHash(terms.join("|")) % leadIns.length];
  const close = closers[(simpleHash(terms.join("/")) >> 1) % closers.length];

  // Phrase construction depending on count
  if (t.length === 1) {
    return `${lead}we dig into ${t[0]}—what it is, when to use it, and how to get the most from it, ${close}`;
  }
  if (t.length === 2) {
    return `${lead}we dig into ${t[0]} and ${t[1]}—when they matter, how they work together, and what to try next, ${close}`;
  }
  if (t.length === 3) {
    return `${lead}we dig into ${t[0]}, put ${t[1]} in context, and show where ${t[2]} makes the biggest difference, ${close}`;
  }
  if (t.length === 4) {
    return `${lead}we unpack ${t[0]} and ${t[1]}, compare ${t[2]} with ${t[3]}, and share simple tweaks you can use today, ${close}`;
  }
  // 5 or more
  return `${lead}we unpack ${t[0]} and ${t[1]}, put ${t[2]} side‑by‑side with ${t[3]}, and explain how ${t[4]} fits into long days in the saddle, ${close}`;
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
