
import { db } from '@/lib/firebase/admin';
import { Post } from '@/lib/models/Post';

/**
 * Fetches all published posts from Firestore using the Firebase Admin SDK.
 * This function is intended for server-side use only.
 *
 * @returns {Promise<Post[]>} A promise that resolves to an array of published posts.
 */
export async function getPublishedPostsAdmin(): Promise<Partial<Post>[]> {
  try {
    const postsCollection = db.collection('posts');
    const snapshot = await postsCollection.where('published', '==', true).orderBy('createdAt', 'desc').get();

    if (snapshot.empty) {
      console.log('No published posts found.');
      return [];
    }

    // Map the documents to the Post interface, retaining only necessary fields for the context
    const posts: Partial<Post>[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
      };
    });

    return posts;
  } catch (error) {
    console.error('Error fetching published posts with admin SDK:', error);
    // In case of an error, return an empty array to prevent the entire chat API from failing.
    // The AI will see that there are no posts and can respond accordingly.
    return [];
  }
}
