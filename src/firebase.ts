// Single source of Firebase wiring. Every value comes from import.meta.env so the
// project is swappable at handover with zero code changes (see .env.example).
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Local development: route Auth + Firestore to the Emulator Suite. Guarded so a
// hot-reload doesn't try to reconnect (connect* throws if already connected).
declare global {
  // eslint-disable-next-line no-var
  var __EMULATORS_CONNECTED__: boolean | undefined;
}

if (import.meta.env.VITE_USE_EMULATOR === 'true' && !globalThis.__EMULATORS_CONNECTED__) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  globalThis.__EMULATORS_CONNECTED__ = true;
}
