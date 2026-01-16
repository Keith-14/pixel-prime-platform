import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDIqayL6jUliisaKD0GxR_um0fWEPnvM4E",
  authDomain: "barakah-f1a6e.firebaseapp.com",
  projectId: "barakah-f1a6e",
  appId: "1:860044504855:web:b0b12ceb7106438818d152",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  return await signInWithPopup(auth, googleProvider);
}

export async function signUpWithEmail(email: string, password: string) {
  return await createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithEmail(email: string, password: string) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function firebaseSignOut() {
  return await signOut(auth);
}

export { onAuthStateChanged, type User };
