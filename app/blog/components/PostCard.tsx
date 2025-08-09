import Link from "next/link";
import Image from "next/image";
import { BlogPost } from "@/lib/schema";
import { Calendar, User2 } from "lucide-react";

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <div className="overflow-hidden rounded-lg bg-white dark:bg-neutral-800 shadow-md group-hover:shadow-xl transition-shadow duration-300">
        {post.image_url && (
          <div className="aspect-video overflow-hidden">
            <Image
              src={post.image_url}
              alt={post.title}
              width={400}
              height={225}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-6">
          <h2 className="text-xl font-bold leading-tight mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {post.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
            <div className="flex items-center gap-2">
              <User2 className="h-4 w-4" />
              <span>{post.author_name || "Zevlin Team"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={post.published_at ?? ""}>
                {formatDate(post.published_at)}
              </time>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
