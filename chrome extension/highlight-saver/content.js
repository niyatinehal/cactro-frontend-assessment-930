// content.js
// Injects a small floating prompt near the user's text selection to save highlight.

(function () {
  let bubbleEl = null;

  const createBubble = (rect) => {
    if (bubbleEl) bubbleEl.remove();
    bubbleEl = document.createElement('div');
    bubbleEl.className = 'hs-bubble';
    bubbleEl.style.position = 'fixed';
    bubbleEl.style.zIndex = 2147483647;
    bubbleEl.style.top = Math.max(8, rect.top - 40) + 'px';
    bubbleEl.style.left = Math.min(window.innerWidth - 180, Math.max(8, rect.left)) + 'px';
    bubbleEl.style.background = '#111';
    bubbleEl.style.color = '#fff';
    bubbleEl.style.padding = '8px 10px';
    bubbleEl.style.borderRadius = '10px';
    bubbleEl.style.boxShadow = '0 6px 20px rgba(0,0,0,.25)';
    bubbleEl.style.fontFamily = 'system-ui, Arial, sans-serif';
    bubbleEl.style.fontSize = '12px';
    bubbleEl.style.display = 'flex';
    bubbleEl.style.gap = '8px';
    bubbleEl.style.alignItems = 'center';

    const label = document.createElement('span');
    label.textContent = 'Save highlight?';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.background = '#22c55e';
    saveBtn.style.color = '#000';
    saveBtn.style.border = 'none';
    saveBtn.style.borderRadius = '8px';
    saveBtn.style.padding = '4px 8px';
    saveBtn.style.cursor = 'pointer';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '×';
    cancelBtn.title = 'Dismiss';
    cancelBtn.style.background = 'transparent';
    cancelBtn.style.color = '#fff';
    cancelBtn.style.border = '1px solid #444';
    cancelBtn.style.borderRadius = '8px';
    cancelBtn.style.padding = '2px 8px';
    cancelBtn.style.cursor = 'pointer';

    bubbleEl.appendChild(label);
    bubbleEl.appendChild(saveBtn);
    bubbleEl.appendChild(cancelBtn);
    document.body.appendChild(bubbleEl);

    cancelBtn.addEventListener('click', () => bubbleEl?.remove());

    saveBtn.addEventListener('click', async () => {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : '';
      if (!text) return;

      // Try to capture a bit of context (surrounding sentence)
      let selectionContext = '';
      try {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer.nodeType === 3
          ? range.commonAncestorContainer.parentElement
          : range.commonAncestorContainer;
        const block = container?.closest('p,li,blockquote,section,article,div') || document.body;
        selectionContext = (block?.innerText || '').slice(0, 400);
      } catch (e) {}

      chrome.runtime.sendMessage({
        type: 'saveHighlight',
        payload: {
          text,
          url: location.href,
          title: document.title,
          selectionContext,
          color: '#fff59d'
        }
      }, (res) => {
        if (res?.ok) {
          // Mild feedback
          label.textContent = 'Saved!';
          setTimeout(() => bubbleEl?.remove(), 700);
        }
      });
    });
  };

  const maybeShowBubble = () => {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';
    if (!text) {
      bubbleEl?.remove();
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect && rect.width !== 0 && rect.height !== 0) {
      createBubble(rect);
    } else {
      bubbleEl?.remove();
    }
  };

  document.addEventListener('mouseup', () => setTimeout(maybeShowBubble, 0));
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape') bubbleEl?.remove();
    else setTimeout(maybeShowBubble, 0);
  });
})();
