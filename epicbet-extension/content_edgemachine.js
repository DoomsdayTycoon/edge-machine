// ─────────────────────────────────────────────────────────────────────────────
// EDGE MACHINE — content script for edge-machine-opal.vercel.app + localhost
// Reads Epicbet sync data from chrome.storage.local → writes to STAGING key
// The React app shows an approval banner before applying staged data
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY   = '__epicbet_sync__';
const STAGING_KEY   = '__epicbet_staging__';

function stage(data) {
  if (!data) return;
  try {
    // Write to staging — app will show approval banner before applying
    window.localStorage.setItem(STAGING_KEY, JSON.stringify(data));
    window.dispatchEvent(new StorageEvent('storage', {
      key: STAGING_KEY,
      newValue: JSON.stringify(data),
      storageArea: window.localStorage,
    }));
  } catch(e) {}
}

// Stage on load
chrome.storage.local.get([STORAGE_KEY], (result) => {
  stage(result[STORAGE_KEY]);
});

// Re-stage whenever Epicbet pushes new data
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[STORAGE_KEY]) {
    stage(changes[STORAGE_KEY].newValue);
  }
});
