import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCjV2-_yN_q8gkAALViBqMtfGet1Y8qEXI",
  authDomain: "hsc-tracker-v2.firebaseapp.com",
  projectId: "hsc-tracker-v2",
  storageBucket: "hsc-tracker-v2.firebasestorage.app",
  messagingSenderId: "552594401187",
  appId: "1:552594401187:web:9eaf58d19c43737b089c16"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const loginWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

export const logoutFirebase = async () => {
  return await signOut(auth);
};
