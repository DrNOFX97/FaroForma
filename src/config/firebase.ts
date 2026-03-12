import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyARFEzy0bCfIC73vas_r4jyyu1mwcyYOV8",
  authDomain: "faroformapt.firebaseapp.com",
  projectId: "faroformapt",
  storageBucket: "faroformapt.firebasestorage.app",
  messagingSenderId: "674979074363",
  appId: "1:674979074363:web:bcbfe70c3cce99be4e671e",
  measurementId: "G-63ERWT4STH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
