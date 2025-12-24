"use client";

import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect, useActionState, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { BlogPost } from "@/lib/schema";
import { State } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="gap-2" id="blog-form-submit">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? "Saving…" : "Save Post"}
    </Button>
  );
}

function slugify(v: string) {
  return v.toLowerCase().trim().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

export default function PostForm({
  action,
  post,
}: {
  action: (prevState: State, formData: FormData) => Promise<State>;
  post?: BlogPost;
}) {
  const router = useRouter();
  const initialState = { message: null, errors: {} as Record<string, string | undefined> };
  const [state, dispatch] = useActionState(action, initialState);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!post?.slug);
  const [published, setPublished] = useState<boolean>(post?.published ?? false);
  const [body, setBody] = useState(post?.body ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [author, setAuthor] = useState(post?.author_name ?? "Zevlin Team");

  // Image upload state
  const [file, setFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  // Preview URL: file > existing
  const previewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return post?.image_url ?? ""; // show existing if any
  }, [file, post?.image_url]);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  useEffect(() => {
    if (!state.message) return;
    if (state.errors && Object.keys(state.errors).length > 0) {
      toast.error(state.message);
    } else {
      toast.success(state.message);
      router.push("/admin/blog");
    }
  }, [state, router]);

  const onKeydown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      (document.getElementById("blog-form-submit") as HTMLButtonElement)?.click();
    }
  }, []);
  useEffect(() => {
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [onKeydown]);

  

  return (
    <form
      action={dispatch}
      className="max-w-4xl space-y-6 pb-24"
    >
      {post && <input type="hidden" name="id" value={post.id} />}

      {/* Sticky top bar */}
      <div className="sticky top-16 z-10 -mx-2 sm:mx-0 bg-white/85 dark:bg-neutral-900/85 backdrop-blur px-2 sm:px-0 py-2 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">{post ? "Edit Post" : "New Post"}</div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            {/* Mirror switch value so it submits */}
            <input type="hidden" name="published" value={published ? "true" : "false"} />
            {/* Remove image flag (if user toggles) */}
            {post?.image_url && (
              <input type="hidden" name="remove_image" value={removeImage ? "true" : "false"} />
            )}
            <SubmitButton />
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 gap-6">
        {/* Title / Slug */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1" />
            {state.errors?.title && <p className="mt-1 text-sm text-red-500">{state.errors.title}</p>}
          </div>
          <div className="sm:col-span-1">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              required
              className="mt-1 font-mono text-[13px]"
            />
            {state.errors?.slug && <p className="mt-1 text-sm text-red-500">{state.errors.slug}</p>}
          </div>
        </div>

        {/* Image upload + preview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label htmlFor="image">Cover Image</Label>
            <div
              className="
                mt-1 rounded-lg border border-dashed border-black/15 dark:border-white/15
                bg-white dark:bg-neutral-900 p-3
              "
            >
              <Input
                id="image"
                name="image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  if (f) setRemoveImage(false); // replacing => not removing
                }}
                className="file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:text-sm file:font-medium hover:file:bg-gray-200 dark:file:bg-neutral-800 dark:hover:file:bg-neutral-700"
              />
              <p className="mt-2 text-[12px] text-gray-500">
                webp/JPG, up to ~5MB. Uploading a new file replaces the existing image.
              </p>

              {/* Remove existing option */}
              {post?.image_url && !file && (
                <label className="mt-3 inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="remove_image"
                    className="h-4 w-4"
                    checked={removeImage}
                    onChange={(e) => setRemoveImage(e.target.checked)}
                  />
                  Remove existing image
                </label>
              )}
            </div>
            {state.errors?.image_url && <p className="mt-1 text-sm text-red-500">{state.errors.image_url}</p>}
          </div>

          <div className="sm:col-span-1">
            <Label className="sr-only">Preview</Label>
            <div className="mt-1 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 overflow-hidden aspect-[16/9] grid place-items-center">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Cover preview"
                  className="h-full w-full object-cover"
                  onLoad={() => file && URL.revokeObjectURL(previewUrl)}
                />
              ) : (
                <div className="text-xs text-gray-500">No image</div>
              )}
            </div>
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea id="excerpt" name="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="mt-1" rows={3} />
        </div>

        {/* Body + Meta */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Label htmlFor="body">Body</Label>
            <Textarea id="body" name="body" required value={body} onChange={(e) => setBody(e.target.value)} className="mt-1" rows={14} />
            {state.errors?.body && <p className="mt-1 text-sm text-red-500">{state.errors.body}</p>}
            <div className="mt-1 flex items-center justify-between text-[12px] text-gray-500">
              <span>Markdown supported</span>
              <span className="tabular-nums">
                {body ? body.trim().split(/\s+/).length : 0} words • {body.length} chars
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-black/5 dark:border-white/10 bg-gray-50 dark:bg-neutral-800 p-4 shadow-sm space-y-4">
            <div>
              <Label htmlFor="author_name">Author</Label>
              <Input id="author_name" name="author_name" value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="published" className="cursor-pointer">
                  Published
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Toggle to make the post visible.
                </p>
              </div>
              <Switch id="published" checked={published} onCheckedChange={setPublished} />
            </div>
          </div>
        </div>

        {/* Bottom actions (desktop) */}
        <div className="hidden sm:flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <SubmitButton />
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div
        className="sm:hidden fixed left-0 right-0 bottom-0 z-10 border-t bg-white/95 dark:bg-neutral-900/95 backdrop-blur px-3 py-2 flex items-center justify-end gap-2"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}

