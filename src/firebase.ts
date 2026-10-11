import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Validate connection to Firestore on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export interface VerifiedGoogleAccount {
  uid: string;
  email: string;
  name: string;
  photoURL: string;
  idToken: string;
}

/**
 * Opens the real Google Account chooser popup via Firebase Authentication
 * and verifies the selected Google Account just like modern platforms.
 */
export async function signInWithRealGooglePopup(): Promise<VerifiedGoogleAccount> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;
  const idToken = await fbUser.getIdToken();

  const verified: VerifiedGoogleAccount = {
    uid: fbUser.uid,
    email: fbUser.email || `${fbUser.uid}@gmail.com`,
    name:
      fbUser.displayName ||
      (fbUser.email ? fbUser.email.split('@')[0] : 'Google Foydalanuvchi'),
    photoURL: fbUser.photoURL || '',
    idToken,
  };

  // Sync verified public record to Firestore
  try {
    await setDoc(
      doc(db, 'users_public', fbUser.uid),
      {
        uid: fbUser.uid,
        displayName: verified.name.slice(0, 120),
        photoURL: verified.photoURL.slice(0, 1024),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {}

  return verified;
}

export async function signOutGoogleAccount(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch {}
}
