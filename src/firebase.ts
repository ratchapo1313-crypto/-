import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
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

export { collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot };

/**
 * Deeply clean object to remove undefined values so Firestore never rejects payloads
 */
export function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj
      .map((item) => sanitizeForFirestore(item))
      .filter((item) => item !== undefined);
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = sanitizeForFirestore(value);
    }
  }
  return result;
}

/**
 * Synchronize a single item (add, update, delete) to Firestore and update system metadata
 */
export async function syncItemToFirestore(
  action: 'add' | 'update' | 'delete',
  collectionName: string,
  itemOrId: any,
  updatedBy: string = 'User'
): Promise<boolean> {
  try {
    const nowIso = new Date().toISOString();
    const version = Date.now();

    if (action === 'delete') {
      const docId = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id;
      if (docId) {
        await deleteDoc(doc(db, collectionName, String(docId)));
      }
    } else {
      const docId = itemOrId?.id;
      if (docId) {
        const cleanPayload = sanitizeForFirestore(itemOrId);
        await setDoc(doc(db, collectionName, String(docId)), cleanPayload);
      }
    }

    // Update global system metadata in Firestore so all devices see the latest update
    await setDoc(doc(db, 'system', 'metadata'), {
      version,
      lastUpdated: nowIso,
      lastUpdatedBy: updatedBy,
      collectionUpdated: collectionName,
      action,
    }, { merge: true });

    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, collectionName);
    return false;
  }
}

/**
 * Synchronize an entire collection to Firestore (e.g. after Excel import or batch updates)
 * Safely removes stale items that were deleted and sets new/updated items
 */
export async function syncCollectionToFirestore(
  collectionName: string,
  items: any[],
  updatedBy: string = 'User'
): Promise<boolean> {
  try {
    const nowIso = new Date().toISOString();
    const version = Date.now();

    // 1. Fetch current document IDs in Firestore
    const existingSnap = await getDocs(collection(db, collectionName));
    const targetIds = new Set(items.map((i) => String(i.id)));

    // 2. Delete any old documents in Firestore that are not in the new dataset
    const deletePromises: Promise<any>[] = [];
    existingSnap.docs.forEach((d) => {
      if (!targetIds.has(d.id)) {
        deletePromises.push(deleteDoc(doc(db, collectionName, d.id)));
      }
    });
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }

    // 3. Batch set all items with sanitized payload
    const writePromises = items.map((item) => {
      if (item && item.id) {
        const cleanItem = sanitizeForFirestore(item);
        return setDoc(doc(db, collectionName, String(item.id)), cleanItem);
      }
      return Promise.resolve();
    });
    await Promise.all(writePromises);

    // 4. Update system metadata
    await setDoc(doc(db, 'system', 'metadata'), {
      version,
      lastUpdated: nowIso,
      lastUpdatedBy: updatedBy,
      collectionUpdated: collectionName,
      action: 'sync_collection',
      totalRecords: items.length,
    }, { merge: true });

    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, collectionName);
    return false;
  }
}

/**
 * Fetch all collections and system metadata from Firestore
 */
export async function pullLatestFromFirestore(): Promise<{
  eoffice: any[];
  chkb: any[];
  gbt: any[];
  pensioners: any[];
  gratuity: any[];
  metadata: { version?: number; lastUpdated?: string; lastUpdatedBy?: string } | null;
} | null> {
  try {
    const [eSnap, cSnap, gSnap, pSnap, gratSnap, metaSnap] = await Promise.all([
      getDocs(collection(db, 'eoffice')),
      getDocs(collection(db, 'chkb')),
      getDocs(collection(db, 'gbt')),
      getDocs(collection(db, 'pensioners')),
      getDocs(collection(db, 'gratuity')),
      getDoc(doc(db, 'system', 'metadata')),
    ]);

    const sortDesc = (arr: any[], dateField1: string, dateField2: string = 'createdAt') => {
      return [...arr].sort((a, b) => {
        const valA = a[dateField1] || a[dateField2] || '';
        const valB = b[dateField1] || b[dateField2] || '';
        return String(valB).localeCompare(String(valA));
      });
    };

    const eofficeDocs = sortDesc(eSnap.docs.map((d) => d.data()), 'updatedAt', 'date');
    const chkbDocs = sortDesc(cSnap.docs.map((d) => d.data()), 'date', 'updatedAt');
    const gbtDocs = sortDesc(gSnap.docs.map((d) => d.data()), 'date', 'updatedAt');
    const pensionersDocs = sortDesc(pSnap.docs.map((d) => d.data()), 'updatedAt', 'id');
    const gratuityDocs = sortDesc(gratSnap.docs.map((d) => d.data()), 'updatedAt', 'id');
    const metadata = metaSnap.exists() ? (metaSnap.data() as any) : null;

    const hasAnyDocs =
      eofficeDocs.length > 0 ||
      chkbDocs.length > 0 ||
      gbtDocs.length > 0 ||
      pensionersDocs.length > 0 ||
      gratuityDocs.length > 0;

    if (!hasAnyDocs && !metadata) {
      return null;
    }

    return {
      eoffice: eofficeDocs,
      chkb: chkbDocs,
      gbt: gbtDocs,
      pensioners: pensionersDocs,
      gratuity: gratuityDocs,
      metadata,
    };
  } catch (err) {
    console.warn('[Firebase Firestore Pull]', err);
    return null;
  }
}

