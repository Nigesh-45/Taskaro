import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration (from the Firebase Console)
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyAs_z6RBNioD36PYqYCU8X4UqV-SKYt0ec",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "taskaro-8dd33.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "taskaro-8dd33",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "taskaro-8dd33.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "892352236914",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:892352236914:web:a1237748fba0c70d01a1eb",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-CTTKXG67Y2",
};

export const isFirebaseConfigured = true;

// Initialize Firebase (singleton-safe for Next.js hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Google Sign-In helper function
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user; // Successfully signed in user
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Sign-out helper function
export const logOut = () => signOut(auth);
