// options.js
// オプションビューのお気に入りCRUD（追加・編集・削除）を担当する。

let editingFavoriteId = null; // null=新規追加モード, string=編集モード

async function renderOptionsView() {
  const list     = document.getElementById('options-list');
  const empty    = document.getElementById('options-empty');

  closeFavoriteForm();
  list.innerHTML = '';

  const favorites = await getFavorites();
  empty.classList.toggle('hidden', favorites.length > 0);

  favorites.forEach(item => {
    const li = createOptionsItem(item);
    list.appendChild(li);
  });

  setupOptionsToolbar();
}

function setupOptionsToolbar() {
  const addBtn = document.getElementById('btn-add-favorite');
  // 古いイベントリスナーを除去するためにcloneして付け替える
  const newAddBtn = addBtn.cloneNode(true);
  addBtn.parentNode.replaceChild(newAddBtn, addBtn);
  newAddBtn.addEventListener('click', () => {
    openFavoriteForm(null);
  });
}

function createOptionsItem(item) {
  const li = document.createElement('li');
  li.dataset.id = item.id;

  const textEl = document.createElement('span');
  textEl.className = 'item-text';
  textEl.textContent = item.title;
  textEl.title = item.title;

  const actions = document.createElement('div');
  actions.className = 'item-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'action-btn';
  editBtn.textContent = '✏️';
  editBtn.title = '編集';
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openFavoriteForm(item);
  });

  const delBtn = document.createElement('button');
  delBtn.className = 'action-btn';
  delBtn.textContent = '🗑';
  delBtn.title = '削除';
  delBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await deleteFavorite(item.id);
    li.remove();
    const remaining = document.getElementById('options-list').children.length;
    document.getElementById('options-empty').classList.toggle('hidden', remaining > 0);
  });

  actions.append(editBtn, delBtn);
  li.append(textEl, actions);
  return li;
}

// フォームを開く。item=nullなら新規追加、itemがあれば編集。
function openFavoriteForm(item) {
  editingFavoriteId = item ? item.id : null;

  const titleInput = document.getElementById('form-title');
  const textInput  = document.getElementById('form-text');
  const charCount  = document.getElementById('form-char-count');
  const errorEl    = document.getElementById('form-error');

  titleInput.value = item ? item.title : '';
  textInput.value  = item ? item.text  : '';
  charCount.textContent = `${textInput.value.length} / ${CONSTANTS.MAX_TEXT_LENGTH}`;
  hideError(errorEl);

  textInput.oninput = () => {
    charCount.textContent = `${textInput.value.length} / ${CONSTANTS.MAX_TEXT_LENGTH}`;
  };

  const saveBtn   = document.getElementById('btn-form-save');
  const cancelBtn = document.getElementById('btn-form-cancel');

  const newSaveBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
  newSaveBtn.addEventListener('click', async () => {
    await saveFavoriteForm(errorEl);
  });

  const newCancelBtn = cancelBtn.cloneNode(true);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  newCancelBtn.addEventListener('click', closeFavoriteForm);

  document.getElementById('favorite-form').classList.remove('hidden');
  titleInput.focus();
}

// フォームの保存処理。
async function saveFavoriteForm(errorEl) {
  const title = document.getElementById('form-title').value.trim();
  const text  = document.getElementById('form-text').value.trim();

  if (title === '') {
    showError(errorEl, 'タイトルを入力してください。');
    return;
  }
  if (text === '') {
    showError(errorEl, '本文を入力してください。');
    return;
  }

  try {
    if (editingFavoriteId) {
      await updateFavorite(editingFavoriteId, title, text);
    } else {
      await addFavorite(title, text);
    }
    closeFavoriteForm();
    await renderOptionsView();
  } catch (err) {
    showError(errorEl, err.message);
  }
}

// フォームを閉じる。
function closeFavoriteForm() {
  editingFavoriteId = null;
  document.getElementById('favorite-form').classList.add('hidden');
  document.getElementById('form-title').value = '';
  document.getElementById('form-text').value  = '';
  document.getElementById('form-char-count').textContent = `0 / ${CONSTANTS.MAX_TEXT_LENGTH}`;
  hideError(document.getElementById('form-error'));
}
