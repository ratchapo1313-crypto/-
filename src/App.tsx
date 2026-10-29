import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Footer } from './components/Footer';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { EOfficeView } from './views/EOfficeView';
import { ChkbView } from './views/ChkbView';
import { GbtView } from './views/GbtView';
import { PensionersView } from './views/PensionersView';
import { GratuityReportView } from './views/GratuityReportView';
import { SpecialPensionersReportView } from './views/SpecialPensionersReportView';
import { ResearchArticlesView } from './views/ResearchArticlesView';
import { ExcelCenterView } from './views/ExcelCenterView';
import { OfficialMemoView } from './views/OfficialMemoView';
import {
  INITIAL_E_OFFICE_RECORDS,
  INITIAL_CHKB_RECORDS,
  INITIAL_GBT_RECORDS,
  INITIAL_PENSIONERS,
  INITIAL_GRATUITY_RECIPIENTS,
  INITIAL_ARTICLES,
} from './data/initialData';
import {
  EOfficeRecord,
  FinancialFundRecord,
  PensionerRecord,
  GratuityRecipientRecord,
  ArticleRecord,
  UserSession,
} from './types';
import { db, doc, setDoc, deleteDoc, collection, onSnapshot, pullLatestFromFirestore } from './firebase';

const STORAGE_KEYS = {
  SESSION: 'mkm_session_fy2570_tab',
  EOFFICE: 'mkm_eoffice_fy2570_v2',
  CHKB: 'mkm_chkb_fy2570_v2',
  GBT: 'mkm_gbt_fy2570_v2',
  PENSIONERS: 'mkm_pensioners_fy2570_v2',
  GRATUITY: 'mkm_gratuity_fy2570_v2',
  ARTICLES: 'mkm_articles_fy2570_v2',
};

// Purge any legacy cached dummy data from prior sessions
try {
  ['mkm_eoffice_fy2570', 'mkm_chkb_fy2570', 'mkm_gbt_fy2570', 'mkm_pensioners_fy2570', 'mkm_gratuity_fy2570'].forEach(
    (key) => localStorage.removeItem(key)
  );
} catch {}

const BROADCAST_CHANNEL_NAME = 'mkm_database_broadcast_2570';

