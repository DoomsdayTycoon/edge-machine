// ─────────────────────────────────────────────────────────────────────────────
// EDGE MACHINE — content script for edge-machine-opal.vercel.app + localhost
// Reads Epicbet sync data from chrome.storage.local → injects into localStorage
// The React app polls localStorage key '__epicbet_sync__' to display data
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = '__epicbet_sync__';

function inject(data) {
  if (!data) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Fire a StorageEvent so the React app's useEffect listener picks it up instantly
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: JSON.stringify(data),
      storageArea: window.localStorage,
    }));
  } catch(e) {}
}

// Inject on load
chrome.storage.local.get([STORAGE_KEY], (result) => {
  inject(result[STORAGE_KEY]);
});

// Keep in sync whenever Epicbet updates the storage
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[STORAGE_KEY]) {
    inject(changes[STORAGE_KEY].newValue);
  }
});
