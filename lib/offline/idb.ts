const DB_NAME = "kiosk-guide-offline";
const DB_VERSION = 1;
const KIOSK_DATA_STORE = "kiosk-data";
const FEEDBACK_STORE = "feedback-queue";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(KIOSK_DATA_STORE)) {
        db.createObjectStore(KIOSK_DATA_STORE);
      }
      if (!db.objectStoreNames.contains(FEEDBACK_STORE)) {
        db.createObjectStore(FEEDBACK_STORE, { keyPath: "id" });
      }
    };
  });
}

export async function saveKioskOfflineData<T>(data: T): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(KIOSK_DATA_STORE, "readwrite");
    tx.objectStore(KIOSK_DATA_STORE).put(data, "current");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadKioskOfflineData<T>(): Promise<T | null> {
  const db = await openDb();
  const result = await new Promise<T | null>((resolve, reject) => {
    const tx = db.transaction(KIOSK_DATA_STORE, "readonly");
    const request = tx.objectStore(KIOSK_DATA_STORE).get("current");
    request.onsuccess = () => resolve((request.result as T) ?? null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}

export async function enqueueFeedback<T extends { id: string }>(item: T): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(FEEDBACK_STORE, "readwrite");
    tx.objectStore(FEEDBACK_STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listQueuedFeedback<T>(): Promise<T[]> {
  const db = await openDb();
  const result = await new Promise<T[]>((resolve, reject) => {
    const tx = db.transaction(FEEDBACK_STORE, "readonly");
    const request = tx.objectStore(FEEDBACK_STORE).getAll();
    request.onsuccess = () => resolve((request.result as T[]) ?? []);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}

export async function removeQueuedFeedback(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(FEEDBACK_STORE, "readwrite");
    tx.objectStore(FEEDBACK_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
