const STORAGE_KEY = 'highlights_v1';

const listEl = document.getElementById('list');
const emptyEl = document.getElementById('empty');
const tpl = document.getElementById('item-tpl');

async function loadHighlights() {
  const { [STORAGE_KEY]: highlights = [] } = await chrome.storage.local.get([STORAGE_KEY]);
  render(highlights);
}

function render(highlights) {
  listEl.innerHTML = '';
  emptyEl.style.display = highlights.length ? 'none' : 'block';

  for (const h of highlights) {
    const node = tpl.content.cloneNode(true);

    const title = node.querySelector('.title');
    title.textContent = h.title || new URL(h.url).hostname;
    title.href = h.url;

    node.querySelector('.time').textContent = new Date(h.createdAt).toLocaleString();
    node.querySelector('.text').textContent = h.text;
    node.querySelector('.ctx-body').textContent = h.selectionContext || '';

    const delBtn = node.querySelector('.delete');
    delBtn.addEventListener('click', async () => {
      await chrome.runtime.sendMessage({ type: 'deleteHighlight', id: h.id });
      loadHighlights();
    });

    node.querySelector('.copy').addEventListener('click', async () => {
      const blob = `${h.text}\n\n— ${h.title}\n${h.url}`;
      await navigator.clipboard.writeText(blob);
    });

    node.querySelector('.summarize').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = 'Summarizing…';
      const summaryEl = btn.closest('.item').querySelector('.summary');
      try {
        const { apiKey, model } = await chrome.storage.local.get(['apiKey', 'model']);
        if (!apiKey) throw new Error('Set API key in Settings (gear icon).');
        const usedModel = model || 'gpt-4o-mini';
        const prompt = `Summarize this highlight in one crisp sentence for later recall. Keep it factual and specific.\n\n\"\"\"${h.text}\"\"\"`;

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: usedModel,
            messages: [
              { role: 'system', content: 'You produce concise, factual summaries.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 80
          })
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `HTTP ${res.status}`);
        }
        const json = await res.json();
        const out = json.choices?.[0]?.message?.content?.trim();
        summaryEl.textContent = out || 'No summary produced.';
      } catch (err) {
        summaryEl.textContent = `Error: ${err.message}`;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Summarize (AI)';
      }
    });

    listEl.appendChild(node);
  }
}

loadHighlights();
