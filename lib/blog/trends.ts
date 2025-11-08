// Lightweight trending topics helper using configured RSS feeds.
// If no feeds configured, returns a few cycling-related defaults.

type Topic = { topic: string; source?: string };

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

function decodeHtmlEntities(input: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ndash: "–",
    mdash: "—",
    rsquo: "’",
    lsquo: "‘",
    rdquo: "”",
    ldquo: "“",
  };
  return input
    // numeric decimal
    .replace(/&#(\d+);/g, (_, d) => {
      const code = Number(d);
      try { return String.fromCodePoint(code); } catch { return _ as string; }
    })
    // numeric hex
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => {
      const code = parseInt(h, 16);
      try { return String.fromCodePoint(code); } catch { return _ as string; }
    })
    // named
    .replace(/&([a-zA-Z]+);/g, (_, name) => (named[name] ?? `&${name};`));
}

export async function getTrendingTopicsFromRss(limitOrOptions: number | { poolLimit?: number; perFeed?: number } = 8): Promise<Topic[]> {
  const feeds = (process.env.RSS_FEEDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (feeds.length === 0) {
    return [
      { topic: "Gravel racing tire setup" },
      { topic: "Winter base training tips" },
      { topic: "Nutrition for long rides" },
      { topic: "MTB trail maintenance notes" },
      { topic: "Urban commuting safety gear" },
    ];
  }
  const poolLimit = typeof limitOrOptions === 'number' ? limitOrOptions : (limitOrOptions.poolLimit ?? 64);
  const perFeed = typeof limitOrOptions === 'number' ? 10 : Math.max(5, Math.min(50, limitOrOptions.perFeed ?? 20));

  const titles: string[] = [];
  for (const url of feeds) {
    try {
      const xml = await fetchText(url);
      const itemRegex = /<item[\s\S]*?<\/item>/gim;
      const titleRegex = /<title>([\s\S]*?)<\/title>/i;
      const list = xml.match(itemRegex) || [];
      for (let i = 0; i < Math.min(perFeed, list.length); i++) {
        const block = list[i];
        const raw = block.match(titleRegex)?.[1] ?? "";
        const title = decodeHtmlEntities(raw.replace(/<[^>]*>/g, "").trim());
        if (title) titles.push(title);
      }
    } catch {}
  }
  // Normalize for better de-duplication
  const norm = (s: string) =>
    decodeHtmlEntities(s)
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+[-–—|:].*$/, "") // drop source suffixes like " - Site"
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const t of titles) {
    const key = norm(t);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(t);
    if (uniq.length >= poolLimit) break;
  }
  return uniq.map((t) => ({ topic: t }));
}