export default function App() {
  // Tab-isolated session: Each browser tab/window maintains its own independent session
  // allowing User (1234), User1 (4567), User2 (8910), Director, Executive to log in simultaneously
  const [currentSession, setCurrentSession] = useState<UserSession | null>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Data States - starts completely empty, waiting for user entries
  const [eOfficeData, setEOfficeData] = useState<EOfficeRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EOFFICE);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => ({
          ...item,
          type: item.type === 'create' ? 'out' : item.type,
          quantity: item.quantity !== undefined ? item.quantity : 0,
        }));
      }
    } catch {}
    return INITIAL_E_OFFICE_RECORDS;
  });

  const [chkbData, setChkbData] = useState<FinancialFundRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHKB);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CHKB_RECORDS;
  });

  const [gbtData, setGbtData] = useState<FinancialFundRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GBT);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_GBT_RECORDS;
  });

  const [pensionersData, setPensionersData] = useState<PensionerRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PENSIONERS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PENSIONERS;
  });

  const [gratuityData, setGratuityData] = useState<GratuityRecipientRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GRATUITY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_GRATUITY_RECIPIENTS;
  });

  const [articlesData, setArticlesData] = useState<ArticleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ARTICLES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_ARTICLES;
  });

  // Unique client tab identifier to completely eliminate duplicate echo re-renders
  const clientIdRef = React.useRef<string>(
    'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now()
  );

  // Database Version Ref & Live Sync State across all Web Browsers
  const currentVersionRef = React.useRef<number>(0);
  const [isServerSynced, setIsServerSynced] = useState<boolean>(true);

  // Non-blocking debounced local storage saving
  const storageDebounceMap = React.useRef<{ [key: string]: any }>({});
  const debouncedSaveLocalStorage = React.useCallback((key: string, data: any) => {
    if (storageDebounceMap.current[key]) {
      clearTimeout(storageDebounceMap.current[key]);
    }
    storageDebounceMap.current[key] = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch {}
    }, 150);
  }, []);

  // Pending queue storage key for guaranteed cross-device persistence
  const PENDING_QUEUE_KEY = 'mkm_pending_sync_queue_fy2570';

  const getPendingQueue = (): any[] => {
    try {
      const q = localStorage.getItem(PENDING_QUEUE_KEY);
      return q ? JSON.parse(q) : [];
    } catch {
      return [];
    }
  };

  const enqueuePendingSync = (action: string, collection: string, payload: any) => {
    try {
      const q = getPendingQueue();
      q.push({ action, collection, payload, clientId: clientIdRef.current, timestamp: Date.now() });
      localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(q));
    } catch {}
  };

  const flushPendingSyncQueue = async () => {
    const q = getPendingQueue();
    if (!q || q.length === 0) return;

    const remaining: any[] = [];
    for (const item of q) {
      try {
        if (item.action === 'update_collection') {
          const res = await fetch('/api/database/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              collection: item.collection,
              data: item.payload,
              updatedBy: currentSession?.username || 'User',
              clientId: clientIdRef.current,
            }),
          });
          if (!res.ok) remaining.push(item);
        } else if (item.action === 'add' || item.action === 'update') {
          const res = await fetch('/api/database/item', {
            method: item.action === 'add' ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              collection: item.collection,
              item: item.payload,
              updatedBy: currentSession?.username || 'User',
              clientId: clientIdRef.current,
            }),
          });
          if (!res.ok) remaining.push(item);
        } else if (item.action === 'delete') {
          const res = await fetch('/api/database/item', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              collection: item.collection,
              id: item.payload,
              updatedBy: currentSession?.username || 'User',
              clientId: clientIdRef.current,
            }),
          });
          if (!res.ok) remaining.push(item);
        }
      } catch {
        remaining.push(item);
      }
    }

    try {
      if (remaining.length > 0) {
        localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(remaining));
      } else {
        localStorage.removeItem(PENDING_QUEUE_KEY);
        setIsServerSynced(true);
      }
    } catch {}
  };

  const [dbLastUpdated, setDbLastUpdated] = useState<string>('');
  const [dbLastUpdatedBy, setDbLastUpdatedBy] = useState<string>('');

  // Fetch latest database from persistent server & Firebase Firestore
  const fetchLatestServerDatabase = React.useCallback(async (force = false) => {
    try {
      // 1. Fetch from persistent server store
      const res = await fetch('/api/database');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          // If forced or newer version, re-set states
          if (force || !result.version || result.version > currentVersionRef.current || currentVersionRef.current === 0) {
            currentVersionRef.current = result.version || Date.now();
            if (result.lastUpdated) setDbLastUpdated(result.lastUpdated);
            if (result.lastUpdatedBy) setDbLastUpdatedBy(result.lastUpdatedBy);
            if (Array.isArray(result.data.eoffice)) setEOfficeData(result.data.eoffice);
            if (Array.isArray(result.data.chkb)) setChkbData(result.data.chkb);
            if (Array.isArray(result.data.gbt)) setGbtData(result.data.gbt);
            if (Array.isArray(result.data.pensioners)) setPensionersData(result.data.pensioners);
            if (Array.isArray(result.data.gratuity)) setGratuityData(result.data.gratuity);
            if (Array.isArray(result.data.articles) && result.data.articles.length > 0) {
              setArticlesData(result.data.articles);
            }
            setIsServerSynced(true);
          }
        }
      }

      // 2. Also query Firebase Firestore to ensure all collections are pulled and up-to-date
      try {
        const fbData = await pullLatestFromFirestore();
        if (fbData) {
          if (Array.isArray(fbData.eoffice) && fbData.eoffice.length > 0) setEOfficeData(fbData.eoffice);
          if (Array.isArray(fbData.chkb) && fbData.chkb.length > 0) setChkbData(fbData.chkb);
          if (Array.isArray(fbData.gbt) && fbData.gbt.length > 0) setGbtData(fbData.gbt);
          if (Array.isArray(fbData.pensioners) && fbData.pensioners.length > 0) setPensionersData(fbData.pensioners);
          if (Array.isArray(fbData.gratuity) && fbData.gratuity.length > 0) setGratuityData(fbData.gratuity);
          if (Array.isArray(fbData.articles) && fbData.articles.length > 0) setArticlesData(fbData.articles);
        }
      } catch (fbErr) {
        console.warn('[Firebase Firestore Pull Notice]', fbErr);
      }
    } catch (err) {
      console.warn('[Sync] Server fetch failed, running from cached storage:', err);
    }
  }, []);

  // Sync entire collection to server & Firebase Firestore
  const syncToServer = async (collectionName: string, data: any[]) => {
    // 1. Sync to Firebase Firestore asynchronously
    try {
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item && item.id) {
            setDoc(doc(db, collectionName, String(item.id)), item).catch(() => {});
          }
        }
      }
    } catch (fbErr) {
      console.warn('[Firebase Firestore Sync Notice]', fbErr);
    }

    // 2. Sync to local backend persistent store
    try {
      const res = await fetch('/api/database/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: collectionName,
          data,
          updatedBy: currentSession?.username || 'User',
          clientId: clientIdRef.current,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.version) currentVersionRef.current = json.version;
        if (json.lastUpdated) setDbLastUpdated(json.lastUpdated);
        if (json.lastUpdatedBy) setDbLastUpdatedBy(json.lastUpdatedBy);
        setIsServerSynced(true);
      } else {
        setIsServerSynced(false);
        enqueuePendingSync('update_collection', collectionName, data);
      }
    } catch (err) {
      console.warn('[Sync] Offline or server unreachable, changes enqueued for automatic sync:', err);
      setIsServerSynced(false);
      enqueuePendingSync('update_collection', collectionName, data);
    }
  };

  // Sync single item atomically to server & Firebase Firestore (add, update, delete)
  const syncItemToServer = async (
    action: 'add' | 'update' | 'delete',
    collectionName: string,
    itemOrId: any
  ) => {
    // 1. Sync to Firebase Firestore asynchronously
    try {
      if (action === 'delete') {
        const docId = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id;
        if (docId) {
          deleteDoc(doc(db, collectionName, String(docId))).catch(() => {});
        }
      } else {
        const docId = itemOrId?.id;
        if (docId) {
          setDoc(doc(db, collectionName, String(docId)), itemOrId).catch(() => {});
        }
      }
    } catch (fbErr) {
      console.warn('[Firebase Firestore Item Sync Notice]', fbErr);
    }

    // 2. Sync to local backend persistent store
    try {
      let url = '/api/database/item';
      let method = action === 'add' ? 'POST' : action === 'update' ? 'PUT' : 'DELETE';
      let body: any = {
        collection: collectionName,
        updatedBy: currentSession?.username || 'User',
        clientId: clientIdRef.current,
      };
      if (action === 'delete') {
        body.id = itemOrId;
      } else {
        body.item = itemOrId;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.version) currentVersionRef.current = json.version;
        if (json.lastUpdated) setDbLastUpdated(json.lastUpdated);
        if (json.lastUpdatedBy) setDbLastUpdatedBy(json.lastUpdatedBy);
        setIsServerSynced(true);
      } else {
        setIsServerSynced(false);
        enqueuePendingSync(action, collectionName, itemOrId);
      }
    } catch (err) {
      console.warn('[Sync] Item sync failed, enqueued for retry:', err);
      setIsServerSynced(false);
      enqueuePendingSync(action, collectionName, itemOrId);
    }
  };

  // 1. Initial Load & Persistent Real-time Synchronization via SSE
  // 2. Fetch latest server database on mount and on reconnection/focus
  useEffect(() => {
    let isMounted = true;

    fetchLatestServerDatabase();
    flushPendingSyncQueue();

    // Connect to Server-Sent Events (SSE) for instant cross-device live push updates
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/database/events');
        eventSource.onmessage = (e) => {
          if (!e.data) return;
          try {
            const event = JSON.parse(e.data);

            if (event.lastUpdated) setDbLastUpdated(event.lastUpdated);
            if (event.lastUpdatedBy) setDbLastUpdatedBy(event.lastUpdatedBy);

            // CRITICAL: If this event was initiated by this client tab, ignore data reset!
            // We already applied the change optimistically with 0ms delay.
            // Skipping this prevents duplicate re-rendering, freezing, and stutter.
            if (event.senderId && event.senderId === clientIdRef.current) {
              if (event.version) currentVersionRef.current = event.version;
              return;
            }

            if (event.type === 'DATABASE_UPDATED' && event.collection && isMounted) {
              currentVersionRef.current = event.version;
              if (event.collection === 'eoffice') setEOfficeData(event.data);
              else if (event.collection === 'chkb') setChkbData(event.data);
              else if (event.collection === 'gbt') setGbtData(event.data);
              else if (event.collection === 'pensioners') setPensionersData(event.data);
              else if (event.collection === 'gratuity') setGratuityData(event.data);
              else if (event.collection === 'articles') setArticlesData(event.data);
              setIsServerSynced(true);
            } else if (event.type === 'DATABASE_BULK_UPDATED' && event.data && isMounted) {
              currentVersionRef.current = event.version;
              if (event.data.eoffice) setEOfficeData(event.data.eoffice);
              if (event.data.chkb) setChkbData(event.data.chkb);
              if (event.data.gbt) setGbtData(event.data.gbt);
              if (event.data.pensioners) setPensionersData(event.data.pensioners);
              if (event.data.gratuity) setGratuityData(event.data.gratuity);
              if (event.data.articles) setArticlesData(event.data.articles);
              setIsServerSynced(true);
            }
          } catch {}
        };

        eventSource.onerror = () => {
          setIsServerSynced(false);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (isMounted) {
            reconnectTimeout = setTimeout(connectSSE, 5000);
          }
        };

        eventSource.onopen = () => {
          setIsServerSynced(true);
        };
      } catch {}
    };

    connectSSE();

    // Direct Real-time Firestore onSnapshot Listeners across all devices
    const unsubs: (() => void)[] = [];
    try {
      const uEOffice = onSnapshot(collection(db, 'eoffice'), (snap) => {
        if (!snap.empty && isMounted) {
          const docs = snap.docs.map((d) => d.data() as EOfficeRecord);
          setEOfficeData(docs);
        }
      }, () => {});
      unsubs.push(uEOffice);

      const uChkb = onSnapshot(collection(db, 'chkb'), (snap) => {
        if (!snap.empty && isMounted) {
          const docs = snap.docs.map((d) => d.data() as FinancialFundRecord);
          setChkbData(docs);
        }
      }, () => {});
      unsubs.push(uChkb);

      const uGbt = onSnapshot(collection(db, 'gbt'), (snap) => {
        if (!snap.empty && isMounted) {
          const docs = snap.docs.map((d) => d.data() as FinancialFundRecord);
          setGbtData(docs);
        }
      }, () => {});
      unsubs.push(uGbt);

      const uPensioners = onSnapshot(collection(db, 'pensioners'), (snap) => {
        if (!snap.empty && isMounted) {
          const docs = snap.docs.map((d) => d.data() as PensionerRecord);
          setPensionersData(docs);
        }
      }, () => {});
      unsubs.push(uPensioners);

      const uGratuity = onSnapshot(collection(db, 'gratuity'), (snap) => {
        if (!snap.empty && isMounted) {
          const docs = snap.docs.map((d) => d.data() as GratuityRecipientRecord);
          setGratuityData(docs);
        }
      }, () => {});
      unsubs.push(uGratuity);

      const uArticles = onSnapshot(collection(db, 'articles'), (snap) => {
        if (!snap.empty && isMounted) {
          const docs = snap.docs.map((d) => d.data() as ArticleRecord);
          setArticlesData(docs);
        }
      }, () => {});
      unsubs.push(uArticles);
    } catch (fbListenErr) {
      console.warn('[Firebase Firestore Listener Notice]', fbListenErr);
    }

    // Gentle watchdog poll (25s when connected, 6s when offline)
    const pollInterval = setInterval(async () => {
      try {
        await flushPendingSyncQueue();
        const vRes = await fetch('/api/database/version');
        if (!vRes.ok) return;
        const vData = await vRes.json();
        if (vData.version && vData.version > currentVersionRef.current) {
          fetchLatestServerDatabase();
        }
      } catch {}
    }, 25000);

    // Cross-device focus and online reconnect listeners
    const handleRevalidation = () => {
      fetchLatestServerDatabase();
      flushPendingSyncQueue();
    };

    window.addEventListener('focus', handleRevalidation);
    window.addEventListener('online', handleRevalidation);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleRevalidation();
    });

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
      unsubs.forEach((u) => {
        try {
          u();
        } catch {}
      });
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleRevalidation);
      window.removeEventListener('online', handleRevalidation);
    };
  }, [fetchLatestServerDatabase]);

  // Re-fetch latest database on tab navigation
  useEffect(() => {
    fetchLatestServerDatabase();
  }, [activeTab, fetchLatestServerDatabase]);

  // Persistent BroadcastChannel ref to eliminate allocation and connection churn
  const bcRef = React.useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bcRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        bcRef.current.onmessage = (event) => {
          if (!event.data || !event.data.type) return;
          // Skip messages originating from the current tab
          if (event.data.senderId === clientIdRef.current) return;

          const { type, payload } = event.data;
          if (type === 'SYNC_EOFFICE' && payload) setEOfficeData(payload);
          else if (type === 'SYNC_CHKB' && payload) setChkbData(payload);
          else if (type === 'SYNC_GBT' && payload) setGbtData(payload);
          else if (type === 'SYNC_PENSIONERS' && payload) setPensionersData(payload);
          else if (type === 'SYNC_GRATUITY' && payload) setGratuityData(payload);
          else if (type === 'SYNC_ARTICLES' && payload) setArticlesData(payload);
        };
      }
    } catch {}

    return () => {
      if (bcRef.current) {
        bcRef.current.close();
        bcRef.current = null;
      }
    };
  }, []);

  // Broadcast helper to notify other tabs instantly without blocking
  const broadcastSync = (type: string, payload: any) => {
    try {
      if (bcRef.current) {
        bcRef.current.postMessage({ type, payload, senderId: clientIdRef.current });
      }
    } catch {}
  };

  // Debounced storage updates to keep UI at 60 FPS
  useEffect(() => {
    debouncedSaveLocalStorage(STORAGE_KEYS.EOFFICE, eOfficeData);
    broadcastSync('SYNC_EOFFICE', eOfficeData);
  }, [eOfficeData, debouncedSaveLocalStorage]);

  useEffect(() => {
    debouncedSaveLocalStorage(STORAGE_KEYS.CHKB, chkbData);
    broadcastSync('SYNC_CHKB', chkbData);
  }, [chkbData, debouncedSaveLocalStorage]);

  useEffect(() => {
    debouncedSaveLocalStorage(STORAGE_KEYS.GBT, gbtData);
    broadcastSync('SYNC_GBT', gbtData);
  }, [gbtData, debouncedSaveLocalStorage]);

  useEffect(() => {
    debouncedSaveLocalStorage(STORAGE_KEYS.PENSIONERS, pensionersData);
    broadcastSync('SYNC_PENSIONERS', pensionersData);
  }, [pensionersData, debouncedSaveLocalStorage]);

  useEffect(() => {
    debouncedSaveLocalStorage(STORAGE_KEYS.GRATUITY, gratuityData);
    broadcastSync('SYNC_GRATUITY', gratuityData);
  }, [gratuityData, debouncedSaveLocalStorage]);

  useEffect(() => {
    debouncedSaveLocalStorage(STORAGE_KEYS.ARTICLES, articlesData);
    broadcastSync('SYNC_ARTICLES', articlesData);
  }, [articlesData, debouncedSaveLocalStorage]);

  // Auth Handlers: Re-fetch latest server & Firestore database unconditionally upon login
  const handleLoginSuccess = async (session: UserSession) => {
    setCurrentSession(session);
    try {
      sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } catch {}
    setActiveTab('dashboard');
    // Force unconditional sync from persistent server & Firebase Firestore
    await fetchLatestServerDatabase(true);
  };

  const handleLogout = () => {
    setCurrentSession(null);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch {}
  };

  // Articles & Research CRUD
  const handleAddArticle = (item: ArticleRecord) => {
    setArticlesData((prev) => [item, ...prev]);
    syncItemToServer('add', 'articles', item);
  };
  const handleUpdateArticle = (item: ArticleRecord) => {
    setArticlesData((prev) => prev.map((a) => (a.id === item.id ? item : a)));
    syncItemToServer('update', 'articles', item);
  };
  const handleDeleteArticle = (id: string) => {
    setArticlesData((prev) => prev.filter((a) => a.id !== id));
    syncItemToServer('delete', 'articles', id);
  };

  // E-Office CRUD
  const handleAddEOffice = (item: EOfficeRecord) => {
    const stamped = {
      ...item,
      recordedBy: item.recordedBy || currentSession?.username || 'User',
      updatedAt: item.updatedAt || new Date().toISOString(),
    };
    setEOfficeData((prev) => [stamped, ...prev]);
    syncItemToServer('add', 'eoffice', stamped);
  };
  const handleUpdateEOffice = (item: EOfficeRecord) => {
    const stamped = {
      ...item,
      recordedBy: currentSession?.username || item.recordedBy || 'User',
      updatedAt: new Date().toISOString(),
    };
    setEOfficeData((prev) => prev.map((r) => (r.id === item.id ? stamped : r)));
    syncItemToServer('update', 'eoffice', stamped);
  };
  const handleDeleteEOffice = (id: string) => {
    setEOfficeData((prev) => prev.filter((r) => r.id !== id));
    syncItemToServer('delete', 'eoffice', id);
  };
  const handleSetAllEOffice = (records: EOfficeRecord[]) => {
    const stamped = records.map((r) => ({
      ...r,
      recordedBy: r.recordedBy || currentSession?.username || 'User',
      updatedAt: r.updatedAt || new Date().toISOString(),
    }));
    setEOfficeData(stamped);
    syncToServer('eoffice', stamped);
  };

  // CHKB CRUD
  const handleAddChkb = (item: FinancialFundRecord) => {
    const stamped = {
      ...item,
      recordedBy: item.recordedBy || currentSession?.username || 'User',
      updatedAt: item.updatedAt || new Date().toISOString(),
    };
    setChkbData((prev) => [stamped, ...prev]);
    syncItemToServer('add', 'chkb', stamped);
  };
  const handleUpdateChkb = (item: FinancialFundRecord) => {
    const stamped = {
      ...item,
      recordedBy: currentSession?.username || item.recordedBy || 'User',
      updatedAt: new Date().toISOString(),
    };
    setChkbData((prev) => prev.map((r) => (r.id === item.id ? stamped : r)));
    syncItemToServer('update', 'chkb', stamped);
  };
  const handleDeleteChkb = (id: string) => {
    setChkbData((prev) => prev.filter((r) => r.id !== id));
    syncItemToServer('delete', 'chkb', id);
  };

  // GBT CRUD
  const handleAddGbt = (item: FinancialFundRecord) => {
    const stamped = {
      ...item,
      recordedBy: item.recordedBy || currentSession?.username || 'User',
      updatedAt: item.updatedAt || new Date().toISOString(),
    };
    setGbtData((prev) => [stamped, ...prev]);
    syncItemToServer('add', 'gbt', stamped);
  };
  const handleUpdateGbt = (item: FinancialFundRecord) => {
    const stamped = {
      ...item,
      recordedBy: currentSession?.username || item.recordedBy || 'User',
      updatedAt: new Date().toISOString(),
    };
    setGbtData((prev) => prev.map((r) => (r.id === item.id ? stamped : r)));
    syncItemToServer('update', 'gbt', stamped);
  };
  const handleDeleteGbt = (id: string) => {
    setGbtData((prev) => prev.filter((r) => r.id !== id));
    syncItemToServer('delete', 'gbt', id);
  };

  // Pensioners CRUD
  const handleAddPensioner = (item: PensionerRecord) => {
    const stamped = {
      ...item,
      recordedBy: item.recordedBy || currentSession?.username || 'User',
      updatedAt: item.updatedAt || new Date().toISOString(),
    };
    setPensionersData((prev) => [stamped, ...prev]);
    syncItemToServer('add', 'pensioners', stamped);
  };
  const handleUpdatePensioner = (item: PensionerRecord) => {
    const stamped = {
      ...item,
      recordedBy: currentSession?.username || item.recordedBy || 'User',
      updatedAt: new Date().toISOString(),
    };
    setPensionersData((prev) => prev.map((r) => (r.id === item.id ? stamped : r)));
    syncItemToServer('update', 'pensioners', stamped);
  };
  const handleDeletePensioner = (id: string) => {
    setPensionersData((prev) => prev.filter((r) => r.id !== id));
    syncItemToServer('delete', 'pensioners', id);
  };

  // Quick Verify action
  const handleQuickVerify = (
    id: string,
    channel: 'ยืนยันตัวตนออนไลน์' | 'แสดงตนที่กองคลัง'
  ) => {
    const today = new Date().toISOString().split('T')[0];
    let updatedItem: PensionerRecord | null = null;
    setPensionersData((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          updatedItem = {
            ...p,
            isVerified: true,
            verifiedDate: today,
            verificationChannel: channel,
            recordedBy: currentSession?.username || p.recordedBy || 'User',
            updatedAt: new Date().toISOString(),
          };
          return updatedItem;
        }
        return p;
      })
    );
    if (updatedItem) {
      syncItemToServer('update', 'pensioners', updatedItem);
    }
  };

  // Gratuity Recipients CRUD
  const handleAddGratuity = (item: GratuityRecipientRecord) => {
    const stamped = {
      ...item,
      recordedBy: item.recordedBy || currentSession?.username || 'User',
      updatedAt: item.updatedAt || new Date().toISOString(),
    };
    setGratuityData((prev) => [stamped, ...prev]);
    syncItemToServer('add', 'gratuity', stamped);
  };
  const handleUpdateGratuity = (item: GratuityRecipientRecord) => {
    const stamped = {
      ...item,
      recordedBy: currentSession?.username || item.recordedBy || 'User',
      updatedAt: new Date().toISOString(),
    };
    setGratuityData((prev) => prev.map((r) => (r.id === item.id ? stamped : r)));
    syncItemToServer('update', 'gratuity', stamped);
  };
  const handleDeleteGratuity = (id: string) => {
    setGratuityData((prev) => prev.filter((r) => r.id !== id));
    syncItemToServer('delete', 'gratuity', id);
  };
  const handleQuickVerifyGratuity = (
    id: string,
    channel: 'ยืนยันตัวตนออนไลน์' | 'แสดงตนที่กองคลัง'
  ) => {
    const today = new Date().toISOString().split('T')[0];
    let updatedItem: GratuityRecipientRecord | null = null;
    setGratuityData((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          updatedItem = {
            ...g,
            isVerified: true,
            verifiedDate: today,
            verificationChannel: channel,
            recordedBy: currentSession?.username || g.recordedBy || 'User',
            updatedAt: new Date().toISOString(),
          };
          return updatedItem;
        }
        return g;
      })
    );
    if (updatedItem) {
      syncItemToServer('update', 'gratuity', updatedItem);
    }
  };

  // Excel Import Handlers
  const handleImportEOffice = (data: EOfficeRecord[], mode: 'append' | 'replace') => {
    const stamped = data.map((d) => ({
      ...d,
      recordedBy: d.recordedBy || currentSession?.username || 'User',
      updatedAt: new Date().toISOString(),
    }));
    const next = mode === 'append' ? [...eOfficeData, ...stamped] : stamped;
    setEOfficeData(next);
    syncToServer('eoffice', next);
  };
  const handleImportChkb = (data: FinancialFundRecord[], mode: 'append' | 'replace') => {
    const stamped = data.map((d) => ({
      ...d,
      recordedBy: d.recordedBy || currentSession?.username || 'User',
      updatedAt: new Date().toISOString(),
    }));
    const next = mode === 'append' ? [...chkbData, ...stamped] : stamped;
    setChkbData(next);
    syncToServer('chkb', next);
  };
  const handleImportGbt = (data: FinancialFundRecord[], mode: 'append' | 'replace') => {
    const stamped = data.map((d) => ({
      ...d,
      recordedBy: d.recordedBy || currentSession?.username || 'User',
      updatedAt: new Date().toISOString(),
    }));
    const next = mode === 'append' ? [...gbtData, ...stamped] : stamped;
    setGbtData(next);
    syncToServer('gbt', next);
  };
  const handleImportPensioners = (data: PensionerRecord[], mode: 'append' | 'replace') => {
    const stamped = data.map((d) => ({
      ...d,
      recordedBy: d.recordedBy || currentSession?.username || 'User',
      updatedAt: new Date().toISOString(),
    }));
    const next = mode === 'append' ? [...pensionersData, ...stamped] : stamped;
    setPensionersData(next);
    syncToServer('pensioners', next);
  };
  const handleImportGratuity = (data: GratuityRecipientRecord[], mode: 'append' | 'replace') => {
    const stamped = data.map((d) => ({
      ...d,
      recordedBy: d.recordedBy || currentSession?.username || 'User',
      updatedAt: new Date().toISOString(),
    }));
    const next = mode === 'append' ? [...gratuityData, ...stamped] : stamped;
    setGratuityData(next);
    syncToServer('gratuity', next);
  };

  if (!currentSession) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      {/* Top Navbar */}
      <Navbar
        currentSession={currentSession}
        onLogout={handleLogout}
        onToggleSidebar={() => setIsMobileSidebarOpen(true)}
        isServerSynced={isServerSynced}
        dbLastUpdatedBy={dbLastUpdatedBy}
        dbLastUpdated={dbLastUpdated}
      />

          <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
            {/* Sidebar */}
            <Sidebar
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              currentSession={currentSession}
              isOpenMobile={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <main className="flex-1 min-w-0">
              {activeTab === 'dashboard' && (
                <DashboardView
                  currentSession={currentSession}
                  eOfficeData={eOfficeData}
                  chkbData={chkbData}
                  gbtData={gbtData}
                  pensionersData={pensionersData}
                  onNavigateTab={setActiveTab}
                />
              )}

              {activeTab === 'eoffice' && (
                <EOfficeView
                  currentSession={currentSession}
                  records={eOfficeData}
                  onAddRecord={handleAddEOffice}
                  onUpdateRecord={handleUpdateEOffice}
                  onDeleteRecord={handleDeleteEOffice}
                  onSetAllRecords={handleSetAllEOffice}
                />
              )}

              {activeTab === 'chkb' && (
                <ChkbView
                  currentSession={currentSession}
                  records={chkbData}
                  onAddRecord={handleAddChkb}
                  onUpdateRecord={handleUpdateChkb}
                  onDeleteRecord={handleDeleteChkb}
                />
              )}

              {activeTab === 'gbt' && (
                <GbtView
                  currentSession={currentSession}
                  records={gbtData}
                  onAddRecord={handleAddGbt}
                  onUpdateRecord={handleUpdateGbt}
                  onDeleteRecord={handleDeleteGbt}
                />
              )}

              {activeTab === 'pensioners' && (
                <PensionersView
                  currentSession={currentSession}
                  pensioners={pensionersData}
                  onAddPensioner={handleAddPensioner}
                  onUpdatePensioner={handleUpdatePensioner}
                  onDeletePensioner={handleDeletePensioner}
                  onQuickVerify={handleQuickVerify}
                />
              )}

              {activeTab === 'gratuity-report' && (
                <GratuityReportView
                  currentSession={currentSession}
                  records={gratuityData}
                  onAddRecord={handleAddGratuity}
                  onUpdateRecord={handleUpdateGratuity}
                  onDeleteRecord={handleDeleteGratuity}
                  onQuickVerify={handleQuickVerifyGratuity}
                />
              )}

              {activeTab === 'special-pensioners' && (
                <SpecialPensionersReportView
                  currentSession={currentSession}
                  pensioners={pensionersData}
                  onAddPensioner={handleAddPensioner}
                  onUpdatePensioner={handleUpdatePensioner}
                  onDeletePensioner={handleDeletePensioner}
                />
              )}

              {activeTab === 'research' && (
                <ResearchArticlesView
                  currentSession={currentSession}
                  articles={articlesData}
                  onAddArticle={handleAddArticle}
                  onUpdateArticle={handleUpdateArticle}
                  onDeleteArticle={handleDeleteArticle}
                />
              )}

              {activeTab === 'excel' && (
                <ExcelCenterView
                  currentSession={currentSession}
                  eOfficeData={eOfficeData}
                  chkbData={chkbData}
                  gbtData={gbtData}
                  pensionersData={pensionersData}
                  gratuityData={gratuityData}
                  onImportEOffice={handleImportEOffice}
                  onImportChkb={handleImportChkb}
                  onImportGbt={handleImportGbt}
                  onImportPensioners={handleImportPensioners}
                  onImportGratuity={handleImportGratuity}
                />
              )}

              {activeTab === 'memo' && (
                <OfficialMemoView
                  currentSession={currentSession}
                  eOfficeData={eOfficeData}
                  chkbData={chkbData}
                  gbtData={gbtData}
                  pensionersData={pensionersData}
                  gratuityData={gratuityData}
                />
              )}
            </main>
          </div>

          {/* Footer */}
          <Footer currentSession={currentSession} />
    </div>
  );
}
