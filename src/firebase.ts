// ---------------------------------------------------------------------------
// Firebase SDK initialisation
// ---------------------------------------------------------------------------
// Reads credentials dynamically from environment variables (.env / Vercel Env)
// with safe fallbacks to the primary project configuration.
// ---------------------------------------------------------------------------

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyAidyDvGn_VkHCnU-AgjnFIw4RTqDeVAhw',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'flymun-a4e2f.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'flymun-a4e2f',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'flymun-a4e2f.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '489326284643',
  appId: env.VITE_FIREBASE_APP_ID || '1:489326284643:web:47d926854b5aec40fa0d56',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
