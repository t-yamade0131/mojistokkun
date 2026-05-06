// shared/storage.js
// chrome.storage.local の読み書きを集約する。CONSTANTS が先にロードされている前提。

async function getHistory() {
  const result = await chrome.storage.local.get(CONSTANTS.STORAGE_KEY_HISTORY);
  return result[CONSTANTS.STORAGE_KEY_HISTORY] || [];
}

async function saveHistory(history) {
  await chrome.storage.local.set({ [CONSTANTS.STORAGE_KEY_HISTORY]: history });
}

async function getFavorites() {
  const result = await chrome.storage.local.get(CONSTANTS.STORAGE_KEY_FAVORITES);
  return result[CONSTANTS.STORAGE_KEY_FAVORITES] || [];
}

async function saveFavorites(favorites) {
  await chrome.storage.local.set({ [CONSTANTS.STORAGE_KEY_FAVORITES]: favorites });
}

// 履歴にアイテムを追加する。重複は先頭移動・上限超過は末尾削除。
async function addHistoryItem(text) {
  let history = await getHistory();
  const existingIdx = history.findIndex(item => item.text === text);
  if (existingIdx >= 0) {
    history.splice(existingIdx, 1);
  }
  history.unshift({
    id: crypto.randomUUID(),
    text,
    copiedAt: Date.now(),
  });
  if (history.length > CONSTANTS.MAX_HISTORY) {
    history = history.slice(0, CONSTANTS.MAX_HISTORY);
  }
  await saveHistory(history);
}

// 指定IDの履歴アイテムを削除する。
async function deleteHistoryItem(id) {
  let history = await getHistory();
  history = history.filter(item => item.id !== id);
  await saveHistory(history);
}

// お気に入りに追加する（上限チェックあり）。
async function addFavorite(title, text) {
  const favorites = await getFavorites();
  if (favorites.length >= CONSTANTS.MAX_FAVORITES) {
    throw new Error(`お気に入りは最大${CONSTANTS.MAX_FAVORITES}件まで登録できます。`);
  }
  favorites.push({
    id: crypto.randomUUID(),
    title: title.slice(0, CONSTANTS.MAX_TITLE_LENGTH),
    text: text.slice(0, CONSTANTS.MAX_TEXT_LENGTH),
    createdAt: Date.now(),
  });
  await saveFavorites(favorites);
}

// 指定IDのお気に入りを更新する。
async function updateFavorite(id, title, text) {
  const favorites = await getFavorites();
  const idx = favorites.findIndex(f => f.id === id);
  if (idx < 0) return;
  favorites[idx].title = title.slice(0, CONSTANTS.MAX_TITLE_LENGTH);
  favorites[idx].text = text.slice(0, CONSTANTS.MAX_TEXT_LENGTH);
  await saveFavorites(favorites);
}

// 指定IDのお気に入りを削除する。
async function deleteFavorite(id) {
  let favorites = await getFavorites();
  favorites = favorites.filter(f => f.id !== id);
  await saveFavorites(favorites);
}

// テキストがお気に入りに存在するか確認する（☆/★判定）。
function isFavorited(text, favorites) {
  return favorites.some(f => f.text === text);
}

// 履歴テキストをお気に入りにトグルする（☆/★）。
async function toggleFavoriteFromHistory(text) {
  const favorites = await getFavorites();
  const existingIdx = favorites.findIndex(f => f.text === text);
  if (existingIdx >= 0) {
    favorites.splice(existingIdx, 1);
    await saveFavorites(favorites);
    return false; // ★→☆（削除）
  } else {
    if (favorites.length >= CONSTANTS.MAX_FAVORITES) {
      throw new Error(`お気に入りは最大${CONSTANTS.MAX_FAVORITES}件まで登録できます。`);
    }
    const title = text.slice(0, CONSTANTS.MAX_TITLE_LENGTH);
    favorites.push({
      id: crypto.randomUUID(),
      title,
      text: text.slice(0, CONSTANTS.MAX_TEXT_LENGTH),
      createdAt: Date.now(),
    });
    await saveFavorites(favorites);
    return true; // ☆→★（追加）
  }
}
