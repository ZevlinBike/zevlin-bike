import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PostForm from "../../components/PostForm";
import { updatePost } from "../../actions";
import { BlogPost } from "@/lib/schema";
import { Button } from "@/components/ui/button";

async function getPostById(id: string): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching post by id:", error);
    return null;
  }
  return data;
}

type EditPostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Edit Post</h1>
        <Button asChild variant="secondary" className="gap-2">
          <Link href={`/admin/blog/assist?from=${id}`}>Edit with BlogAssist</Link>
        </Button>
      </div>
      <PostForm action={updatePost} post={post} />
    </div>
  );
}
