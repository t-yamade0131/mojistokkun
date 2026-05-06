// content.js
// 全タブに常時注入し、コピー/カットイベントを検知してchrome.storage.localへ直接書き込む。
// constants.js と storage.js が先にロードされている前提。

async function handleClipboardWrite(e) {
  try {
    // パスワードフィールドからのコピー/カットは記録しない
    if (e.target && e.target.matches('input[type="password"]')) return;

    const text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';

    // 空文字・空白のみは記録しない
    if (text.trim() === '') return;

    await addHistoryItem(text);
  } catch (err) {
    // ストレージ書き込みエラーはサイレントに無視（ユーザー操作を妨げない）
  }
}

document.addEventListener('copy', handleClipboardWrite);
document.addEventListener('cut', handleClipboardWrite);
