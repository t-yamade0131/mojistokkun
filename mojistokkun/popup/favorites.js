// favorites.js
// お気に入りタブの描画・コピー・プレビューパネルを担当する。

async function renderFavoritesTab(query = '') {
  const list    = document.getElementById('favorites-list');
  const empty   = document.getElementById('favorites-empty');
  const footer  = document.getElementById('footer-count');
  const errorEl = document.getElementById('favorites-error');
  const listView = document.getElementById('favorites-list-view');
  const previewPanel = document.getElementById('preview-panel');

  hideError(errorEl);
  closePreviewPanel();
  list.innerHTML = '';

  const favorites = await getFavorites();
  const filtered = query
    ? favorites.filter(f => f.title.includes(query) || f.text.includes(query))
    : favorites;

  listView.classList.remove('hidden');
  empty.classList.toggle('hidden', filtered.length > 0);
  footer.textContent = `お気に入り ${filtered.length} / ${CONSTANTS.MAX_FAVORITES}件`;

  filtered.forEach(item => {
    const li = createFavoriteItem(item, errorEl);
    list.appendChild(li);
  });
}

function createFavoriteItem(item, errorEl) {
  const li = document.createElement('li');
  li.dataset.id = item.id;

  const textEl = document.createElement('span');
  textEl.className = 'item-text';
  textEl.textContent = item.title;
  textEl.title = item.title;

  const actions = document.createElement('div');
  actions.className = 'item-actions';

  const previewBtn = document.createElement('button');
  previewBtn.className = 'action-btn';
  previewBtn.textContent = '👁';
  previewBtn.title = 'プレビュー';
  previewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openPreviewPanel(item, errorEl);
  });

  actions.append(previewBtn);
  li.append(textEl, actions);

  li.addEventListener('click', async () => {
    await copyToClipboard(item.text, errorEl);
  });

  return li;
}

// プレビューパネルを開く。
function openPreviewPanel(item, errorEl) {
  const listView    = document.getElementById('favorites-list-view');
  const panel       = document.getElementById('preview-panel');
  const titleEl     = document.getElementById('preview-title');
  const textEl      = document.getElementById('preview-text');
  const charCount   = document.getElementById('preview-char-count');
  const copyBtn     = document.getElementById('btn-preview-copy');
  const previewErr  = document.getElementById('preview-error');

  titleEl.textContent    = item.title;
  textEl.value           = item.text;
  charCount.textContent  = `${item.text.length}文字`;
  hideError(previewErr);

  // コピーボタンのイベントを毎回付け替える（古いリスナーを除去）
  const newCopyBtn = copyBtn.cloneNode(true);
  copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);
  newCopyBtn.addEventListener('click', async () => {
    await copyToClipboard(item.text, previewErr);
  });

  listView.classList.add('hidden');
  panel.classList.remove('hidden');

  document.getElementById('btn-preview-back').onclick = closePreviewPanel;
}

// プレビューパネルを閉じる。
function closePreviewPanel() {
  document.getElementById('favorites-list-view').classList.remove('hidden');
  document.getElementById('preview-panel').classList.add('hidden');
}
