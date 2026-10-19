import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { HistoryItem } from '../types';

interface SFCodeDB extends DBSchema {
  history: {
    key: string;
    value: HistoryItem;
    indexes: {
      'by-created': number;
      'by-type': string;
      'by-favorite': number;
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'sfcode_studio_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SFCodeDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<SFCodeDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SFCodeDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('by-created', 'createdAt');
          historyStore.createIndex('by-type', 'type');
          historyStore.createIndex('by-favorite', 'isFavorite');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveHistoryItem(item: HistoryItem): Promise<void> {
  const db = await getDB();
  await db.put('history', item);
}

export async function getHistoryItems(): Promise<HistoryItem[]> {
  const db = await getDB();
  const tx = db.transaction('history', 'readonly');
  const index = tx.store.index('by-created');
  const items = await index.getAll();
  return items.reverse(); // Newest first
}

export async function getHistoryItemById(id: string): Promise<HistoryItem | undefined> {
  const db = await getDB();
  return db.get('history', id);
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const db = await getDB();
  const item = await db.get('history', id);
  if (!item) return false;
  item.isFavorite = !item.isFavorite;
  await db.put('history', item);
  return item.isFavorite;
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('history', id);
}

export async function clearAllHistory(): Promise<void> {
  const db = await getDB();
  await db.clear('history');
}

export async function getHistoryCount(): Promise<number> {
  const db = await getDB();
  return db.count('history');
}

export async function exportDatabaseBackup(): Promise<string> {
  const items = await getHistoryItems();
  const backup = {
    app: 'SFCode Studio',
    version: '1.0.0',
    exportTimestamp: Date.now(),
    history: items,
  };
  return JSON.stringify(backup, null, 2);
}

export async function importDatabaseBackup(jsonString: string): Promise<number> {
  const data = JSON.parse(jsonString);
  if (!data || !Array.isArray(data.history)) {
    throw new Error('Invalid SFCode Studio backup file format');
  }
  const db = await getDB();
  const tx = db.transaction('history', 'readwrite');
  let importedCount = 0;
  for (const item of data.history) {
    if (item.id && item.createdAt && item.type) {
      await tx.store.put(item);
      importedCount++;
    }
  }
  await tx.done;
  return importedCount;
}
