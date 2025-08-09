import PostForm from "../components/PostForm";
import { createPost } from "../actions";

export default function NewPostPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create New Post</h1>
      <PostForm action={createPost} />
    </div>
  );
}
