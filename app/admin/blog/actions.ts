"use server";

import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { BlogPost } from "@/lib/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const FormSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    slug: z.string().min(1, "Slug is required"),
    excerpt: z.string().optional(),
    body: z.string().min(1, "Body is required"),
    author_name: z.string().optional(),
    published: z.preprocess((val) => val === 'true', z.boolean()),
    remove_image: z.preprocess((val) => val === 'true', z.boolean()).optional(),
});

export type State = {
  errors?: {
    title?: string[];
    slug?: string[];
    body?: string[];
    image_url?: string[];
  };
  message?: string | null;
};

async function handleImageUpload(
  supabase: SupabaseClient,
  imageFile: File | null,
  slug: string,
  currentImageUrl?: string | null
): Promise<string | null> {
  if (!imageFile || imageFile.size === 0) {
    return currentImageUrl || null;
  }

  const newPath = `public/${slug}-${Date.now()}-${imageFile.name}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("blog")
    .upload(newPath, imageFile, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error("Storage Error:", uploadError);
    throw new Error("Storage Error: Failed to upload image.");
  }

  // If there was an old image and the new one has a different path, remove the old one.
  if (currentImageUrl) {
      const oldPath = currentImageUrl.split('/').pop();
      if (oldPath && oldPath !== newPath.split('/').pop()) {
        await supabase.storage.from("blog").remove([`public/${oldPath}`]);
      }
  }

  const { data: urlData } = supabase.storage.from("blog").getPublicUrl(uploadData.path);
  return urlData.publicUrl;
}


export async function createPost(prevState: State, formData: FormData): Promise<State> {
    const supabase = await createClient();
    const rawFormData = Object.fromEntries(formData.entries());
    
    const validatedFields = FormSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation Error: Failed to create post.",
        };
    }

    const { title, slug, excerpt, body, author_name, published } = validatedFields.data;
    const imageFile = formData.get("image") as File | null;

    try {
        const imageUrl = await handleImageUpload(supabase, imageFile, slug);

        const { error } = await supabase.from("blog_posts").insert({
            title,
            slug,
            excerpt,
            body,
            image_url: imageUrl,
            author_name,
            published,
            published_at: published ? new Date().toISOString() : null,
        });

        if (error) throw error;

        revalidatePath("/admin/blog");
        return { message: "Successfully created post." };

    } catch (error) {
        console.error("Create Post Error:", error);
        return { message: (error as Error).message || "Database Error: Failed to create post." };
    }
}

export async function updatePost(prevState: State, formData: FormData): Promise<State> {
    const supabase = await createClient();
    const rawFormData = Object.fromEntries(formData.entries());

    const validatedFields = FormSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation Error: Failed to update post.",
        };
    }

    const { id, title, slug, excerpt, body, author_name, published, remove_image } = validatedFields.data;
    
    if (!id) return { message: "Error: Post ID is missing." };

    const imageFile = formData.get("image") as File | null;

    try {
        const { data: existingPost, error: fetchError } = await supabase
            .from("blog_posts")
            .select("image_url")
            .eq("id", id)
            .single();

        if (fetchError) throw fetchError;

        let imageUrl: string | null | undefined = existingPost?.image_url;

        if (remove_image && imageUrl) {
            const oldPath = imageUrl.split('/').pop();
            if(oldPath) await supabase.storage.from("blog").remove([`public/${oldPath}`]);
            imageUrl = null;
        } else {
            imageUrl = await handleImageUpload(supabase, imageFile, slug, imageUrl);
        }

        const { error } = await supabase
            .from("blog_posts")
            .update({
                title,
                slug,
                excerpt,
                body,
                image_url: imageUrl,
                author_name,
                published,
                published_at: published && !existingPost?.image_url ? new Date().toISOString() : (published ? undefined : null),
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/admin/blog");
        revalidatePath(`/admin/blog/edit/${id}`);
        return { message: "Successfully updated post." };

    } catch (error) {
        console.error("Update Post Error:", error);
        return { message: (error as Error).message || "Database Error: Failed to update post." };
    }
}

export async function getPosts(params: {
  query?: string;
  status?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ posts: BlogPost[]; total: number }> {
  const supabase = await createClient();
  let queryBuilder = supabase.from("blog_posts").select("*", { count: "exact" });

  if (params.query) {
    queryBuilder = queryBuilder.or(`title.ilike.%${params.query}%,slug.ilike.%${params.query}%`);
  }

  if (params.status && params.status !== "all") {
    if (params.status === 'published') {
        queryBuilder = queryBuilder.eq('published', true);
    } else if (params.status === 'draft') {
        queryBuilder = queryBuilder.eq('published', false);
    }
  }
  
  // Sorting
  const sort = params.sort || "updated_at-desc";
  const [sortField, sortDir] = sort.split("-");
  const ascending = (sortDir || "desc").toLowerCase() === "asc";
  // Restrict sortable fields to known columns to satisfy typing and avoid injection
  const allowedSortFields = new Set([
    "updated_at",
    "created_at",
    "title",
    "published_at",
  ]);
  const resolvedField = allowedSortFields.has(sortField)
    ? (sortField as "updated_at" | "created_at" | "title" | "published_at")
    : ("updated_at" as const);
  queryBuilder = queryBuilder.order(resolvedField, { ascending, nullsFirst: false });

  // Pagination
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.max(1, Math.min(100, Number(params.pageSize) || 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  queryBuilder = queryBuilder.range(from, to);

  const { data, error, count } = await queryBuilder;

  if (error) {
    console.error("Error fetching posts:", error);
    return { posts: [], total: 0 };
  }

  return { posts: data, total: count ?? 0 };
}

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", postId);

  if (error) {
    return { message: "Database Error: Failed to Delete Post." };
  }

  revalidatePath("/admin/blog");
  return { message: "Successfully deleted post." };
}

export async function bulkUpdatePostStatus(postIds: string[], published: boolean) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("blog_posts")
        .update({
            published,
            published_at: published ? new Date().toISOString() : null,
        })
        .in("id", postIds);

    if (error) {
        return { message: "Database Error: Failed to update posts." };
    }

    revalidatePath("/admin/blog");
    return { message: "Successfully updated posts." };
}

type ViewCountRow = { slug: string; views: number };

export async function getPostViewsForSlugs(slugs: string[]): Promise<Record<string, number>> {
  if (!slugs || slugs.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analytics_view_counts")
    .select("slug, views")
    .eq("type", "post")
    .in("slug", slugs);

  if (error) {
    console.error("Error fetching views for slugs:", error);
    return {};
  }

  const map: Record<string, number> = {};
  (data || []).forEach((r: ViewCountRow) => {
    map[r.slug] = (map[r.slug] || 0) + (r.views || 0);
  });
  return map;
}
