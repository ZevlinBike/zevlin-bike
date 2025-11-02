import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "@/markdown-styles.module.css";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

function cleanMarkdown(src = "") {
  return src
    .replace(/:contentReference\[[^\]]*?\](?:\{[^}]*\})?/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/<sub>([\s\S]*?)<\/sub>/gi, '_$1_');
}

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default async function AdminBlogPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !post) notFound();

  const body = cleanMarkdown(post.body || "");

  return (
    <div className="pt-24 pb-12">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/blog"><ChevronLeft className="h-4 w-4 mr-1" /> Back</Link>
            </Button>
            <div className="text-xs text-gray-500">
              Previewing {post.published ? "published post" : "draft"} • Last updated {formatDate(post.updated_at)}
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/blog/edit/${post.id}`}>Edit</Link>
            </Button>
            {post.published && (
              <Button asChild size="sm">
                <Link href={`/blog/${post.slug}`} target="_blank">View Public</Link>
              </Button>
            )}
          </div>
        </div>

        <article>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            {post.title}
          </h1>
          <div className="mb-6 text-sm text-gray-500">By {post.author_name || "Zevlin Team"} • {formatDate(post.published_at || post.updated_at)}</div>

          {post.image_url && (
            <div className="mb-8 overflow-hidden rounded-lg">
              <Image src={post.image_url} alt={post.title} width={1200} height={675} className="w-full h-auto object-cover" />
            </div>
          )}

          <div className={styles.markdown}>
            {post.excerpt && <p className="lead">{post.excerpt}</p>}
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}>
              {body}
            </ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  );
}
