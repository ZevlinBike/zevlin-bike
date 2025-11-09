import Link from "next/link";
import { getPublishedPosts } from "../actions";

export default async function RelatedPosts({ currentSlug }: { currentSlug: string }) {
  const posts = await getPublishedPosts();
  const related = posts.filter((p) => p.slug !== currentSlug).slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section aria-label="Related posts" className="mt-12 border-t pt-8">
      <h2 className="text-xl font-semibold mb-4">You Might Also Like</h2>
      <ul className="grid gap-4 md:grid-cols-3">
        {related.map((p) => (
          <li key={p.id} className="group">
            <Link href={`/blog/${p.slug}`} className="block">
              <div className="text-base font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {p.title}
              </div>
              {p.excerpt && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{p.excerpt}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

