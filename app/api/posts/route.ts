
// app/api/posts/route.ts
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { initializeApp, getApps, App, cert } from "firebase-admin/app";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";
import { getFirestore, CollectionReference, DocumentData, FieldValue, Firestore, Query } from "firebase-admin/firestore";

// --- START: Lazy Firebase Admin Initialization ---
let adminApp: App | undefined;
let auth: ReturnType<typeof getAuth> | undefined;
let db: Firestore | undefined;

function initializeFirebaseAdmin() {
    if (getApps().length === 0) {
        const serviceAccountKey = process.env.APP_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountKey) {
            throw new Error("APP_SERVICE_ACCOUNT_KEY environment variable is not set.");
        }
        const serviceAccount = JSON.parse(serviceAccountKey);
        adminApp = initializeApp({
            credential: cert(serviceAccount),
        });
    } else {
        adminApp = getApps()[0];
    }
    auth = getAuth(adminApp);
    db = getFirestore(adminApp);
}
// --- END: Lazy Firebase Admin Initialization ---


interface PostCreateBody {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  author_name?: string;
  published?: boolean;
  category?: string;
}

const ALLOWED_EMAIL = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL || "").toLowerCase();

async function getIsAdmin(req: Request): Promise<[boolean, DecodedIdToken | null]> {
    if (!auth) {
        // This should not happen if initializeFirebaseAdmin is called first
        return [false, null];
    }

    const authorization = req.headers.get("authorization");
    if (authorization) {
        const token = authorization.split("Bearer ")[1];
        try {
            const decodedToken = await auth.verifyIdToken(token);
            const isAdmin = !!decodedToken.email && decodedToken.email.toLowerCase() === ALLOWED_EMAIL;
            return [isAdmin, decodedToken];
        } catch (error) {
            console.error("Error verifying token:", error);
            return [false, null];
        }
    }
    return [false, null];
}

const handleInitError = (e: Error) => {
    console.error("Firebase Admin SDK Initialization Error:", e);
    return NextResponse.json({
        error: "Server configuration error.",
        details: "Firebase Admin SDK failed to initialize. " + e.message
    }, { status: 500 });
}

export async function GET(req: Request) {
  try {
    initializeFirebaseAdmin();
  } catch (e: any) {
    return handleInitError(e);
  }

  const [isAdmin] = await getIsAdmin(req);
  let query: Query<DocumentData> = db!.collection("posts");

  if (!isAdmin) {
    query = query.where("published", "==", true);
  }

  try {
    const snapshot = await query.orderBy("createdAt", "desc").get();
    const posts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
            created_at: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        };
    });
    return NextResponse.json(posts);
  } catch(e: any) {
      console.error("Error fetching posts:", e);
      if (e.message?.includes("Cloud Firestore API has not been used")) {
          return NextResponse.json({
              error: "Firestore is not enabled in your Firebase project.",
              details: "Please go to the Firebase Console, select your project, and click 'Create database' in the Firestore Database section."
          }, { status: 500 });
      }
      return NextResponse.json({ error: "Failed to fetch posts", details: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
    try {
        initializeFirebaseAdmin();
    } catch (e: any) {
        return handleInitError(e);
    }
    
    const postsCollection = db!.collection("posts");
    const [isAdmin, user] = await getIsAdmin(req);
    if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as PostCreateBody;
    const slug = (body.slug || body.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    try {
        const existingPostQuery = await postsCollection.where("slug", "==", slug).limit(1).get();
        if (!existingPostQuery.empty) {
            return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
        }

        const newPostData = {
        ...body,
        slug,
        author_name: body.author_name || user?.email || "Admin",
        published: body.published ?? false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        };

        const docRef = await postsCollection.add(newPostData);
        const newDoc = await docRef.get();
        const data = newDoc.data()!;

        // Timestamps need to be converted after fetching
        const createdAt = (data.createdAt as FirebaseFirestore.Timestamp).toDate().toISOString();
        const updatedAt = (data.updatedAt as FirebaseFirestore.Timestamp).toDate().toISOString();

        const responseData = {
            id: newDoc.id,
            ...data,
            createdAt,
            updatedAt,
            created_at: createdAt,
        };

        revalidateTag("posts");
        revalidatePath("/blog");
        revalidatePath(`/blog/${slug}`);

        return NextResponse.json(responseData, { status: 201 });
    } catch (err: any) {
        console.error("Failed to create post:", err);
        if (err.message?.includes("Cloud Firestore API has not been used")) {
            return NextResponse.json({
                error: "Firestore is not enabled in your Firebase project.",
                details: "Please go to the Firebase Console, select your project, and click 'Create database' in the Firestore Database section."
            }, { status: 500 });
        }
        return NextResponse.json({ error: "Failed to create post", details: err.message }, { status: 500 });
    }
}
