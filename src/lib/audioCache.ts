/**
 * Local IndexedDB Audio Blob Storage for persistent offline audio playback
 */

const DB_NAME = 'soriya_voice_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_blobs';

function openAudioDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function cacheAudioBlob(id: string, blob: Blob, mimeType?: string): Promise<void> {
  try {
    const db = await openAudioDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record = {
        id,
        blob,
        mimeType: mimeType || blob.type || 'audio/wav',
        savedAt: Date.now(),
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = (e: any) => reject(e.target.error);
    });
  } catch (err) {
    console.warn('Failed to cache audio in IndexedDB:', err);
  }
}

export async function getCachedAudioBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openAudioDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = (e: any) => {
        const res = e.target.result;
        resolve(res ? res.blob : null);
      };
      req.onerror = (e: any) => reject(e.target.error);
    });
  } catch (err) {
    console.warn('Failed to get cached audio from IndexedDB:', err);
    return null;
  }
}

export async function getCachedAudioUrl(id: string, fallbackUrl: string): Promise<string> {
  try {
    const blob = await getCachedAudioBlob(id);
    if (blob) {
      return URL.createObjectURL(blob);
    }
  } catch (err) {
    console.warn('Error reading audio blob URL:', err);
  }
  return fallbackUrl;
}

export async function fetchAndCacheAudio(id: string, audioUrl: string): Promise<void> {
  try {
    const res = await fetch(audioUrl);
    if (res.ok) {
      const blob = await res.blob();
      await cacheAudioBlob(id, blob, blob.type);
    }
  } catch (err) {
    console.warn('Failed to fetch and cache audio from server:', err);
  }
}

export async function deleteCachedAudio(id: string): Promise<void> {
  try {
    const db = await openAudioDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = (e: any) => reject(e.target.error);
    });
  } catch (err) {
    console.warn('Failed to delete cached audio:', err);
  }
}

export async function clearAllCachedAudio(): Promise<void> {
  try {
    const db = await openAudioDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = (e: any) => reject(e.target.error);
    });
  } catch (err) {
    console.warn('Failed to clear all cached audio:', err);
  }
}
