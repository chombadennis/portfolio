
// lib/models/Post.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";

// Define the Post interface
export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_url?: string;
  author_name: string;
  published: boolean;
  createdAt: string | Timestamp;
  updatedAt: string | Timestamp;
  created_at: string;
  updated_at: string;
  category: string;
  content_background?: string;
  content_font?: string;
}

const postsCollection = collection(firestore, "posts");

// Helper to convert Firestore Timestamps to ISO strings and map doc id
const serializeDoc = (doc: DocumentSnapshot<DocumentData>): Post => {
  const data = doc.data() || {};
  const id = doc.id;

  const serializedData: any = { id };

  for (const key in data) {
    const value = data[key];
    if (value instanceof Timestamp) {
      serializedData[key] = value.toDate().toISOString();
    } else {
      serializedData[key] = value;
    }
  }

  if (serializedData.createdAt) {
    serializedData.created_at = serializedData.createdAt instanceof Timestamp
        ? serializedData.createdAt.toDate().toISOString()
        : serializedData.createdAt;
  } else {
    serializedData.created_at = new Date().toISOString();
  }

  if (serializedData.updatedAt) {
    serializedData.updated_at = serializedData.updatedAt instanceof Timestamp
        ? serializedData.updatedAt.toDate().toISOString()
        : serializedData.updatedAt;
  } else {
    serializedData.updated_at = new Date().toISOString();
  }

  return {
    id: serializedData.id,
    title: serializedData.title || "",
    slug: serializedData.slug || "",
    content: serializedData.content || "",
    excerpt: serializedData.excerpt || "",
    featured_image_url: serializedData.featured_image_url || "",
    author_name: serializedData.author_name || "Dennis Munene",
    published: serializedData.published === true,
    createdAt: serializedData.createdAt,
    updatedAt: serializedData.updatedAt,
    created_at: serializedData.created_at,
    updated_at: serializedData.updated_at, // Corrected typo here
    category: serializedData.category || "Uncategorized",
    content_background: serializedData.content_background || "#ffffff",
    content_font: serializedData.content_font || "'Roboto', sans-serif",
  } as Post;
};

export const PostModel = {
  async find(filter: Record<string, any> = {}, projection = "", sort: Record<string, 1 | -1> = { createdAt: -1 }): Promise<Partial<Post>[]> {
    const conditions = Object.entries(filter).map(([key, value]) => where(key, "==", value));
    const sortKey = Object.keys(sort)[0] || 'createdAt';
    const sortDirection = sort[sortKey] === -1 ? 'desc' : 'asc';
    
    const q = query(postsCollection, ...conditions, orderBy(sortKey, sortDirection));

    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(serializeDoc);

    if (!projection) {
      return posts;
    }

    const fieldsToKeep = projection.split(' ');
    return posts.map(post => {
      const projectedPost: Partial<Post> = { id: post.id };
      fieldsToKeep.forEach(field => {
        const key = field as keyof Post;
        if (key in post) {
          projectedPost[key] = post[key] as any; // Use 'as any' to bypass the complex type issue for this specific assignment
        }
      });
      return projectedPost;
    });
  },

  async findById(id: string): Promise<Post | null> {
    if (!id) return null;
    const docRef = doc(firestore, "posts", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return serializeDoc(docSnap);
    } else {
      return null;
    }
  },

  async findOne({ slug }: { slug: string }): Promise<Post | null> {
    const q = query(postsCollection, where("slug", "==", slug), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    return serializeDoc(querySnapshot.docs[0]);
  },

  async create(data: Partial<Post>): Promise<Post> {
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(postsCollection, docData);
    const newPost = await this.findById(docRef.id);
    if (!newPost) {
        throw new Error("Failed to create and retrieve post.");
    }
    return newPost;
  },
  
  async findByIdAndUpdate(id: string, data: Partial<Post>): Promise<Post | null> {
    if (!id) return null;
    const docRef = doc(firestore, "posts", id);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(docRef, updateData);
    return this.findById(id);
  },

  async findByIdAndDelete(id: string): Promise<Post | null> {
    if (!id) return null;
    const docRef = doc(firestore, "posts", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    const deletedData = serializeDoc(docSnap);
    await deleteDoc(docRef);
    return deletedData;
  },
};