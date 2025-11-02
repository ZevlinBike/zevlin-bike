export type UnsplashPhoto = {
  id: string;
  alt: string;
  thumb: string;
  regular: string;
  creditName: string;
  creditLink: string; // include utm params
};

export async function searchUnsplash(query: string, perPage = 6): Promise<UnsplashPhoto[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query || "cycling");
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("orientation", "landscape");
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${key}` },
  });
  if (!res.ok) return [];
  interface ApiPhoto {
    id: string;
    alt_description?: string | null;
    urls?: { small?: string; regular?: string };
    user?: { name?: string | null };
    links?: { html?: string };
  }
  interface ApiResponse { results?: ApiPhoto[] }
  const json = (await res.json()) as ApiResponse;
  const list = json?.results || [];
  const mapped: UnsplashPhoto[] = list.map((p: ApiPhoto) => ({
    id: p.id,
    alt: p.alt_description || "Cycling image",
    thumb: p.urls?.small ?? "",
    regular: p.urls?.regular ?? "",
    creditName: p.user?.name || "Unsplash Creator",
    creditLink: `${p.links?.html ?? ""}?utm_source=Zevlin&utm_medium=referral`,
  }));
  return mapped;
}
