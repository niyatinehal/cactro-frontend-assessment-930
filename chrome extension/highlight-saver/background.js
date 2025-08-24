// background.js
// Stores and retrieves highlights from chrome.storage.local

const STORAGE_KEY = 'highlights_v1';

// Ensure storage is initialized
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get([STORAGE_KEY]);
  if (!data[STORAGE_KEY]) {
    await chrome.storage.local.set({ [STORAGE_KEY]: [] });
  }
});

// Message router
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message?.type === 'saveHighlight') {
      const { text, url, title, selectionContext, color } = message.payload;
      const createdAt = new Date().toISOString();
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const store = await chrome.storage.local.get([STORAGE_KEY]);
      const highlights = store[STORAGE_KEY] || [];
      highlights.unshift({ id, text, url, title, selectionContext, color: color || '#fff59d', createdAt });
      await chrome.storage.local.set({ [STORAGE_KEY]: highlights });
      sendResponse({ ok: true, id });
    }

    if (message?.type === 'getHighlights') {
      const store = await chrome.storage.local.get([STORAGE_KEY]);
      sendResponse({ ok: true, highlights: store[STORAGE_KEY] || [] });
    }

    if (message?.type === 'deleteHighlight') {
      const { id } = message;
      const store = await chrome.storage.local.get([STORAGE_KEY]);
      const highlights = (store[STORAGE_KEY] || []).filter(h => h.id !== id);
      await chrome.storage.local.set({ [STORAGE_KEY]: highlights });
      sendResponse({ ok: true });
    }
  })();

  // Required to indicate async response
  return true;
});
