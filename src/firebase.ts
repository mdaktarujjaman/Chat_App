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
  projectId: "genuine-aurora-wfht8",
  appId: "1:53977960567:web:151662702387904cff7672",
  apiKey: "AIzaSyCFOPAR0et1RGKp8wv7d_Wa1qHWByY0kMA",
  authDomain: "genuine-aurora-wfht8.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-f1339052-8572-4d14-8b63-a11a13a5c0f7",
  storageBucket: "genuine-aurora-wfht8.firebasestorage.app",
  messagingSenderId: "53977960567",
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
