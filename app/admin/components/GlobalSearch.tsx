"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Package, ShoppingCart, Users, Tags, Ticket, Newspaper } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ResultItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

type SearchResults = {
  products: ResultItem[];
  orders: ResultItem[];
  customers: ResultItem[];
  discounts?: ResultItem[];
  categories?: ResultItem[];
  posts?: ResultItem[];
};

export default function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({ products: [], orders: [], customers: [] });
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const hasAny = useMemo(() =>
    results.products.length + results.orders.length + results.customers.length +
    (results.discounts?.length || 0) + (results.categories?.length || 0) + (results.posts?.length || 0) > 0,
  [results]);

  type QuickAction = { label: string; href: string; keywords: string[] };
  const quickActions: QuickAction[] = [
    { label: "Go to Dashboard", href: "/admin", keywords: ["dashboard", "home"] },
    { label: "Go to Products", href: "/admin/products", keywords: ["product", "products"] },
    { label: "New Product", href: "/admin/products?new=1", keywords: ["new product", "create product", "add product"] },
    { label: "Go to Categories", href: "/admin/categories", keywords: ["category", "categories", "tags"] },
    { label: "Go to Orders", href: "/admin/orders", keywords: ["order", "orders"] },
    { label: "Go to Customers", href: "/admin/customers", keywords: ["customer", "customers", "users"] },
    { label: "Go to Discounts", href: "/admin/discounts", keywords: ["discount", "coupon", "coupons", "codes"] },
    { label: "New Discount", href: "/admin/discounts?new=1", keywords: ["new discount", "create coupon", "add code"] },
    { label: "Go to Blog", href: "/admin/blog", keywords: ["blog", "posts", "post"] },
    { label: "Go to Announcements", href: "/admin/announcements", keywords: ["announcements", "announcement", "banner", "promo"] },
    { label: "Go to Newsletter", href: "/admin/newsletter", keywords: ["newsletter", "email", "subscribers"] },
    { label: "Go to Settings", href: "/admin/settings", keywords: ["settings", "config", "preferences"] },
  ];
  const matchedActions = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [] as QuickAction[];
    return quickActions.filter(a => a.keywords.some(k => k.includes(s) || s.includes(k)));
  }, [q]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults({ products: [], orders: [], customers: [] });
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const json = await res.json();
        setResults(json);
      } catch (_) {
        // ignore aborts
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q]);

  // Build flattened navigable list
  const flatItems = useMemo(() => {
    const items: { label: string; href: string }[] = [];
    matchedActions.forEach(a => items.push({ label: a.label, href: a.href }));
    const push = (arr: ResultItem[]) => arr.forEach(i => items.push({ label: i.title, href: i.href }));
    push(results.products);
    push(results.orders);
    push(results.customers);
    push(results.discounts || []);
    push(results.categories || []);
    push(results.posts || []);
    return items;
  }, [matchedActions, results]);

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, flatItems.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const target = flatItems[activeIndex];
      if (target) {
        setOpen(false);
        router.push(target.href);
      }
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.length >= 2 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search products, orders, customers…"
          className="w-full pl-8 pr-3 h-9 rounded-md border border-gray-200 bg-white text-sm dark:border-neutral-700 dark:bg-neutral-900 outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden">
          {loading && (
            <div className="p-3 text-sm text-gray-500 dark:text-gray-400">Searching…</div>
          )}
          {!loading && !hasAny && (
            <div className="p-3 text-sm text-gray-500 dark:text-gray-400">No results</div>
          )}
          {!loading && hasAny && (
            <div className="max-h-[60vh] overflow-auto divide-y divide-black/5 dark:divide-white/10">
              {matchedActions.length > 0 && (
                <div>
                  <div className="px-3 pt-3 pb-2 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Quick actions</div>
                  <ul className="py-1">
                    {matchedActions.map((a, idx) => (
                      <li key={idx}>
                        <Link
                          href={a.href}
                          className={`block px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800 ${activeIndex === idx ? 'bg-gray-50 dark:bg-neutral-800' : ''}`}
                        >
                          <div className="text-sm text-gray-900 dark:text-gray-100">{a.label}</div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Section title="Products" icon={<Package className="h-4 w-4" />} items={results.products} startIndex={matchedActions.length} activeIndex={activeIndex} />
              <Section title="Orders" icon={<ShoppingCart className="h-4 w-4" />} items={results.orders} startIndex={matchedActions.length + results.products.length} activeIndex={activeIndex} />
              <Section title="Customers" icon={<Users className="h-4 w-4" />} items={results.customers} startIndex={matchedActions.length + results.products.length + results.orders.length} activeIndex={activeIndex} />
              <Section title="Discounts" icon={<Ticket className="h-4 w-4" />} items={results.discounts || []} startIndex={matchedActions.length + results.products.length + results.orders.length + results.customers.length} activeIndex={activeIndex} />
              <Section title="Categories" icon={<Tags className="h-4 w-4" />} items={results.categories || []} startIndex={matchedActions.length + results.products.length + results.orders.length + results.customers.length + (results.discounts?.length || 0)} activeIndex={activeIndex} />
              <Section title="Posts" icon={<Newspaper className="h-4 w-4" />} items={results.posts || []} startIndex={matchedActions.length + results.products.length + results.orders.length + results.customers.length + (results.discounts?.length || 0) + (results.categories?.length || 0)} activeIndex={activeIndex} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, items, startIndex, activeIndex }: { title: string; icon: React.ReactNode; items: ResultItem[]; startIndex: number; activeIndex: number }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="px-3 pt-3 pb-2 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-2">
        {icon}
        {title}
      </div>
      <ul className="py-1">
        {items.map((item, i) => (
          <li key={item.id}>
            <Link href={item.href} className={`block px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800 ${activeIndex === startIndex + i ? 'bg-gray-50 dark:bg-neutral-800' : ''}`}>
              <div className="text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{item.title}</div>
              {item.subtitle && (
                <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{item.subtitle}</div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
