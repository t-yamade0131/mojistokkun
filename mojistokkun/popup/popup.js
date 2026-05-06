// popup.js
// 初期化・ビュー切り替え（main↔options）・タブ切り替え（履歴↔お気に入り）を担当する。
// history.js / favorites.js / options.js の関数が先にロードされている前提。

let currentTab = 'history'; // 'history' | 'favorites'
let currentSlot = 0; // 0=アイテム本体, 1=☆ボタン, 2=🗑ボタン

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', async () => {
  setupViewSwitching();
  setupTabSwitching();
  setupSearch();
  setupKeyboardNav();
  await renderCurrentTab();
});

// ===== ビュー切り替え（メイン ↔ オプション）=====
function setupViewSwitching() {
  document.getElementById('btn-open-options').addEventListener('click', async () => {
    showView('options');
    await renderOptionsView();
  });

  document.getElementById('btn-options-back').addEventListener('click', () => {
    showView('main');
    renderCurrentTab();
  });
}

function showView(view) {
  const isOptions = view === 'options';
  document.getElementById('main-view').classList.toggle('hidden', isOptions);
  document.getElementById('options-view').classList.toggle('hidden', !isOptions);
}

// ===== タブ切り替え =====
function setupTabSwitching() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const tab = btn.dataset.tab;
      if (tab === currentTab) return;
      currentTab = tab;
      currentSlot = 0;

      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.getElementById('tab-history').classList.toggle('active', tab === 'history');
      document.getElementById('tab-history').classList.toggle('hidden', tab !== 'history');
      document.getElementById('tab-favorites').classList.toggle('hidden', tab === 'history');

      document.getElementById('search-input').value = '';
      await renderCurrentTab();
    });
  });
}

async function renderCurrentTab() {
  const query = document.getElementById('search-input').value.trim();
  if (currentTab === 'history') {
    await renderHistoryTab(query);
  } else {
    await renderFavoritesTab(query);
  }
}

// ===== 検索 =====
function setupSearch() {
  const input = document.getElementById('search-input');
  input.addEventListener('input', async () => {
    await renderCurrentTab();
  });
}

// ===== キーボードナビゲーション =====
function setupKeyboardNav() {
  document.addEventListener('keydown', async (e) => {
    // --- Ctrl+F: 検索バーにフォーカス ---
    if (e.ctrlKey && e.key === 'f') {
      const optionsVisible = !document.getElementById('options-view').classList.contains('hidden');
      if (!optionsVisible) {
        e.preventDefault();
        const input = document.getElementById('search-input');
        input.focus();
        input.select();
      }
      return;
    }

    // --- Tab: タブ切り替え（履歴 ↔ お気に入り）---
    if (e.key === 'Tab') {
      const activeEl = document.activeElement;
      const inInput = activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA';
      const optionsVisible = !document.getElementById('options-view').classList.contains('hidden');
      if (!inInput && !optionsVisible) {
        e.preventDefault();
        const newTab = currentTab === 'history' ? 'favorites' : 'history';
        document.querySelector(`.tab-btn[data-tab="${newTab}"]`).click();
        currentSlot = 0;
      }
      return;
    }

    // --- Escape: 階層を1段階戻る ---
    if (e.key === 'Escape') {
      const previewPanel = document.getElementById('preview-panel');
      if (!previewPanel.classList.contains('hidden')) {
        closePreviewPanel();
        return;
      }
      const form = document.getElementById('favorite-form');
      if (!form.classList.contains('hidden')) {
        closeFavoriteForm();
        return;
      }
      if (!document.getElementById('options-view').classList.contains('hidden')) {
        showView('main');
        renderCurrentTab();
        return;
      }
      window.close();
      return;
    }

    // --- ↑↓←→ / Enter: リスト操作 ---
    const activeList = getActiveList();
    if (!activeList) return;

    const items = Array.from(activeList.querySelectorAll('li'));
    const selected = activeList.querySelector('li.selected');
    const selectedIdx = items.indexOf(selected);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      currentSlot = 0;
      const next = items[selectedIdx + 1] || items[0];
      if (next) selectListItem(activeList, next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      currentSlot = 0;
      const prev = items[selectedIdx - 1] || items[items.length - 1];
      if (prev) selectListItem(activeList, prev);
    } else if (e.key === 'ArrowRight' && currentTab === 'history' && selected) {
      e.preventDefault();
      const slots = getItemSlots(selected);
      const curIdx = slots.indexOf(currentSlot);
      currentSlot = slots[(curIdx + 1) % slots.length];
      updateSlotFocus(selected, currentSlot);
    } else if (e.key === 'ArrowLeft' && currentTab === 'history' && selected) {
      e.preventDefault();
      const slots = getItemSlots(selected);
      const curIdx = slots.indexOf(currentSlot);
      currentSlot = slots[(curIdx - 1 + slots.length) % slots.length];
      updateSlotFocus(selected, currentSlot);
    } else if (e.key === 'Enter') {
      if (selected) {
        if (currentSlot === 0) {
          selected.click();
        } else {
          const btn = selected.querySelector(`[data-slot="${currentSlot}"]`);
          if (btn) btn.click();
        }
      }
    }
  });
}

function getActiveList() {
  if (!document.getElementById('options-view').classList.contains('hidden')) {
    return document.getElementById('options-list');
  }
  if (currentTab === 'history') return document.getElementById('history-list');
  const previewPanel = document.getElementById('preview-panel');
  if (previewPanel.classList.contains('hidden')) {
    return document.getElementById('favorites-list');
  }
  return null;
}

function selectListItem(list, item) {
  list.querySelectorAll('li').forEach(li => {
    li.classList.remove('selected');
    li.querySelectorAll('[data-slot]').forEach(btn => btn.classList.remove('slot-focused'));
  });
  item.classList.add('selected');
  item.scrollIntoView({ block: 'nearest' });
}

// 現在選択中アイテムの有効スロット番号一覧を返す（0=本体, 1=☆, 2=🗑）
function getItemSlots(li) {
  const btnSlots = Array.from(li.querySelectorAll('[data-slot]'))
    .map(b => parseInt(b.dataset.slot))
    .sort((a, b) => a - b);
  return [0, ...btnSlots];
}

// スロットフォーカスのハイライトを更新する
function updateSlotFocus(li, slot) {
  li.querySelectorAll('[data-slot]').forEach(btn => btn.classList.remove('slot-focused'));
  if (slot > 0) {
    const btn = li.querySelector(`[data-slot="${slot}"]`);
    if (btn) btn.classList.add('slot-focused');
  }
}
