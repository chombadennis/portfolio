
import admin from 'firebase-admin';

// Check if the service account is available in environment variables
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
}

// Check if the app is already initialized to prevent re-initialization
if (!admin.apps.length) {
  try {
    // Parse the service account key from the environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    // Throwing the error will prevent the application from starting with a misconfigured Firebase connection
    throw new Error('Failed to initialize Firebase Admin SDK. Check your FIREBASE_SERVICE_ACCOUNT_KEY.');
  }
}

// Get a reference to the Firestore database
const db = admin.firestore();

export { db, admin };
