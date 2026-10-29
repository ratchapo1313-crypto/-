import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');
const SEED_FILE = path.resolve(DATA_DIR, 'seed.json');

interface DatabaseSchema {
  version: number;
  lastUpdated: string;
  lastUpdatedBy: string;
  eoffice: any[];
  chkb: any[];
  gbt: any[];
  pensioners: any[];
  gratuity: any[];
  articles: any[];
}

// In-memory cache + disk persistence
let currentDb: DatabaseSchema;

function initializeDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.version === 'number') {
        if (!Array.isArray(parsed.articles)) parsed.articles = [];
        console.log(`[Database] Loaded persistent database (version: ${parsed.version})`);
        return parsed;
      }
    }

    if (fs.existsSync(SEED_FILE)) {
      const raw = fs.readFileSync(SEED_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.version === 'number') {
        if (!Array.isArray(parsed.articles)) parsed.articles = [];
        console.log(`[Database] Initialized from seed.json`);
        saveDatabase(parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.error('[Database] Failed to read database.json, initializing fresh data:', err);
  }

  const initial: DatabaseSchema = {
    version: Date.now(),
    lastUpdated: new Date().toISOString(),
    lastUpdatedBy: 'System',
    eoffice: [],
    chkb: [],
    gbt: [],
    pensioners: [],
    gratuity: [],
    articles: [],
  };

  saveDatabase(initial);
  return initial;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    // Also persist backup in seed.json
    try {
      fs.writeFileSync(SEED_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch {}
  } catch (err) {
    console.error('[Database] Failed to write database.json:', err);
  }
}

// Guaranteed immediate disk persistence on every mutation
function scheduleSaveDatabase(db: DatabaseSchema) {
  saveDatabase(db);
}

currentDb = initializeDatabase();

// Active Server-Sent Events (SSE) connections across all Web Browsers
const sseClients = new Set<Response>();

function broadcastToAllBrowsers(payload: any) {
  const dataString = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(dataString);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Periodic heartbeat so SSE stays open across proxies/firewalls
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': keepalive\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 15000);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // JSON Body parsing with high limit for Excel imports
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS headers for flexibility
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // API Route: Get entire database
  app.get('/api/database', (req: Request, res: Response) => {
    res.json({
      success: true,
      version: currentDb.version,
      lastUpdated: currentDb.lastUpdated,
      lastUpdatedBy: currentDb.lastUpdatedBy,
      data: {
        eoffice: currentDb.eoffice,
        chkb: currentDb.chkb,
        gbt: currentDb.gbt,
        pensioners: currentDb.pensioners,
        gratuity: currentDb.gratuity,
        articles: currentDb.articles || [],
      },
    });
  });

  // API Route: Get version only (for low-overhead polling)
  app.get('/api/database/version', (req: Request, res: Response) => {
    res.json({
      success: true,
      version: currentDb.version,
      lastUpdated: currentDb.lastUpdated,
      lastUpdatedBy: currentDb.lastUpdatedBy,
    });
  });

  type CollectionKey = 'eoffice' | 'chkb' | 'gbt' | 'pensioners' | 'gratuity' | 'articles';

  // API Route: Add single item atomically (add/create)
  app.post('/api/database/item', (req: Request, res: Response) => {
    const { collection, item, updatedBy, clientId } = req.body;
    const validCollections = ['eoffice', 'chkb', 'gbt', 'pensioners', 'gratuity', 'articles'] as const;
    if (!validCollections.includes(collection) || !item || !item.id) {
      return res.status(400).json({ success: false, message: 'Invalid collection or item' });
    }

    const cKey = collection as CollectionKey;
    const col = currentDb[cKey] as any[];
    const existingIndex = col.findIndex((x) => x.id === item.id);
    if (existingIndex >= 0) {
      col[existingIndex] = item;
    } else {
      col.unshift(item);
    }

    currentDb.version = Date.now();
    currentDb.lastUpdated = new Date().toISOString();
    currentDb.lastUpdatedBy = updatedBy || 'User';
    scheduleSaveDatabase(currentDb);

    broadcastToAllBrowsers({
      type: 'DATABASE_UPDATED',
      collection: cKey,
      data: currentDb[cKey],
      version: currentDb.version,
      lastUpdated: currentDb.lastUpdated,
      lastUpdatedBy: currentDb.lastUpdatedBy,
      senderId: clientId || null,
    });

    console.log(`[Database] Item added to "${cKey}" by "${currentDb.lastUpdatedBy}"`);
    res.json({
      success: true,
      version: currentDb.version,
      lastUpdated: currentDb.lastUpdated,
      lastUpdatedBy: currentDb.lastUpdatedBy,
      data: currentDb[cKey],
    });
  });

  // API Route: Update single item atomically (edit/update)
  app.put('/api/database/item', (req: Request, res: Response) => {
    const { collection, item, updatedBy, clientId } = req.body;
    const validCollections = ['eoffice', 'chkb', 'gbt', 'pensioners', 'gratuity', 'articles'] as const;
    if (!validCollections.includes(collection) || !item || !item.id) {
      return res.status(400).json({ success: false, message: 'Invalid collection or item' });
    }

    const cKey = collection as CollectionKey;
    const col = currentDb[cKey] as any[];
    const idx = col.findIndex((x) => x.id === item.id);
    if (idx >= 0) {
      col[idx] = { ...col[idx], ...item };
    } else {
      col.unshift(item);
    }

    currentDb.version = Date.now();
    currentDb.lastUpdated = new Date().toISOString();
    currentDb.lastUpdatedBy = updatedBy || 'User';
    scheduleSaveDatabase(currentDb);

    broadcastToAllBrowsers({
      type: 'DATABASE_UPDATED',
      collection: cKey,
      data: currentDb[cKey],
      version: currentDb.version,
      lastUpdated: currentDb.lastUpdated,
      lastUpdatedBy: currentDb.lastUpdatedBy,
      senderId: clientId || null,
    });

    console.log(`[Database] Item updated in "${cKey}" by "${currentDb.lastUpdatedBy}"`);
    res.json({
      success: true,
      version: currentDb.version,
      lastUpdated: currentDb.lastUpdated,
      lastUpdatedBy: currentDb.lastUpdatedBy,
      data: currentDb[cKey],
    });
  });

  // API Route: Delete single item atomically (delete/remove)
  app.delete('/api/database/item', (req: Request, res: Response) => {
    const { collection, id, updatedBy, clientId } = req.body;
    const validCollections = ['eoffice', 'chkb', 'gbt', 'pensioners', 'gratuity', 'articles'] as const;
    if (!validCollections.includes(collection) || !id) {
      return res.status(400).json({ success: false, message: 'Invalid collection or id' });
    }

    const cKey = collection as CollectionKey;
    const col = currentDb[cKey] as any[];
    currentDb[cKey] = col.filter((x) => x.id !== id);

    currentDb.version = Date.now();
    currentDb.lastUpdated = new Date().toISOString();
    currentDb.lastUpdatedBy = updatedBy || 'User';
    scheduleSaveDatabase(currentDb);

    broadcastToAllBrowsers({
      type: 'DATABASE_UPDATED',
      collection: cKey,
      data: currentDb[cKey],
      version: currentDb.version,
      lastUpdated: currentDb.lastUpdated,
      lastUpdatedBy: currentDb.lastUpdatedBy,
      senderId: clientId || null,
    });

    console.log(`[Database] Item removed from "${cKey}" by "${currentDb.lastUpdatedBy}"`);
    res.json({
      success: true,
      version: currentDb.version,
      lastUpdated: currentDb.lastUpdated,
      lastUpdatedBy: currentDb.lastUpdatedBy,
      data: currentDb[cKey],
    });
  });

  // API Route: Update a collection from any Web Browser
  app.post('/api/database/update', (req: Request, res: Response) => {
    const { collection, data, updatedBy, clientId } = req.body;

    const validCollections = ['eoffice', 'chkb', 'gbt', 'pensioners', 'gratuity', 'articles'];
    if (!validCollections.includes(collection) || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid collection or data format',
      });
    }

    currentDb[collection as CollectionKey] = data;
    currentDb.version = Date.now();
    currentDb.lastUpdated = new Date().toISOString();
    currentDb.lastUpdatedBy = updatedBy || 'User';

    scheduleSaveDatabase(currentDb);

    // Broadcast change in real-time to all other open Web Browsers!
    broadcastToAllBrowsers({
      type: 'DATABASE_UPDATED',
      collection,
      data,
      version: currentDb.version,
      lastUpdated: currentDb.lastUpdated,
      lastUpdatedBy: currentDb.lastUpdatedBy,
      senderId: clientId || null,
    });

    console.log(`[Database] Collection "${collection}" updated by "${currentDb.lastUpdatedBy}" (v: ${currentDb.version})`);

    res.json({
      success: true,
      version: currentDb.version,
      lastUpdated: currentDb.lastUpdated,
      lastUpdatedBy: currentDb.lastUpdatedBy,
    });
  });

  // API Route: Bulk update multiple collections at once (e.g., from full Excel import)
  app.post('/api/database/bulk-update', (req: Request, res: Response) => {
    const { updates, updatedBy, clientId } = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid updates object' });
    }

    const validCollections = ['eoffice', 'chkb', 'gbt', 'pensioners', 'gratuity', 'articles'] as const;
    let modified = false;

    for (const key of validCollections) {
      if (Array.isArray(updates[key])) {
        currentDb[key] = updates[key];
        modified = true;
      }
    }

    if (modified) {
      currentDb.version = Date.now();
      currentDb.lastUpdated = new Date().toISOString();
      currentDb.lastUpdatedBy = updatedBy || 'User';
      scheduleSaveDatabase(currentDb);

      broadcastToAllBrowsers({
        type: 'DATABASE_BULK_UPDATED',
        data: {
          eoffice: currentDb.eoffice,
          chkb: currentDb.chkb,
          gbt: currentDb.gbt,
          pensioners: currentDb.pensioners,
          gratuity: currentDb.gratuity,
          articles: currentDb.articles || [],
        },
        version: currentDb.version,
        lastUpdated: currentDb.lastUpdated,
        lastUpdatedBy: currentDb.lastUpdatedBy,
        senderId: clientId || null,
      });
    }

    res.json({
      success: true,
      version: currentDb.version,
      lastUpdated: currentDb.lastUpdated,
      lastUpdatedBy: currentDb.lastUpdatedBy,
    });
  });

  // API Route: Server-Sent Events (SSE) for real-time live synchronization across all Web Browsers
  app.get('/api/database/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    sseClients.add(res);

    // Send initial connection handshake with latest version
    res.write(
      `data: ${JSON.stringify({
        type: 'INIT_SYNC',
        version: currentDb.version,
        lastUpdated: currentDb.lastUpdated,
        lastUpdatedBy: currentDb.lastUpdatedBy,
      })}\n\n`
    );

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Serve Frontend
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Vite middleware mode for instant dev experience
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Municipality FY2570 System listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
