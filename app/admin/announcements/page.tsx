"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, Search, Filter, ChevronDown, MoreHorizontal, Pencil, Trash2, UploadCloud, PauseCircle, Archive
} from "lucide-react";
import { clsx } from "clsx";
import { getNotifications, deleteNotification, bulkUpdateNotificationStatus } from "./actions";
import { Notification } from "@/lib/schema";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";

type Status = Notification["status"];
type Variant = Notification["variant"];

const allStatuses: ("all" | Status)[] = ["all", "draft", "scheduled", "published", "expired", "archived"];
const allVariants: ("all" | Variant)[] = ["all", "promo", "info", "success", "warning", "danger"];

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { label: string; classes: string }> = {
    draft: { label: "Draft", classes: "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300" },
    scheduled: { label: "Scheduled", classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200" },
    published: { label: "Published", classes: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
    expired: { label: "Expired", classes: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
    archived: { label: "Archived", classes: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300" },
  };
  const { label, classes } = map[status];
  return <span className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", classes)}>{label}</span>;
}

export default function AdminAnnouncementsPage() {
  const [rows, setRows] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const query = searchParams.get("q") || searchParams.get("query") || "";
  const status = (searchParams.get("status") || "all").toLowerCase();
  const variant = (searchParams.get("variant") || "all").toLowerCase();
  const sort = searchParams.get("sort") || "updated_at-desc";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  useEffect(() => {
    setLoading(true);
    const params = { query, status, variant, sort, page, pageSize };
    getNotifications(params).then(({ notifications }) => {
      setRows(notifications);
      setLoading(false);
    });
  }, [query, status, variant, sort, page]);

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (term) params.set("query", term); else params.delete("query");
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (value === "all") params.delete(key); else params.set(key, value);
    replace(`${pathname}?${params.toString()}`);
  };

  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const allSelected = rows.length > 0 && rows.every((r) => selected[r.id]);
  const toggleSelectAll = () => {
    const next = { ...selected };
    if (allSelected) rows.forEach((r) => delete next[r.id]);
    else rows.forEach((r) => (next[r.id] = true));
    setSelected(next);
  };

  const refresh = () => {
    const params = { query, status, variant, sort, page, pageSize };
    getNotifications(params).then(({ notifications }) => {
      setRows(notifications);
    });
  };

  const onBulk = async (action: "publish" | "archive" | "unpublish" | "delete") => {
    if (action === "delete") {
      await Promise.all(selectedIds.map((id) => deleteNotification(id)));
      toast.success(`${selectedIds.length} announcements deleted.`);
    } else if (action === "publish") {
      await bulkUpdateNotificationStatus(selectedIds, "published");
      toast.success(`${selectedIds.length} announcements published.`);
    } else if (action === "unpublish") {
      await bulkUpdateNotificationStatus(selectedIds, "draft");
      toast.success(`${selectedIds.length} announcements moved to draft.`);
    } else if (action === "archive") {
      await bulkUpdateNotificationStatus(selectedIds, "archived");
      toast.success(`${selectedIds.length} announcements archived.`);
    }
    setSelected({});
    refresh();
  };

  const onRow = async (id: string, action: "edit" | "publish" | "unpublish" | "archive" | "delete") => {
    if (action === "delete") {
      await deleteNotification(id);
      toast.success("Announcement deleted.");
    } else if (action === "publish") {
      await bulkUpdateNotificationStatus([id], "published");
      toast.success("Announcement published.");
    } else if (action === "unpublish") {
      await bulkUpdateNotificationStatus([id], "draft");
      toast.success("Announcement moved to draft.");
    } else if (action === "archive") {
      await bulkUpdateNotificationStatus([id], "archived");
      toast.success("Announcement archived.");
    } else if (action === "edit") {
      replace(`/admin/announcements/edit/${id}`);
      return;
    }
    refresh();
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-neutral-900 dark:text-gray-100">
      <div className="container mx-auto px-4 lg:px-6 pt-6 sm:pt-8 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Announcements</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Create and manage site-wide notifications.</p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/admin/announcements/new">
              <Plus className="h-4 w-4" />
              New Announcement
            </Link>
          </Button>
        </div>

        <div className="rounded-xl border border-black/5 dark:border-white/10 bg-gray-50 dark:bg-neutral-800 p-3 sm:p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search title or message…"
                defaultValue={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 h-9 bg-white dark:bg-neutral-900"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 gap-2">
                  <Filter className="h-4 w-4" />
                  {status === "all" ? "All statuses" : status}
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-44">
                {allStatuses.map((s) => (
                  <DropdownMenuItem key={s} onClick={() => handleFilterChange("status", s)}>
                    {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 gap-2">
                  Variant: {variant}
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-44">
                {allVariants.map((v) => (
                  <DropdownMenuItem key={v} onClick={() => handleFilterChange("variant", v)}>
                    {v}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9">
                  Sort: {sort.replace("-", " ")} <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuItem onClick={() => handleFilterChange("sort", "updated_at-desc")}>Updated ↓</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange("sort", "updated_at-asc")}>Updated ↑</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange("sort", "priority-desc")}>Priority ↓</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange("sort", "starts_at-asc")}>Starts soonest</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {selectedIds.length > 0 && (
            <>
              <Separator className="my-3" />
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-400">{selectedIds.length} selected</span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onBulk("publish")} className="h-8">
                    <UploadCloud className="h-4 w-4 mr-1" /> Publish
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => onBulk("unpublish")} className="h-8">
                    <PauseCircle className="h-4 w-4 mr-1" /> Unpublish
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => onBulk("archive")} className="h-8">
                    <Archive className="h-4 w-4 mr-1" /> Archive
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onBulk("delete")} className="h-8">
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setSelected({})} className="h-8 ml-auto">
                  Clear
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Table */}
        <div className="mt-4 overflow-hidden rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-3 py-2 w-8">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                </th>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Variant</th>
                <th className="px-3 py-2 text-left">Priority</th>
                <th className="px-3 py-2 text-left">Starts</th>
                <th className="px-3 py-2 text-left">Ends</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-gray-500">Loading…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-gray-500">No announcements found.</td>
                </tr>
              ) : (
                rows.map((n) => (
                  <tr key={n.id} className="border-t border-black/5 dark:border-white/10">
                    <td className="px-3 py-2 align-top">
                      <input
                        type="checkbox"
                        checked={!!selected[n.id]}
                        onChange={(e) => setSelected((s) => ({ ...s, [n.id]: e.target.checked }))}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="font-medium">{n.title}</div>
                      <div className="text-xs text-gray-500 line-clamp-1">{n.message}</div>
                    </td>
                    <td className="px-3 py-2 align-top"><StatusPill status={n.status} /></td>
                    <td className="px-3 py-2 align-top">{n.variant}</td>
                    <td className="px-3 py-2 align-top tabular-nums">{n.priority}</td>
                    <td className="px-3 py-2 align-top">{formatDate(n.starts_at)}</td>
                    <td className="px-3 py-2 align-top">{formatDate(n.ends_at)}</td>
                    <td className="px-3 py-2 align-top text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onRow(n.id, "edit")}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          {n.status !== "published" && (
                            <DropdownMenuItem onClick={() => onRow(n.id, "publish")}>
                              <UploadCloud className="h-4 w-4 mr-2" /> Publish
                            </DropdownMenuItem>
                          )}
                          {n.status === "published" && (
                            <DropdownMenuItem onClick={() => onRow(n.id, "unpublish")}>
                              <PauseCircle className="h-4 w-4 mr-2" /> Unpublish
                            </DropdownMenuItem>
                          )}
                          {n.status !== "archived" && (
                            <DropdownMenuItem onClick={() => onRow(n.id, "archive")}>
                              <Archive className="h-4 w-4 mr-2" /> Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => onRow(n.id, "delete")}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
