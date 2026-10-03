/* Offline inspection submission queue (IndexedDB). */
(function () {
  'use strict';
  const DB_NAME = 'khadan-rakshak-offline';
  const DB_VERSION = 1;
  const STORE = 'submissions';
  let dbPromise;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB is unavailable in this browser.'));
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open offline storage.'));
    });
    return dbPromise;
  }

  async function withStore(mode, callback) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      let result;
      try { result = callback(store); } catch (e) { reject(e); return; }
      tx.oncomplete = () => resolve(result && result.result !== undefined ? result.result : result);
      tx.onerror = () => reject(tx.error || new Error('Offline storage transaction failed.'));
      tx.onabort = () => reject(tx.error || new Error('Offline storage transaction was aborted.'));
    });
  }

  window.queueSubmission = async function (payload, endpoint) {
    const item = { id: payload.inspection_id || `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`, endpoint, payload, queuedAt: new Date().toISOString() };
    await withStore('readwrite', store => store.put(item));
    await window.updateOfflineQueueIndicator();
    return item;
  };
  window.getQueuedItems = async function () {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error || new Error('Could not read pending submissions.'));
    });
  };
  window.clearQueued = function (id) { return withStore('readwrite', store => store.delete(id)); };

  window.updateOfflineQueueIndicator = async function () {
    const badge = document.getElementById('offline-queue-count');
    if (!badge) return;
    try {
      const items = await window.getQueuedItems();
      badge.textContent = `${items.length} pending sync`;
      badge.classList.toggle('hidden', items.length === 0);
    } catch (e) {
      badge.textContent = 'Offline storage unavailable';
      badge.classList.remove('hidden');
    }
  };

  window.flushOfflineQueue = async function () {
    if (!navigator.onLine || typeof apiPost !== 'function') return;
    let items;
    try { items = await window.getQueuedItems(); } catch (e) { return; }
    if (!items.length) { await window.updateOfflineQueueIndicator(); return; }
    let synced = 0;
    for (const item of items) {
      if (!navigator.onLine) break;
      try {
        await apiPost(item.endpoint, item.payload);
        await window.clearQueued(item.id);
        synced++;
      } catch (e) {
        // Preserve the item and retry on the next reconnect/manual sync.
        break;
      }
    }
    await window.updateOfflineQueueIndicator();
    if (synced && typeof showLiveToast === 'function') {
      showLiveToast('Synced ✓', `${synced} queued inspection submission(s) synced to the backend.`, 'success');
    }
  };

  window.addEventListener('online', () => {
    if (typeof showLiveToast === 'function') showLiveToast('Connection restored', 'Pending inspections will sync now.', 'info');
    window.flushOfflineQueue();
  });
  window.addEventListener('offline', () => {
    if (typeof showLiveToast === 'function') showLiveToast('You are offline', 'Inspection submissions will be saved on this device until connection returns.', 'warning');
  });
  document.addEventListener('DOMContentLoaded', () => {
    const status = document.getElementById('network-status');
    const updateStatus = () => {
      if (!status) return;
      status.textContent = navigator.onLine ? 'Online' : 'Offline';
      status.classList.toggle('network-offline', !navigator.onLine);
      status.classList.toggle('network-online', navigator.onLine);
    };
    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    window.updateOfflineQueueIndicator();
  });
})();
