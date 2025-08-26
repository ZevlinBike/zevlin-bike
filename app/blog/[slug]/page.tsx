
import { notFound } from "next/navigation";
import Image from "next/image";
import { getPostBySlug } from "../actions";
import { Calendar, User2 } from "lucide-react";
import MainLayout from "@/app/components/layouts/MainLayout";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "@/markdown-styles.module.css";

// optional: clean weird placeholders/spacings if your content has them
function cleanMarkdown(src = "") {
  return src
    .replace(/:contentReference\[[^\]]*?\](?:\{[^}]*\})?/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const body = cleanMarkdown(post.body);

  return (
    <MainLayout>
      <div className="pt-40">
        <article className="container mx-auto max-w-4xl px-4 py-12 sm:py-16 lg:py-20">
          <header className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              {post.title}
            </h1>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <User2 className="h-4 w-4" />
                <span>{post.author_name || "Zevlin Team"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time dateTime={post.published_at ?? ""}>{formatDate(post.published_at)}</time>
              </div>
            </div>
          </header>

          {post.image_url && (
            <div className="mb-8 overflow-hidden rounded-lg">
              <Image
                src={post.image_url}
                alt={post.title}
                width={1200}
                height={675}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          )}

          <div className={styles.markdown}>
            {post.excerpt && <p className="lead">{post.excerpt}</p>}

            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
              }}
            >
              {body}
            </ReactMarkdown>
          </div>
        </article>
      </div>
    </MainLayout>
  );
}
