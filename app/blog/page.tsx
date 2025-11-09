import MainLayout from "@/app/components/layouts/MainLayout";
import { getPublishedPosts, getPostViewsForSlugs } from "./actions";
import PostCard from "./components/PostCard";

export default async function BlogPage() {
  const posts = await getPublishedPosts();
  const viewsBySlug = await getPostViewsForSlugs(posts.map((p) => p.slug));

  return (
    <MainLayout>
    <div className="mx-auto px-4 pt-40">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          The Zevlin Blog
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500 dark:text-gray-400">
          News, stories, and insights from the saddle.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-gray-500">No posts have been published yet. Check back soon!</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} views={viewsBySlug[post.slug] || 0} />
          ))}
        </div>
      )}
    </div>
    </MainLayout>
  );
}
