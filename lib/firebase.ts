
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

// Helper function to initialize and cache Firebase services
function getFirebaseServices(): FirebaseServices {
  // In a serverless environment, we can cache the services in a global variable
  // to ensure they are reused across function invocations.
  if (global._firebaseServices) {
    return global._firebaseServices;
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const services = {
    app,
    firestore: getFirestore(app),
    auth: getAuth(app),
    storage: getStorage(app),
  };

  global._firebaseServices = services;

  return services;
}

const { app, firestore, auth, storage } = getFirebaseServices();

export { app, firestore, auth, storage };

// Extend the NodeJS.Global interface to include our cached services for TypeScript
declare global {
  var _firebaseServices: FirebaseServices | undefined;
}
