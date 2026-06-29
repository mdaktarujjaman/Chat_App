import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDoc,
  deleteDoc,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: import.meta.env.VITE_PROJECT_ID,
  appId: import.meta.env.VITE_APP_ID,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  firestoreDatabaseId: import.meta.env.VITE_FIRESTORE_DB_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Get Firestore using the specific database ID configured in the applet
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Get Storage with error handling in case it is not enabled in the project
let storage: FirebaseStorage | null = null;
try {
  storage = getStorage(app);
} catch (error) {
  console.warn('Firebase Storage initialization failed. Falling back to inline Base64 storage.', error);
}

export { storage };
