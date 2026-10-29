import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID (CRITICAL)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Authenticate anonymously so Firestore security rules recognize an active session
signInAnonymously(auth).catch((err) => {
  console.warn('[Firebase Auth] Anonymous sign-in notice:', err);
});

// Test connection to Firestore on initialization
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'system', 'connection_test'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore client is offline or connecting.');
    }
    return false;
  }
}

testFirestoreConnection();

/**
 * Standard Firestore Error Handler according to security specification
 */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };
  console.error('[Firestore Error]', JSON.stringify(errInfo));
  return errInfo;
}

export { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot };

/**
 * Fetch all collections from Firestore
 */
export async function pullLatestFromFirestore(): Promise<{
  eoffice: any[];
  chkb: any[];
  gbt: any[];
  pensioners: any[];
  gratuity: any[];
  articles: any[];
} | null> {
  try {
    const [eSnap, cSnap, gSnap, pSnap, gratSnap, artSnap] = await Promise.all([
      getDocs(collection(db, 'eoffice')),
      getDocs(collection(db, 'chkb')),
      getDocs(collection(db, 'gbt')),
      getDocs(collection(db, 'pensioners')),
      getDocs(collection(db, 'gratuity')),
      getDocs(collection(db, 'articles')),
    ]);

    const result = {
      eoffice: eSnap.docs.map((d) => d.data()),
      chkb: cSnap.docs.map((d) => d.data()),
      gbt: gSnap.docs.map((d) => d.data()),
      pensioners: pSnap.docs.map((d) => d.data()),
      gratuity: gratSnap.docs.map((d) => d.data()),
      articles: artSnap.docs.map((d) => d.data()),
    };

    const hasData =
      result.eoffice.length > 0 ||
      result.chkb.length > 0 ||
      result.gbt.length > 0 ||
      result.pensioners.length > 0 ||
      result.gratuity.length > 0 ||
      result.articles.length > 0;

    return hasData ? result : null;
  } catch (err) {
    console.warn('[Firebase Firestore Pull]', err);
    return null;
  }
}

