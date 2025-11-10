
// app/api/posts/[id]/route.ts
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { initializeApp, getApps, App, cert } from "firebase-admin/app";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";
import { getFirestore, CollectionReference, DocumentData, FieldValue, Firestore } from "firebase-admin/firestore";

// --- START: Robust Firebase Admin Initialization ---
let adminApp: App;
let db: Firestore;
let postsCollection: CollectionReference<DocumentData>;
let initError: Error | null = null;

try {
  const serviceAccountKey = process.env.APP_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error("APP_SERVICE_ACCOUNT_KEY environment variable is not set.");
  }

  const serviceAccount = JSON.parse(serviceAccountKey);

  if (!getApps().length) {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    adminApp = getApps()[0];
  }

  db = getFirestore(adminApp);
  postsCollection = db.collection("posts");

} catch (e: any) {
  console.error("Firebase Admin SDK Initialization Error:", e);
  initError = e;
}
// --- END: Robust Firebase Admin Initialization ---

interface PostUpdateBody {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  featured_image_url?: string;
  published?: boolean;
  category?: string;
  content_background?: string;
  content_font?: string;
}

const ALLOWED_EMAIL = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL || "").toLowerCase();

async function getIsAdmin(req: Request): Promise<[boolean, DecodedIdToken | null]> {
    if (initError) return [false, null];

    const authorization = req.headers.get("authorization");
    if (authorization) {
        const token = authorization.split("Bearer ")[1];
        try {
            const decodedToken = await getAuth(adminApp).verifyIdToken(token);
            const isAdmin = !!decodedToken.email && decodedToken.email.toLowerCase() === ALLOWED_EMAIL;
            return [isAdmin, decodedToken];
        } catch (error) {
            console.warn("Token verification failed:", error);
            return [false, null];
        }
    }
    return [false, null];
}

const handleInitError = () => {
    return NextResponse.json({
        error: "Server configuration error.",
        details: "Firebase Admin SDK failed to initialize. Check server logs."
    }, { status: 500 });
}

// GET a single post
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (initError) return handleInitError();
  
  try {
    const docRef = postsCollection.doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const data = doc.data()!;
    const responseData = {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as FirebaseFirestore.Timestamp)?.toDate().toISOString(),
        updatedAt: (data.updatedAt as FirebaseFirestore.Timestamp)?.toDate().toISOString(),
    };

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error(`Failed to get post ${params.id}:`, err);
    return NextResponse.json({ error: "Failed to fetch post", details: err.message }, { status: 500 });
  }
}

// UPDATE a post
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (initError) return handleInitError();
  
  const [isAdmin] = await getIsAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as PostUpdateBody;
    const docRef = postsCollection.doc(params.id);

    // Ensure slug is unique if it'''s being changed
    if (body.slug) {
        const existing = await postsCollection.where("slug", "==", body.slug).get();
        if (!existing.empty && existing.docs.some(doc => doc.id !== params.id)) {
            return NextResponse.json({ error: "Slug already exists", details: `Another post is already using the slug '${body.slug}'.` }, { status: 409 });
        }
    }

    const updateData = {
      ...body,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await docRef.update(updateData);
    const updatedDoc = await docRef.get();
    const data = updatedDoc.data()!;
    
    // Revalidate paths
    revalidateTag("posts");
    revalidatePath("/blog");
    if (data.slug) {
        revalidatePath(`/blog/${data.slug}`);
    }

    // Prepare response data with converted timestamps
    const responseData = {
        id: updatedDoc.id,
        ...data,
        createdAt: (data.createdAt as FirebaseFirestore.Timestamp)?.toDate().toISOString(),
        updatedAt: (data.updatedAt as FirebaseFirestore.Timestamp)?.toDate().toISOString(),
        created_at: (data.createdAt as FirebaseFirestore.Timestamp)?.toDate().toISOString(), // maintain consistency
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (err: any) {
    console.error(`Failed to update post ${params.id}:`, err);
    if(err.code === 5) { // Firestore "NOT_FOUND" error code
        return NextResponse.json({ error: "Post not found", details: `The post with ID ${params.id} does not exist.` }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update post", details: err.message }, { status: 500 });
  }
}

// DELETE a post
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (initError) return handleInitError();

  const [isAdmin] = await getIsAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const docRef = postsCollection.doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    const { slug } = doc.data()!;
    
    await docRef.delete();

    // Revalidate paths to reflect deletion
    revalidateTag("posts");
    revalidatePath("/blog");
    if (slug) {
      revalidatePath(`/blog/${slug}`);
    }

    return new NextResponse(null, { status: 204 }); // Success, no content
  } catch (err: any) {
    console.error(`Failed to delete post ${params.id}:`, err);
    return NextResponse.json({ error: "Failed to delete post", details: err.message }, { status: 500 });
  }
}
