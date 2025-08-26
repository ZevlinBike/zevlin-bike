
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Globe,
  PauseCircle,
  UploadCloud,
  Eye,
  User2,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import { getPosts, deletePost, bulkUpdatePostStatus } from "./actions";
import { BlogPost } from "@/lib/schema";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";

type PostStatus = "draft" | "published";

// ---- Helpers ----
function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function StatusPill({ status }: { status: PostStatus }) {
  const map: Record<PostStatus, { label: string; classes: string }> = {
    draft: { label: "Draft", classes: "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300" },
    published: { label: "Published", classes: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  };
  const { label, classes } = map[status];
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", classes)}>
      {label}
    </span>
  );
}

// ---- Page ----
export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const query = searchParams.get("q") || searchParams.get("query") || "";
  const status = searchParams.get("status") || "all";
  const sort = searchParams.get("sort") || "updated_at-desc";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 8;

  useEffect(() => {
    setIsLoading(true);
    const params = {
      query,
      status,
      sort,
      page,
      pageSize,
    };
    getPosts(params).then(({ posts, total }: { posts: BlogPost[], total: number }) => {
      setPosts(posts);
      setTotal(total);
      setIsLoading(false);
    });
  }, [query, status, sort, page, pageSize]);

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    replace(`${pathname}?${params.toString()}`);
  };
  
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const allSelectedOnPage = posts.length > 0 && posts.every((p) => selected[p.id]);
  const toggleSelectAll = () => {
    const next = { ...selected };
    if (allSelectedOnPage) {
      posts.forEach((p) => delete next[p.id]);
    } else {
      posts.forEach((p) => (next[p.id] = true));
    }
    setSelected(next);
  };

  const clearSelections = () => setSelected({});
  const selectedIds = Object.keys(selected).filter((id) => selected[id]);

  const onBulk = async (action: "publish" | "unpublish" | "delete") => {
    if (action === 'delete') {
        await Promise.all(selectedIds.map(id => deletePost(id)));
        toast.success(`${selectedIds.length} posts deleted.`);
    } else {
        await bulkUpdatePostStatus(selectedIds, action === 'publish');
        toast.success(`${selectedIds.length} posts updated.`);
    }
    clearSelections();
    // Refresh data
    const params = { query, status, sort, page, pageSize };
    getPosts(params).then(({ posts, total }: { posts: BlogPost[], total: number }) => {
      setPosts(posts);
      setTotal(total);
    });
  };

  const onRow = async (id: string, action: "edit" | "publish" | "unpublish" | "delete" | "preview") => {
    if (action === 'delete') {
        await deletePost(id);
        toast.success("Post deleted.");
    } else if (action === 'publish' || action === 'unpublish') {
        await bulkUpdatePostStatus([id], action === 'publish');
        toast.success("Post status updated.");
    } else if (action === 'edit') {
        replace(`/admin/blog/edit/${id}`);
    }
    // Refresh data
    const params = { query, status, sort, page, pageSize };
    getPosts(params).then(({ posts, total }: { posts: BlogPost[], total: number }) => {
      setPosts(posts);
      setTotal(total);
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-neutral-900 dark:text-gray-100">
      <div className="container mx-auto px-4 lg:px-6 pt-28 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Blog Admin</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Create, edit, and publish posts.</p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/admin/blog/new">
              <Plus className="h-4 w-4" />
              New Post
            </Link>
          </Button>
        </div>

        {/* Toolbar */}
        <div className="rounded-xl border border-black/5 dark:border-white/10 bg-gray-50 dark:bg-neutral-800 p-3 sm:p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search title or slug…"
                defaultValue={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 h-9 bg-white dark:bg-neutral-900"
              />
            </div>

            {/* Status filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 gap-2">
                  <Filter className="h-4 w-4" />
                  {status === "all" ? "All statuses" : status}
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-44">
                {["all", "draft", "published"].map((s) => (
                  <DropdownMenuItem key={s} onClick={() => handleFilterChange("status", s)}>
                    {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9">
                  Sort: {sort.replace("-", " ")} <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuItem onClick={() => handleFilterChange("sort", "updated_at-desc")}>Updated ↓ (newest)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange("sort", "updated_at-asc")}>Updated ↑ (oldest)</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleFilterChange("sort", "title-asc")}>Title A → Z</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange("sort", "title-desc")}>Title Z → A</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Bulk bar */}
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
                  <Button size="sm" variant="destructive" onClick={() => onBulk("delete")} className="h-8">
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
                <Button size="sm" variant="ghost" onClick={clearSelections} className="h-8 ml-auto">
                  Clear
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Empty state */}
        {posts.length === 0 && !isLoading ? (
          <div className="text-center py-20">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              No posts match your filters.
            </p>
            <Button asChild>
              <Link href="/admin/blog/new">
                <Plus className="h-4 w-4 mr-2" />
                Create your first post
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block mt-4 overflow-hidden rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-neutral-800/60 text-gray-600 dark:text-gray-300">
                  <tr>
                    <th className="w-10 p-3 text-left">
                      <button
                        aria-label={allSelectedOnPage ? "Deselect all" : "Select all"}
                        onClick={toggleSelectAll}
                        className="text-gray-600 hover:text-gray-900 dark:hover:text-white"
                      >
                        {allSelectedOnPage ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      </button>
                    </th>
                    <th className="p-3 text-left">Title</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Author</th>
                    <th className="p-3 text-left">Updated</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                  {posts.map((p) => (
                    <tr key={p.id} className="align-top">
                      <td className="p-3">
                        <button
                          aria-label={selected[p.id] ? "Deselect post" : "Select post"}
                          onClick={() => setSelected((s) => ({ ...s, [p.id]: !s[p.id] }))}
                          className="text-gray-600 hover:text-gray-900 dark:hover:text-white"
                        >
                          {selected[p.id] ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-gray-500">{p.slug}</div>
                      </td>
                      <td className="p-3">
                        <StatusPill status={p.published ? 'published' : 'draft'} />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <User2 className="h-4 w-4 opacity-70" />
                          {p.author_name}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{formatDate(p.updated_at)}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <IconButton label="Preview" onClick={() => onRow(p.id, "preview")}><Eye className="h-4 w-4" /></IconButton>
                          <IconButton label="Edit" onClick={() => onRow(p.id, "edit")}><Pencil className="h-4 w-4" /></IconButton>
                          {p.published ? (
                            <IconButton label="Unpublish" onClick={() => onRow(p.id, "unpublish")}><PauseCircle className="h-4 w-4" /></IconButton>
                          ) : (
                            <IconButton label="Publish" onClick={() => onRow(p.id, "publish")}><UploadCloud className="h-4 w-4" /></IconButton>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onRow(p.id, "preview")}>
                                <Globe className="h-4 w-4 mr-2" /> View public
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => onRow(p.id, "delete")}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="text-gray-600 dark:text-gray-400">
                Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span>–
                <span className="font-medium">{Math.min(page * pageSize, total)}</span> of{" "}
                <span className="font-medium">{total}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => handleFilterChange("page", String(page - 1))}
                  className="h-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => handleFilterChange("page", String(page + 1))}
                  className="h-8"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---- Small bits ----
function IconButton({
  children,
  label,
  onClick,
  destructive,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  destructive?: boolean;
}) {
  return (
    <Button
      variant={destructive ? "destructive" : "ghost"}
      size="icon"
      className={clsx(
        "h-8 w-8",
        destructive
          ? ""
          : "hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-200"
      )}
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
