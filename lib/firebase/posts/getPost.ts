
// lib/firebase/posts/getPost.ts
import { PostModel, Post } from "@/lib/models/Post";

export async function getPost(slug: string): Promise<Post | null> {
  try {
    const post = await PostModel.findOne({ slug });
    return post;
  } catch (error) {
    console.error(`Error fetching post with slug: ${slug}`, error);
    return null;
  }
}

export async function getPublishedPosts(): Promise<Post[]> {
    try {
        // Assert the type to Post[] as we are not using projection and know the full object is returned.
        const posts = await PostModel.find({ published: true }) as Post[];

        // With the correct type, we can now safely sort the posts.
        // The `created_at` property is guaranteed to be a string by the `serializeDoc` helper.
        posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return posts;
    } catch (error) {
        console.error('Error fetching published posts', error);
        return [];
    }
}
