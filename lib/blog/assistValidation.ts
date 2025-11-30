// Validation helpers for BlogAssist content
// Focused on style, structure, SEO, and link hygiene checks described in requirements.

export type AssistValidationInput = {
  title: string;
  outline?: string;
  intro?: string;
  body?: string;
  companyName?: string; // default: Zevlin
  keywords?: string[]; // selected or derived keywords for this post
  internalDomains?: string[]; // e.g. ["zevlinbike.com", "www.zevlinbike.com"]
  internalPaths?: string[]; // additional internal path prefixes (e.g. ["/blog/"])
  recentBlogSlugs?: Set<string>; // published within past year
};

export type AssistValidationResult = {
  errors: string[];
  warnings: string[];
  metrics: {
    wordCount: number;
    paragraphCount: number;
    sentences: number;
    fkGrade: number; // Flesch-Kincaid grade level
    longSentenceRatio: number; // > 29 words
    passiveRatio: number; // heuristic
    boldCount: number;
    bulletListCount: number;
    headingsWithKeyword: number;
    externalDomains: string[];
    internalRecentLinks: number;
  };
  sanitizedMarkdown: string; // links with tracking params removed
  autoFixes: string[]; // notes of what we auto-sanitized
};

export function validateAssist(input: AssistValidationInput): AssistValidationResult {
  const company = (input.companyName || "Zevlin").trim();
  const keywords = dedupe((input.keywords || []).map((k) => k.trim()).filter(Boolean)).slice(0, 24);
  const internalDomains = (input.internalDomains || ["zevlinbike.com", "www.zevlinbike.com"]).map((d) => d.toLowerCase());
  const internalPaths = (input.internalPaths || ["/blog/"]);

  // Build composed markdown similar to server publish composition
  const title = (input.title || "").trim();
  const parts: string[] = [];
  if (title) parts.push(`# ${title}`, "");
  if (input.outline?.trim()) parts.push("## In This Post", input.outline.trim(), "");
  if (input.intro?.trim()) parts.push(input.intro.trim(), "");
  if (input.body?.trim()) parts.push(input.body.trim(), "");
  const md = parts.join("\n").trim();

  // Sanitize links
  const { sanitized, autoFixes } = sanitizeLinks(md);

  // Extract plain text for readability
  const text = markdownToPlain(sanitized);
  const words = countWords(text);
  const sentences = splitSentences(text);
  const paragraphs = splitParagraphs(sanitized);
  const syllables = estimateSyllables(text);
  const fkGrade = sentences.length > 0 && words > 0
    ? 0.39 * (words / sentences.length) + 11.8 * (syllables / words) - 15.59
    : 0;
  const longSentenceRatio = sentences.length > 0 ? sentences.filter((s) => countWords(s) > 29).length / sentences.length : 0;
  const passiveRatio = sentences.length > 0 ? sentences.filter((s) => looksPassive(s)).length / sentences.length : 0;

  // Markdown-specific counts
  const boldCount = (sanitized.match(/\*\*[^\n*]+\*\*/g) || []).length;
  const bulletListCount = (sanitized.match(/^(\s*[-*]\s+|\s*\d+\.\s+)/gm) || []).length > 0 ? 1 : 0;
  const headings = Array.from(sanitized.matchAll(/^\s*#{2,3}\s+(.+)$/gm)).map((m) => (m[1] || "").toLowerCase());
  const headingsWithKeyword = headings.filter((h) => keywords.some((k) => h.includes(k.toLowerCase()))).length;

  // Links
  const links = extractLinks(sanitized);
  const { externalDomains, internalRecentLinks } = analyzeLinks(links, internalDomains, internalPaths, input.recentBlogSlugs || new Set());

  const errors: string[] = [];
  const warnings: string[] = [];

  // Core requirements
  if (words < 300 || words > 700) errors.push(`Word count must be 300–700 (found ${words}).`);

  // Title checks
  if (title.includes(":")) errors.push("Avoid colons in the title.");

  // Paragraphs: target 2–4 sentences each; allow a little variance
  const paragraphSentences = paragraphs.map((p) => splitSentences(markdownToPlain(p)).length).filter((n) => n > 0);
  const withinRange = paragraphSentences.filter((n) => n >= 2 && n <= 4).length;
  const ratioInRange = paragraphSentences.length > 0 ? withinRange / paragraphSentences.length : 1;
  if (ratioInRange < 0.8) errors.push("Use short paragraphs: 2–4 sentences for most paragraphs.");

  if (bulletListCount < 1) errors.push("Include at least one bulleted or numbered list.");

  if (boldCount < 2 || boldCount > 3) errors.push(`Use bold for 2–3 phrases (found ${boldCount}).`);

  if (headingsWithKeyword < 2) errors.push("Add at least two H2/H3 subheaders that mention your keywords.");

  if (externalDomains.length < 2) errors.push("Add at least two external links to different credible sources.");

  if (internalRecentLinks < 4) errors.push("Add at least four internal links to recent blog posts.");

  // Intro/company/keywords checks
  const introText = markdownToPlain((input.intro || "").trim());
  if (!introText.toLowerCase().includes(company.toLowerCase())) errors.push(`Mention your company name (“${company}”) in the first paragraph.`);

  // Keywords presence: 4+ unique present overall; at least one appears in intro
  const presentKeywords = new Set<string>();
  for (const k of keywords) {
    if (wordBoundaryIncludes(text, k)) presentKeywords.add(k);
  }
  if (presentKeywords.size < 4) errors.push(`Incorporate 4+ topic keywords (found ${presentKeywords.size}).`);
  if (!keywords.some((k) => wordBoundaryIncludes(introText, k))) errors.push("Include at least one target keyword in the intro.");

  // Why this matters section
  const hasWhy = /(^|\n)#{2,3}\s+why (this )?matters/i.test(sanitized) || /\bwhy this matters\b/i.test(text);
  if (!hasWhy) errors.push('Add a short section on “why this matters” to show expertise.');

  // Style: reading level, run-ons, passive, customer-facing voice
  if (fkGrade > 8.2) errors.push(`Aim for ~8th grade reading level (FK ${fkGrade.toFixed(1)}).`);
  if (longSentenceRatio > 0.15) errors.push("Avoid run-on sentences; shorten sentences over ~29 words.");
  if (passiveRatio > 0.25) errors.push("Prefer active voice; reduce passive constructions.");
  const youCount = (text.match(/\b(you|your)\b/gi) || []).length;
  if (youCount < 6) warnings.push("Speak to prospective customers—use “you” generously.");

  // Banned/overused AI words
  const banned = [
    /\bensure\b/gi,
    /\btailored\b/gi,
    /\b(unlock|unleash|harness)\b/gi,
    /\b(moreover|subsequently|accordingly|however)\b/gi,
    /\b(crucial|pivotal)\b/gi,
    /—/g, // em dash
  ];
  for (const re of banned) {
    if (re.test(text)) {
      warnings.push("Reword overused AI phrasing (ensure, tailored, unlock/unleash/harness, moreover/subsequently/accordingly/however, crucial/pivotal, em dash).");
      break;
    }
  }

  // Not only ... but also
  if (/not only\b[\s\S]{0,80}\bbut\b/gi.test(text)) warnings.push("Use “not only … but …” very sparingly or remove.");

  // Avoid explicit conclusion phrase
  if (/\bin conclusion\b/i.test(text)) errors.push('Do not use the phrase “In conclusion”.');

  return {
    errors,
    warnings,
    metrics: {
      wordCount: words,
      paragraphCount: paragraphSentences.length,
      sentences: sentences.length,
      fkGrade: Number.isFinite(fkGrade) ? Number(fkGrade) : 0,
      longSentenceRatio,
      passiveRatio,
      boldCount,
      bulletListCount,
      headingsWithKeyword,
      externalDomains,
      internalRecentLinks,
    },
    sanitizedMarkdown: sanitized,
    autoFixes,
  };
}

export type AssistFixInput = AssistValidationInput & {
  // For internal link injection
  recentPosts?: { title: string; slug: string }[];
  minInternalLinks?: number; // default 4
  minExternalLinks?: number; // default 2
};

export type AssistFixResult = {
  fixedMarkdown: string;
  appliedFixes: string[];
  postValidation: AssistValidationResult;
};

export function fixAssist(input: AssistFixInput): AssistFixResult {
  const company = (input.companyName || "Zevlin").trim();
  const minInternal = input.minInternalLinks ?? 4;
  const minExternal = input.minExternalLinks ?? 2;
  const keywords = dedupe((input.keywords || []).map((k) => k.trim()).filter(Boolean)).slice(0, 12);

  // Compose canonical body (similar to publish)
  const title = (input.title || '').trim();
  const blocks: string[] = [];
  if (title) blocks.push(`# ${title}`, "");
  if (input.outline?.trim()) blocks.push("## In This Post", input.outline.trim(), "");
  if (input.intro?.trim()) blocks.push(input.intro.trim(), "");
  if (input.body?.trim()) blocks.push(input.body.trim(), "");
  let md = blocks.join("\n").trim();

  const applied: string[] = [];

  // 1) Title: remove colons
  if (title.includes(':')) {
    md = md.replace(/^#\s+(.+)$/m, (_, t) => `# ${t.replace(/:/g, ' - ')}`);
    applied.push('Reworded title to avoid colons.');
  }

  // 2) Sanitize links
  const s = sanitizeLinks(md);
  md = s.sanitized;
  applied.push(...s.autoFixes);

  // 3) Ensure company in first paragraph (intro)
  const paraBlocks = splitMarkdownBlocks(md);
  const firstParaIdx = findFirstIntroParagraphIndex(paraBlocks);
  if (firstParaIdx >= 0) {
    const p = paraBlocks[firstParaIdx];
    if (!markdownToPlain(p).toLowerCase().includes(company.toLowerCase())) {
      const kw = keywords[0] || 'comfort';
      const sentence = ` ${company} helps cyclists with ${kw} every ride.`;
      paraBlocks[firstParaIdx] = appendToFirstSentence(p, sentence);
      applied.push(`Added company mention in intro with keyword “${kw}”.`);
    }
  }
  md = joinMarkdownBlocks(paraBlocks);

  // 4) Ensure at least one keyword in intro
  if (firstParaIdx >= 0) {
    const p = paraBlocks[firstParaIdx];
    if (!keywords.some((k) => wordBoundaryIncludes(markdownToPlain(p), k))) {
      const kw = keywords[0] || 'cycling comfort';
      paraBlocks[firstParaIdx] = appendKeyword(p, kw);
      applied.push(`Inserted target keyword “${kw}” into intro.`);
      md = joinMarkdownBlocks(paraBlocks);
    }
  }

  // Track word count early to avoid exceeding 700 by large margins
  let currentWords = countWords(markdownToPlain(md));

  // 5) Ensure “Why This Matters” section
  if (!/(^|\n)#{2,3}\s+why (this )?matters/i.test(md)) {
    const shortWhy = `\n\n## Why This Matters\nSmall choices in fit, fabric, and care prevent irritation so you can ride longer with fewer setbacks.`;
    const longWhy = `\n\n## Why This Matters\nCycling comfort compounds over time. Small choices in fit, fabric, and care prevent irritation and help you ride longer with fewer setbacks. This ties advice to real ride outcomes—less chafing, better focus, more fun.`;
    const add = currentWords > 680 ? shortWhy : longWhy;
    md = md.trimEnd() + add;
    applied.push('Added “Why This Matters” section to show expertise.');
    currentWords = countWords(markdownToPlain(md));
  }

  // 6) Ensure at least one bulleted list
  if (!/(^|\n)\s*([-*]\s+|\d+\.\s+)/m.test(md)) {
    const bullets = deriveQuickTips(md, currentWords > 650 ? 2 : 4);
    md = md.trimEnd() + `\n\n## Quick Tips\n${bullets.join('\n')}`;
    applied.push('Added a “Quick Tips” bulleted list.');
    currentWords = countWords(markdownToPlain(md));
  }

  // 7) Ensure 2–3 bold phrases
  const currentBold = (md.match(/\*\*[^\n*]+\*\*/g) || []).length;
  if (currentBold < 2) {
    const need = Math.min(3 - currentBold, 3);
    const phrases = choosePhrasesToBold(md, keywords, need);
    if (phrases.length > 0) {
      md = boldInNonLinkSegments(md, phrases);
      applied.push(`Bolded ${phrases.length} phrase(s) for emphasis.`);
    }
  }

  // 8) Headings with keywords (at least 2)
  const headings = Array.from(md.matchAll(/^\s*#{2,3}\s+(.+)$/gm)).map((m) => m[1].toLowerCase());
  const countHeadingsWithKw = headings.filter((h) => keywords.some((k) => h.includes(k.toLowerCase()))).length;
  if (countHeadingsWithKw < 2 && keywords.length > 0) {
    const need = 2 - countHeadingsWithKw;
    const add = keywords.slice(0, need).map((k) => `\n\n## ${capitalize(k)} Tips`);
    md = md.trimEnd() + add.join('') + '\n';
    applied.push(`Added ${need} keyword subheader(s).`);
  }

  // 9) Internal recent links >= minInternal
  const links = extractLinks(md);
  const { internalRecentLinks } = analyzeLinks(links, (input.internalDomains || ["zevlinbike.com","www.zevlinbike.com"]).map((d)=>d.toLowerCase()), input.internalPaths || ["/blog/"], input.recentBlogSlugs || new Set());
  if (internalRecentLinks < minInternal && (input.recentPosts || []).length > 0) {
    const available = (input.recentPosts || []).slice(0, Math.max(minInternal, 4));
    const list = available.map((p) => `- [${p.title}](/blog/${p.slug})`).join('\n');
    if (!/(^|\n)##\s+Related Reading/i.test(md)) {
      md = md.trimEnd() + `\n\n## Related Reading\n${list}\n`;
    } else {
      // Append missing items
      md = md.replace(/(^|\n)##\s+Related Reading[\s\S]*?$/i, (full) => {
        const have = new Set(Array.from(full.matchAll(/\]\/blog\/([^\)\n]+)\)/g)).map((m) => m[1]));
        const needItems = available.filter((p) => !have.has(p.slug)).map((p) => `- [${p.title}](/blog/${p.slug})`).join('\n');
        return needItems ? full.trimEnd() + '\n' + needItems + '\n' : full;
      });
    }
    applied.push(`Inserted internal “Related Reading” links (${Math.min(available.length, minInternal)}).`);
  }

  // 10) External credible links >= minExternal (not internal domains)
  const extDomains = analyzeLinks(extractLinks(md), (input.internalDomains || ["zevlinbike.com","www.zevlinbike.com"]).map((d)=>d.toLowerCase()), input.internalPaths || ["/blog/"], input.recentBlogSlugs || new Set()).externalDomains;
  if (extDomains.length < minExternal) {
    const sources = suggestExternalSources(keywords, minExternal - extDomains.length);
    if (sources.length > 0) {
      const lines = sources.map((s) => `- [${s.title}](${s.url})`);
      md = md.trimEnd() + `\n\n## Sources\n${lines.join('\n')}\n`;
      applied.push(`Added ${sources.length} external source link(s).`);
    }
  }

  // 11) Style: banned words, em dash, run-ons
  const replaced = replaceBannedPhrases(md);
  if (replaced.changed) {
    md = replaced.text;
    applied.push('Reworded overused AI phrases and replaced em dashes.');
  }
  const shortened = splitLongSentences(md);
  if (shortened.changed) {
    md = shortened.text;
    applied.push('Shortened or split overly long sentences.');
  }

  // 12) Split long paragraphs to 2–4 sentences
  const split = splitLongParagraphs(md);
  if (split.changed) {
    md = split.text;
    applied.push('Split long paragraphs to keep 2–4 sentences.');
  }

  // Validate after fixes
  const postValidation = validateAssist({
    title: title,
    outline: input.outline,
    intro: input.intro,
    body: md.replace(/^\s*#\s+[^\n]+\n+/, ""),
    companyName: company,
    keywords,
    internalDomains: input.internalDomains,
    internalPaths: input.internalPaths,
    recentBlogSlugs: input.recentBlogSlugs,
  });

  return { fixedMarkdown: md, appliedFixes: dedupe(applied), postValidation };
}

// Utilities
function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function markdownToPlain(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ") // code blocks
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/^\s*#+\s+/gm, "") // headings
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/\*([^*]+)\*/g, "$1") // italics
    .replace(/!\[[^\]]*\]\([^\)]*\)/g, " ") // images
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, "$1") // links -> text
    .replace(/[<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(text: string): string[] {
  // Simple sentence split on . ! ?
  const parts = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  return parts;
}

function splitParagraphs(md: string): string[] {
  return md.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
}

function countWords(text: string): number {
  const m = text.match(/[A-Za-z0-9’'\-]+/g);
  return m ? m.length : 0;
}

function estimateSyllables(text: string): number {
  // Rough English syllable estimator
  const words = (text.toLowerCase().match(/[a-z]+/g) || []);
  let total = 0;
  for (const w of words) {
    total += syllablesInWord(w);
  }
  return total;
}

function syllablesInWord(w: string): number {
  if (w.length <= 3) return 1;
  let v = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "");
  const m = v.match(/[aeiouy]{1,2}/g);
  return Math.max(1, m ? m.length : 1);
}

function looksPassive(sentence: string): boolean {
  // Heuristic passive voice detector: be-verb + past participle (ed or irregular common set)
  const s = sentence.toLowerCase();
  const be = /(\bwas\b|\bwere\b|\bis\b|\bare\b|\bbe\b|\bbeen\b|\bbeing\b|\bby\b)/;
  const participle = /\b([a-z]+ed|built|made|done|given|seen|known|shown|taken|driven|written|worn|won|lost)\b/;
  return be.test(s) && participle.test(s);
}

type Link = { text: string; url: string };
function extractLinks(md: string): Link[] {
  const out: Link[] = [];
  const re = /\[([^\]]+)\]\(([^\)\s]+)(?:\s+"[^"]*")?\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    out.push({ text: m[1], url: m[2] });
  }
  return out;
}

function analyzeLinks(links: Link[], internalDomains: string[], internalPaths: string[], recentSlugs: Set<string>) {
  const externalDomainsSet = new Set<string>();
  let internalRecentLinks = 0;
  for (const l of links) {
    const url = l.url.trim();
    if (url.startsWith("/")) {
      // internal path
      if (internalPaths.some((p) => url.startsWith(p))) {
        const slug = url.replace(/^\/?blog\//, "").replace(/\/?$/, "");
        if (slug && recentSlugs.has(slug)) internalRecentLinks++;
      }
      continue;
    }
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase();
      const isInternal = internalDomains.some((d) => host === d || host.endsWith("." + d));
      if (!isInternal) externalDomainsSet.add(host);
      else {
        if (u.pathname.startsWith("/blog/")) {
          const slug = u.pathname.replace(/^\/?blog\//, "").replace(/\/?$/, "");
          if (recentSlugs.has(slug)) internalRecentLinks++;
        }
      }
    } catch {
      // ignore invalid URL
    }
  }
  return { externalDomains: Array.from(externalDomainsSet), internalRecentLinks };
}

function sanitizeLinks(md: string): { sanitized: string; autoFixes: string[] } {
  const fixes: string[] = [];
  const re = /\[([^\]]+)\]\(([^\)\s]+)(\s+"[^"]*")?\)/g;
  const out = md.replace(re, (full, text, url, title) => {
    try {
      if (!/^https?:\/\//i.test(url)) return full; // relative -> leave
      const u = new URL(url);
      const before = u.toString();
      // Remove tracking params
      const paramsToRemove: string[] = [];
      u.searchParams.forEach((_, k) => {
        if (k.toLowerCase().startsWith("utm_") || k.toLowerCase().endsWith("clid") || k.toLowerCase() === "ref") paramsToRemove.push(k);
      });
      for (const k of paramsToRemove) u.searchParams.delete(k);
      const after = u.toString();
      if (after !== before) fixes.push(`Stripped tracking parameters from ${u.hostname}`);
      return `[${text}](${after}${title || ""})`;
    } catch {
      return full;
    }
  });
  return { sanitized: out, autoFixes: dedupe(fixes) };
}

function wordBoundaryIncludes(text: string, phrase: string): boolean {
  if (!phrase) return false;
  const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\b${esc}\\b`, 'i');
  return re.test(text);
}

// --- Fix helpers ---
function splitMarkdownBlocks(md: string): string[] {
  // Split on blank lines while preserving headings as separate blocks
  return md.split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean);
}

function joinMarkdownBlocks(blocks: string[]): string {
  return blocks.join('\n\n');
}

function findFirstIntroParagraphIndex(blocks: string[]): number {
  // Skip initial H1 and optional TOC section
  let i = 0;
  if (i < blocks.length && /^#\s+/.test(blocks[i])) i++;
  if (i < blocks.length && /^##\s+in this post/i.test(blocks[i])) i += 2; // heading + list
  for (; i < blocks.length; i++) {
    if (!/^#/.test(blocks[i])) return i;
  }
  return -1;
}

function appendToFirstSentence(paragraph: string, toAppend: string): string {
  const parts = paragraph.split(/(?<=[.!?])\s+/);
  if (parts.length === 0) return paragraph + toAppend;
  parts[0] = parts[0] + toAppend;
  return parts.join(' ');
}

function appendKeyword(paragraph: string, kw: string): string {
  if (wordBoundaryIncludes(markdownToPlain(paragraph), kw)) return paragraph;
  return appendToFirstSentence(paragraph, ` This covers ${kw} in plain terms.`);
}

function deriveQuickTips(md: string, maxItems = 4): string[] {
  const paragraphs = splitParagraphs(md).slice(0, 6);
  const tips: string[] = [];
  for (const p of paragraphs) {
    const s = splitSentences(p)[0] || '';
    if (!s) continue;
    tips.push(`- ${s.replace(/\.$/, '')}.`);
    if (tips.length >= maxItems) break;
  }
  if (tips.length === 0) tips.push('- Keep paragraphs short and specific.', '- Add two credible external sources.', '- Link to recent posts readers may like.', '- Speak directly to the rider.');
  return tips;
}

function choosePhrasesToBold(md: string, keywords: string[], maxCount: number): string[] {
  const chosen: string[] = [];
  for (const k of keywords) {
    if (chosen.length >= maxCount) break;
    if (!new RegExp(`\n?\*\*${escapeRegExp(k)}\*\*`, 'i').test(md) && wordBoundaryIncludes(markdownToPlain(md), k)) {
      chosen.push(k);
    }
  }
  return chosen;
}

function boldInNonLinkSegments(md: string, phrases: string[]): string {
  if (phrases.length === 0) return md;
  // Split by link markup, bold in plain segments
  const parts: string[] = [];
  const re = /(\[[^\]]+\]\([^\)]+\))/g;
  const segments = md.split(re);
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (re.test(seg)) {
      parts.push(seg);
    } else {
      let s = seg;
      for (const ph of phrases) {
        const esc = ph.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        s = s.replace(new RegExp(`(?!\*)\\b(${esc})\\b(?!\*)`, 'gi'), '**$1**');
      }
      parts.push(s);
    }
  }
  return parts.join('');
}

function replaceBannedPhrases(md: string): { text: string; changed: boolean } {
  let text = md;
  const before = text;
  const replacements: [RegExp, string][] = [
    [/\b[Ee]nsure\b/g, 'make sure'],
    [/\b[Tt]ailored\b/g, 'custom'],
    [/(\bunlock\b|\bunleash\b|\bharness\b)/gi, 'use'],
    [/(\bmoreover\b|\bsubsequently\b|\baccordingly\b|\bhowever\b)/gi, 'also'],
    [/(\bcrucial\b|\bpivotal\b)/gi, 'important'],
    [/—/g, '-'],
    [/\b[Ii]n conclusion\b/g, ''],
  ];
  for (const [re, rep] of replacements) text = text.replace(re, rep);
  return { text, changed: text !== before };
}

function splitLongSentences(md: string): { text: string; changed: boolean } {
  const before = md;
  const sentences = md.split(/(\.|!|\?)\s+/);
  // Simple heuristic: split if > 29 words by inserting a period before conjunctions
  for (let i = 0; i < sentences.length; i += 2) {
    const s = sentences[i];
    if (!s) continue;
    const wc = countWords(s);
    if (wc > 29) {
      const cut = s.replace(/,?\s+(and|but|so|then)\s+/i, '. ');
      sentences[i] = cut;
    }
  }
  const text = sentences.join(' ');
  return { text, changed: text !== before };
}

function splitLongParagraphs(md: string): { text: string; changed: boolean } {
  const blocks = splitMarkdownBlocks(md);
  let changed = false;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (/^#/.test(b)) continue; // skip headings
    const sents = splitSentences(markdownToPlain(b));
    if (sents.length > 4) {
      const first = sents.slice(0, 3).join(' ');
      const rest = sents.slice(3).join(' ');
      blocks[i] = first;
      blocks.splice(i + 1, 0, rest);
      changed = true;
      i++; // skip newly inserted block
    }
  }
  return { text: joinMarkdownBlocks(blocks), changed };
}

function suggestExternalSources(keywords: string[], need: number): { title: string; url: string }[] {
  const bank: { title: string; url: string; tags?: string[] }[] = [
    { title: 'Cleveland Clinic — Preventing Chafing', url: 'https://health.clevelandclinic.org/how-to-prevent-chafing' , tags: ['chafing','skin']},
    { title: 'NHS — Prickly Heat and Chafing', url: 'https://www.nhs.uk/conditions/heat-rash/' , tags: ['heat','skin','chafing']},
    { title: 'CDC — Heat and Hydration', url: 'https://www.cdc.gov/disasters/extremeheat/heattips.html', tags: ['heat','hydration']},
    { title: 'USA Cycling — Rider Safety Tips', url: 'https://usacycling.org/article/safety-tips-for-cyclists', tags: ['safety','tips']},
    { title: 'Bicycling — Saddle Fit Basics', url: 'https://www.bicycling.com/skills-tips/a20044164/saddle-height/' , tags: ['saddle','fit']},
  ];
  const kw = keywords.map((k) => k.toLowerCase());
  const picks: { title: string; url: string }[] = [];
  const used = new Set<string>();
  for (const item of bank) {
    if (picks.length >= need) break;
    if (used.has(new URL(item.url).hostname)) continue;
    if (kw.length === 0 || (item.tags || []).some((t) => kw.includes(t))) {
      picks.push({ title: item.title, url: item.url });
      used.add(new URL(item.url).hostname);
    }
  }
  // If still short, fill with remaining distinct hosts
  for (const item of bank) {
    if (picks.length >= need) break;
    const host = new URL(item.url).hostname;
    if (!Array.from(used).includes(host)) {
      picks.push({ title: item.title, url: item.url });
      used.add(host);
    }
  }
  return picks.slice(0, need);
}

function capitalize(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
