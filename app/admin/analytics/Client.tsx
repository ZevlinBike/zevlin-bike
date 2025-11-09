"use client";

import React, { useEffect, useMemo, useState } from "react";
import LineChart, { type Point } from "@/components/charts/LineChart";

type TypeKey = "post" | "product" | "page";

type Summary = { totalViews: number; totalUniques: number; days: number; items: number; avgPerDay: number };
type DayRow = { day: string; views: number; uniques: number };
type ItemRow = { slug: string; views: number; uniques: number };
type RefEntry = { slug: string; referrers: { domain: string; views: number }[] };

type ApiResponse = { summary: Summary; byDay: DayRow[]; byItem: ItemRow[]; referrers: RefEntry[] };

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, delta: number) {
  const dd = new Date(d);
  dd.setDate(dd.getDate() + delta);
  return dd;
}

export default function AnalyticsClient({ initialType = "post" as TypeKey }) {
  const [type, setType] = useState<TypeKey>(initialType);
  const [span, setSpan] = useState<"7" | "30" | "90" | "custom">("30");
  const today = useMemo(() => new Date(), []);
  const [start, setStart] = useState<string>(fmtDate(addDays(today, -29)));
  const [end, setEnd] = useState<string>(fmtDate(today));
  const [slugFilter, setSlugFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  // keep dates in sync with span
  useEffect(() => {
    if (span !== "custom") {
      const days = Number(span);
      const s = fmtDate(addDays(today, -(days - 1)));
      const e = fmtDate(today);
      setStart(s);
      setEnd(e);
    }
  }, [span, today]);

  // fetch
  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/analytics", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type, start, end }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ApiResponse;
        setData(json);
      } catch (e) {
        console.warn("analytics fetch error", e);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [type, start, end]);

  const filteredItems = useMemo(() => {
    const items = data?.byItem || [];
    if (!slugFilter) return items;
    const q = slugFilter.toLowerCase();
    return items.filter((x) => x.slug.toLowerCase().includes(q));
  }, [data, slugFilter]);

  const points: Point[] = useMemo(() => {
    if (!data) return [];
    // build continuous series from start..end
    const map = new Map(data.byDay.map((r) => [r.day, r.views] as const));
    const startD = new Date(start + "T00:00:00Z");
    const endD = new Date(end + "T00:00:00Z");
    const rows: Point[] = [];
    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      const key = fmtDate(d);
      rows.push({ x: key.slice(5), y: map.get(key) || 0 }); // show as MM-DD
    }
    return rows;
  }, [data, start, end]);

  const selectedRefs = useMemo(() => {
    if (!data || !selectedSlug) return [] as { domain: string; views: number }[];
    const entry = data.referrers.find((x) => x.slug === selectedSlug);
    return entry?.referrers || [];
  }, [data, selectedSlug]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs mb-1 opacity-70">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as TypeKey)} className="h-9 rounded border px-2 bg-white dark:bg-neutral-900">
            <option value="post">Blog Posts</option>
            <option value="product">Products</option>
            <option value="page">Pages</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1 opacity-70">Timespan</label>
          <div className="flex gap-2">
            {(["7", "30", "90"] as const).map((s) => (
              <button key={s} className={`h-9 px-3 rounded border text-sm ${span === s ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white dark:bg-neutral-900'}`} onClick={() => setSpan(s)}>
                {s} days
              </button>
            ))}
            <button className={`h-9 px-3 rounded border text-sm ${span === 'custom' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white dark:bg-neutral-900'}`} onClick={() => setSpan('custom')}>
              Custom
            </button>
          </div>
        </div>
        {span === "custom" && (
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-xs mb-1 opacity-70">Start</label>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-9 rounded border px-2 bg-white dark:bg-neutral-900" />
            </div>
            <div>
              <label className="block text-xs mb-1 opacity-70">End</label>
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-9 rounded border px-2 bg-white dark:bg-neutral-900" />
            </div>
          </div>
        )}
        <div className="ml-auto">
          <label className="block text-xs mb-1 opacity-70">Slug filter</label>
          <input placeholder="contains…" value={slugFilter} onChange={(e) => setSlugFilter(e.target.value)} className="h-9 rounded border px-2 bg-white dark:bg-neutral-900" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Views" value={data?.summary.totalViews ?? 0} />
        <Kpi label="Uniques" value={data?.summary.totalUniques ?? 0} />
        <Kpi label="Avg / day" value={data?.summary.avgPerDay ?? 0} />
        <Kpi label="Items" value={data?.summary.items ?? 0} />
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 p-3 overflow-x-auto">
        <div className="text-sm font-medium mb-2">Views per day</div>
        <LineChart data={points} width={720} height={240} />
        {loading && <div className="text-xs opacity-70 mt-2">Loading…</div>}
      </div>

      {/* Top items */}
      <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 p-3">
        <div className="text-sm font-medium mb-3">Top items</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-2 py-1">Slug</th>
                <th className="px-2 py-1 text-right">Views</th>
                <th className="px-2 py-1 text-right">Uniques</th>
                <th className="px-2 py-1">Referrers (top 3)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {filteredItems.map((it) => {
                const refs = data?.referrers.find((r) => r.slug === it.slug)?.referrers.slice(0, 3) || [];
                const selected = selectedSlug === it.slug;
                return (
                  <tr key={it.slug} className={selected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}>
                    <td className="px-2 py-1 font-medium">
                      <button className="underline underline-offset-2" onClick={() => setSelectedSlug((s) => (s === it.slug ? null : it.slug))}>{it.slug}</button>
                    </td>
                    <td className="px-2 py-1 text-right tabular-nums">{it.views.toLocaleString()}</td>
                    <td className="px-2 py-1 text-right tabular-nums">{it.uniques.toLocaleString()}</td>
                    <td className="px-2 py-1">
                      <div className="flex flex-wrap gap-2">
                        {refs.length === 0 && <span className="text-xs opacity-60">—</span>}
                        {refs.map((r) => (
                          <span key={r.domain} className="px-2 py-0.5 rounded-full border text-[11px] border-gray-200 dark:border-neutral-700">
                            {r.domain} · {r.views}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-2 py-4 text-center text-gray-500">No items.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected details */}
      {selectedSlug && (
        <SelectedDetails type={type} slug={selectedSlug} start={start} end={end} />
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</div>
    </div>
  );
}

function SelectedDetails({ type, slug, start, end }: { type: TypeKey; slug: string; start: string; end: string }) {
  const [data, setData] = useState<DayRow[] | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/admin/analytics", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type, start, end, slugs: [slug] }),
          signal: controller.signal,
        });
        const json = (await res.json()) as ApiResponse;
        setData(json.byDay);
      } catch {
        setData(null);
      }
    })();
    return () => controller.abort();
  }, [type, slug, start, end]);

  const points: Point[] = useMemo(() => {
    if (!data) return [];
    const map = new Map(data.map((r) => [r.day, r.views] as const));
    const startD = new Date(start + "T00:00:00Z");
    const endD = new Date(end + "T00:00:00Z");
    const rows: Point[] = [];
    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      rows.push({ x: key.slice(5), y: map.get(key) || 0 });
    }
    return rows;
  }, [data, start, end]);

  return (
    <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 p-3">
      <div className="text-sm font-medium mb-2">{slug} — Views per day</div>
      <LineChart data={points} width={720} height={240} color="#16a34a" />
    </div>
  );
}

