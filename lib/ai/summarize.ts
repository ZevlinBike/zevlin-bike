// Server-only summarizer using OpenAI via fetch (no SDK dependency)
// Expects: process.env.OPENAI_API_KEY

type SummarizeInput = {
  brandVoice?: string;
  dateISO?: string;
  topics: string[]; // hints like ["weather", "events", ...]
  facts: string; // concatenated raw facts/text to base the blog on
  desiredWords?: number; // approximate target length
};

export type SummarizeResult = {
  title: string;
  excerpt: string;
  bodyMarkdown: string;
};

type ChatCompletion = {
  choices?: { message?: { content?: string } | null }[];
};

export async function summarizeToBlog({
  brandVoice = "Friendly, concise, cyclist-first, expert but approachable.",
  dateISO = new Date().toISOString().slice(0, 10),
  topics,
  facts,
  desiredWords = 320,
}: SummarizeInput): Promise<SummarizeResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const system = [
    "You are a cycling brand content editor for Zevlin.",
    "Write short, engaging posts that feel human—no generic filler.",
    "Prioritize factual accuracy and clarity.",
    "Use a confident, warm tone with a touch of personality.",
    "Align topics with Zevlin’s focus on rider comfort and chamois creams when relevant.",
    "Avoid medical claims or promises; keep guidance educational and practical.",
    "If appropriate, include at most one gentle CTA referencing Zevlin products—no hard sell.",
  ].join(" ");

  const user = [
    `Date: ${dateISO}`,
    `Brand voice: ${brandVoice}`,
    `Focus topics: ${topics.join(", ")}`,
    "Facts and source notes (verbatim):\n" + facts,
    "\nTask: Using only the facts above, craft a short blog post.",
    `Target length ~${desiredWords} words.`,
    "Deliver in pure Markdown.",
    "Include:",
    "- A strong H1 title",
    "- A 1–2 sentence excerpt",
    "- 3–5 concise bullets summarizing key takeaways",
    "- A few short paragraphs with clear transitions",
    "- Natural references to the data points",
    "Avoid overused AI phrases, avoid fluff, avoid generic conclusions.",
    "Do not include disclaimers about being an AI.",
  ].join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI request failed: ${res.status} ${res.statusText} ${errText}`);
  }

  const data = (await res.json()) as ChatCompletion;
  const content: string = data.choices?.[0]?.message?.content || "";
  if (!content) throw new Error("No content returned from OpenAI");

  // Heuristic: first line starting with '# ' is title; next 1–2 lines after blank considered excerpt
  const lines = content.split(/\r?\n/);
  let title = "";
  let excerpt = "";
  let bodyStartIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!title && l.startsWith("# ")) {
      title = l.replace(/^#\s+/, "").trim();
      // excerpt: next non-empty line(s) until blank
      let j = i + 1;
      const excerptParts: string[] = [];
      while (j < lines.length && lines[j].trim()) {
        excerptParts.push(lines[j].trim());
        j++;
        if (excerptParts.join(" ").length > 220) break;
      }
      excerpt = excerptParts.join(" ").trim();
      bodyStartIdx = Math.max(j + 1, i + 1);
      break;
    }
  }
  if (!title) {
    // Fallback: derive from first sentence
    title = `Zevlin Daily — ${dateISO}`;
  }
  const bodyMarkdown = lines.slice(bodyStartIdx).join("\n").trim() || content;

  return { title, excerpt, bodyMarkdown };
}

export async function expandOutlineToBody({
  topic,
  outline,
  intro,
  facts = "",
  brandVoice = "Friendly, concise, cyclist-first, expert but approachable.",
  targetWords = 800,
}: {
  topic: string;
  outline: string;
  intro?: string;
  facts?: string;
  brandVoice?: string;
  targetWords?: number;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const system = `You are a senior cycling editor for Zevlin. Expand outlines into clean, practical, human-feeling articles. Emphasize rider comfort and, when natural, connect to chamois cream best practices and skin comfort. Avoid medical claims or unverified efficacy. Keep any product mentions subtle and helpful. Tone: ${brandVoice}.`;
  const user = [
    `Topic: ${topic}`,
    facts ? `Relevant facts (verbatim, cite naturally):\n${facts}` : "",
    `Outline (Markdown bullets):\n${outline}`,
    intro ? `Intro context:\n${intro}` : "",
    `Task: Write the full body content in Markdown (~${targetWords} words).`,
    `Constraints:`,
    `- Do NOT include an H1 title or an excerpt; body only.`,
    `- Use clear H2/H3 subheadings derived from the outline.`,
    `- Keep paragraphs short, specific, and actionable.`,
    `- Avoid filler and generic AI phrases.`,
    `- No health/medical claims; keep it educational and brand-aligned.`,
    `- Optional: a single soft CTA near the end (non-pushy).`,
  ].filter(Boolean).join("\n\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI request failed: ${res.status}`);
  const data = (await res.json()) as ChatCompletion;
  const content: string = data.choices?.[0]?.message?.content || "";
  return content.trim();
}

export async function draftOutlineAndIntro({
  topic,
  facts = "",
  brandVoice = "Friendly, concise, cyclist-first, expert but approachable.",
  desiredWords = 160,
}: {
  topic: string;
  facts?: string;
  brandVoice?: string;
  desiredWords?: number;
}): Promise<{ title: string; outline: string; intro: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const system = `You are a senior cycling editor for Zevlin. Draft crisp outlines and engaging intros without fluff. Prefer angles relevant to rider comfort and chamois creams. Avoid medical claims; keep advice practical and brand-aligned. Tone: ${brandVoice}`;
  const user = [
    `Topic: ${topic}`,
    facts ? `Relevant facts:\n${facts}` : "",
    `Task: Provide (1) a compelling title, (2) a concise outline (3–6 bullets), and (3) a short intro (~${desiredWords} words). Use Markdown.`,
    "Format strictly as:",
    "Title: <one line>",
    "\nOutline:\n- ...\n- ...",
    "\nIntro:\n<paragraphs>",
  ].filter(Boolean).join("\n\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI request failed: ${res.status}`);
  const data = (await res.json()) as ChatCompletion;
  const content: string = data.choices?.[0]?.message?.content || "";

  // Parse sections by labels
  const titleMatch = content.match(/Title:\s*([^\n]+)/i);
  const outlineMatch = content.match(/Outline:\s*([\s\S]*?)\n\s*Intro:/i);
  const introMatch = content.match(/Intro:\s*([\s\S]*)/i);

  return {
    title: (titleMatch?.[1] || topic).trim(),
    outline: (outlineMatch?.[1] || "").trim(),
    intro: (introMatch?.[1] || "").trim(),
  };
}
