(async function () {
  const apiKeyEl = document.getElementById('apiKey');
  const modelEl = document.getElementById('model');
  const statusEl = document.getElementById('status');
  const saveBtn = document.getElementById('save');

  const existing = await chrome.storage.local.get(['apiKey', 'model']);
  if (existing.apiKey) apiKeyEl.value = existing.apiKey;
  if (existing.model) modelEl.value = existing.model;

  saveBtn.addEventListener('click', async () => {
    const apiKey = apiKeyEl.value.trim();
    const model = modelEl.value;
    await chrome.storage.local.set({ apiKey, model });
    statusEl.textContent = 'Saved ✓';
    statusEl.className = 'ok';
    setTimeout(() => (statusEl.textContent = ''), 2000);
  });
})();