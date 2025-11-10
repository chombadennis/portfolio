
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

interface FirebaseServices {
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

// A global variable to cache the Firebase services
let firebaseServices: FirebaseServices | undefined;

function initializeFirebaseServices(): FirebaseServices {
  if (typeof window === "undefined") {
    // Server-side initialization
    if (!firebaseServices) {
      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      firebaseServices = {
        app,
        firestore: getFirestore(app),
        auth: getAuth(app),
        storage: getStorage(app),
      };
    }
    return firebaseServices;
  } else {
    // Client-side initialization
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    return {
      app,
      firestore: getFirestore(app),
      auth: getAuth(app),
      storage: getStorage(app),
    };
  }
}

const { app, firestore, auth, storage } = initializeFirebaseServices();

export { app, firestore, auth, storage };
