// history.js
// 履歴タブの描画・クリップボードコピー・削除・☆/★トグルを担当する。

// タイムスタンプを6段階で表示する。
function formatTimestamp(unixMs) {
  const now = Date.now();
  const diffMs = now - unixMs;
  const secs  = Math.floor(diffMs / 1000);
  const mins  = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);

  if (secs < 60) return 'たった今';
  if (mins < 60) return `${mins}分前`;
  if (hours < 12) return `${hours}時間前`;

  const itemDate = new Date(unixMs);
  const nowDate  = new Date();
  const toDay    = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  const yesterday = new Date(toDay.getTime() - 86400000);
  const itemDay  = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

  if (itemDay.getTime() === toDay.getTime()) {
    const hh = String(itemDate.getHours()).padStart(2, '0');
    const mm = String(itemDate.getMinutes()).padStart(2, '0');
    return `今日 ${hh}:${mm}`;
  }
  if (itemDay.getTime() === yesterday.getTime()) return '昨日';

  const y = itemDate.getFullYear();
  const m = String(itemDate.getMonth() + 1).padStart(2, '0');
  const d = String(itemDate.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

// 履歴タブを描画する。
async function renderHistoryTab(query = '') {
  const list      = document.getElementById('history-list');
  const empty     = document.getElementById('history-empty');
  const footer    = document.getElementById('footer-count');
  const errorEl   = document.getElementById('history-error');

  hideError(errorEl);
  list.innerHTML = '';

  const [history, favorites] = await Promise.all([getHistory(), getFavorites()]);
  const filtered = query
    ? history.filter(item => item.text.includes(query))
    : history;

  empty.classList.toggle('hidden', filtered.length > 0);
  footer.textContent = `履歴 ${filtered.length} / ${CONSTANTS.MAX_HISTORY}件`;

  filtered.forEach(item => {
    const li = createHistoryItem(item, favorites, errorEl);
    list.appendChild(li);
  });
}

function createHistoryItem(item, favorites, errorEl) {
  const li = document.createElement('li');
  li.dataset.id = item.id;

  const textEl = document.createElement('span');
  textEl.className = 'item-text';
  textEl.textContent = item.text;
  textEl.title = item.text;

  const timeEl = document.createElement('span');
  timeEl.className = 'item-time';
  timeEl.textContent = formatTimestamp(item.copiedAt);

  const actions = document.createElement('div');
  actions.className = 'item-actions';

  // ☆/★ ボタン
  const starBtn = document.createElement('button');
  starBtn.className = 'action-btn' + (isFavorited(item.text, favorites) ? ' starred' : '');
  starBtn.textContent = isFavorited(item.text, favorites) ? '★' : '☆';
  starBtn.title = isFavorited(item.text, favorites) ? 'お気に入りから削除' : 'お気に入りに追加';
  starBtn.dataset.slot = '1';
  starBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      const added = await toggleFavoriteFromHistory(item.text);
      starBtn.textContent = added ? '★' : '☆';
      starBtn.classList.toggle('starred', added);
      starBtn.title = added ? 'お気に入りから削除' : 'お気に入りに追加';
      if (added) {
        delBtn.remove();
      } else {
        actions.append(delBtn);
      }
    } catch (err) {
      showError(errorEl, err.message);
    }
  });

  // 削除ボタン
  const delBtn = document.createElement('button');
  delBtn.className = 'action-btn';
  delBtn.textContent = '🗑';
  delBtn.title = '削除';
  delBtn.dataset.slot = '2';
  delBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await deleteHistoryItem(item.id);
    li.remove();
    const remaining = document.getElementById('history-list').children.length;
    document.getElementById('footer-count').textContent =
      `履歴 ${remaining} / ${CONSTANTS.MAX_HISTORY}件`;
    document.getElementById('history-empty').classList.toggle('hidden', remaining > 0);
  });

  actions.append(starBtn);
  if (!isFavorited(item.text, favorites)) {
    actions.append(delBtn);
  }
  li.append(textEl, timeEl, actions);

  // クリックでクリップボードにコピー・即時ポップアップを閉じる
  li.addEventListener('click', async () => {
    await copyToClipboard(item.text, errorEl);
  });

  return li;
}

// クリップボードにコピーして閉じる。失敗時はインラインエラーを表示。
async function copyToClipboard(text, errorEl) {
  try {
    await navigator.clipboard.writeText(text);
    window.close();
  } catch (err) {
    showError(errorEl, 'コピーに失敗しました。もう一度お試しください。');
  }
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError(el) {
  el.textContent = '';
  el.classList.add('hidden');
}
