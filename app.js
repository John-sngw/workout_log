// =============================================
// 筋トレノート：フェーズ1（入力画面）
// =============================================

// ----- localStorage のキー名 -----
const KEY_RECORDS = "workout_records";             // 記録の配列
const KEY_CUSTOM = "workout_custom_exercises";     // 追加した種目の配列
const KEY_SETTINGS = "workout_settings";           // 設定（フェーズ4で使う）

// ----- 部位ごとの初期の種目 -----
const DEFAULT_EXERCISES = {
  "胸": ["ベンチプレス", "ダンベルプレス", "インクラインダンベルプレス", "ダンベルフライ", "チェストプレス", "ケーブルクロスオーバー", "腕立て伏せ"],
  "背中": ["デッドリフト", "懸垂", "ラットプルダウン", "ベントオーバーロウ", "シーテッドロウ", "ワンハンドダンベルロウ"],
  "脚": ["スクワット", "レッグプレス", "レッグエクステンション", "レッグカール", "ブルガリアンスクワット", "カーフレイズ"],
  "肩": ["ショルダープレス", "サイドレイズ", "フロントレイズ", "リアレイズ", "アップライトロウ"],
  "腕": ["バーベルカール", "ダンベルカール", "ハンマーカール", "トライセプスプッシュダウン", "フレンチプレス", "ディップス"],
  "腹": ["クランチ", "レッグレイズ", "プランク", "アブローラー"],
};
const PARTS = Object.keys(DEFAULT_EXERCISES); // 部位の一覧

// ----- 画面の部品を取得 -----
const form = document.getElementById("record-form");
const inputDate = document.getElementById("input-date");
const inputPart = document.getElementById("input-part");
const inputExercise = document.getElementById("input-exercise");
const inputNewExercise = document.getElementById("input-new-exercise");
const btnAddExercise = document.getElementById("btn-add-exercise");
const inputWeight = document.getElementById("input-weight");
const inputReps = document.getElementById("input-reps");
const inputSets = document.getElementById("input-sets");
const inputMemo = document.getElementById("input-memo");
const formError = document.getElementById("form-error");
const btnSubmit = document.getElementById("btn-submit");
const btnCancelEdit = document.getElementById("btn-cancel-edit");
const listTitle = document.getElementById("list-title");
const recordList = document.getElementById("record-list");
const listEmpty = document.getElementById("list-empty");
const historyList = document.getElementById("history-list");
const historyEmpty = document.getElementById("history-empty");

// 編集中の記録のid（編集していないときは null）
let editingId = null;

// =============================================
// localStorage の読み書き
// =============================================

// 保存されたデータを読み込む（なければ初期値を返す）
function load(key, defaultValue) {
  try {
    const text = localStorage.getItem(key);
    return text ? JSON.parse(text) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

// データを保存する
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// =============================================
// 便利な関数
// =============================================

// 今日の日付を "YYYY-MM-DD" で返す（端末の時刻で計算）
function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// "YYYY-MM-DD" を「10月24日(土)」の形にする
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const week = ["日", "月", "火", "水", "木", "金", "土"][new Date(y, m - 1, d).getDay()];
  return `${m}月${d}日(${week})`;
}

// 記録用のidを作る（時刻＋ランダムな文字）
function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// 全角数字を半角にする（「１０」→「10」）
function toHalfWidth(text) {
  return text.replace(/[０-９．]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
}

// =============================================
// 部位・種目の選択肢
// =============================================

// 部位の選択肢を作る
function renderParts() {
  inputPart.innerHTML = "";
  PARTS.forEach((part) => {
    const option = document.createElement("option");
    option.value = part;
    option.textContent = part;
    inputPart.appendChild(option);
  });
}

// 指定した部位の種目一覧を返す（初期の種目＋追加した種目）
function getExercises(part) {
  const custom = load(KEY_CUSTOM, [])
    .filter((item) => item.part === part)
    .map((item) => item.name);
  return [...DEFAULT_EXERCISES[part], ...custom];
}

// 種目の選択肢を作る（selectedName を渡すとそれを選んだ状態にする）
function renderExercises(selectedName) {
  const names = getExercises(inputPart.value);

  // 編集する記録の種目が一覧にない場合も、選べるように追加しておく
  if (selectedName && !names.includes(selectedName)) {
    names.push(selectedName);
  }

  inputExercise.innerHTML = "";
  names.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    inputExercise.appendChild(option);
  });

  if (selectedName) {
    inputExercise.value = selectedName;
  }
}

// 種目を追加する
function addExercise() {
  const name = inputNewExercise.value.trim();
  const part = inputPart.value;

  if (!name) {
    showError("追加する種目名を入力してください");
    return;
  }
  if (getExercises(part).includes(name)) {
    // すでにある種目なら、それを選ぶだけにする
    renderExercises(name);
    inputNewExercise.value = "";
    showError("");
    return;
  }

  const custom = load(KEY_CUSTOM, []);
  custom.push({ part: part, name: name });
  save(KEY_CUSTOM, custom);

  renderExercises(name); // 追加した種目を選んだ状態にする
  inputNewExercise.value = "";
  showError("");
}

// =============================================
// エラー表示
// =============================================

// メッセージを表示する（空文字なら非表示）
function showError(message) {
  formError.textContent = message;
  formError.hidden = !message;
}

// =============================================
// 記録の登録・更新
// =============================================

// フォームの内容をチェックして、記録の形にする（問題があれば null）
function readForm() {
  const date = inputDate.value;
  const weightText = toHalfWidth(inputWeight.value.trim());
  const repsText = toHalfWidth(inputReps.value.trim());
  const setsText = toHalfWidth(inputSets.value.trim());

  if (!date) {
    showError("日付を選んでください");
    return null;
  }
  if (!inputExercise.value) {
    showError("種目を選んでください");
    return null;
  }
  // 重量は空欄OK（自重のとき）。入力した場合は0以上の数字
  if (weightText !== "" && !/^\d+(\.\d+)?$/.test(weightText)) {
    showError("重量は数字で入力してください");
    return null;
  }
  if (!/^\d+$/.test(repsText) || Number(repsText) < 1) {
    showError("回数を入力してください");
    return null;
  }
  if (!/^\d+$/.test(setsText) || Number(setsText) < 1) {
    showError("セット数を入力してください");
    return null;
  }

  showError("");
  return {
    date: date,
    part: inputPart.value,
    exercise: inputExercise.value,
    weight: weightText === "" ? 0 : Number(weightText), // 自重は 0 で保存
    reps: Number(repsText),
    sets: Number(setsText),
    memo: inputMemo.value.trim(),
  };
}

// 登録ボタン（または更新ボタン）を押したとき
function handleSubmit(event) {
  event.preventDefault(); // ページの再読み込みを防ぐ

  const data = readForm();
  if (!data) return;

  const records = load(KEY_RECORDS, []);

  if (editingId) {
    // 編集中なら、その記録を書き換える
    const index = records.findIndex((r) => r.id === editingId);
    if (index !== -1) {
      records[index] = { id: editingId, ...data };
    }
  } else {
    // 新しい記録を追加する
    records.push({ id: createId(), ...data });
  }
  save(KEY_RECORDS, records);

  // 次の入力に備えて、重量・回数・セット・メモだけ空にする
  // （日付・部位・種目はそのまま残すので、続けて登録しやすい）
  clearNumbers();
  endEdit();
  renderAll();
}

// 重量・回数・セット・メモを空にする
function clearNumbers() {
  inputWeight.value = "";
  inputReps.value = "";
  inputSets.value = "";
  inputMemo.value = "";
}

// =============================================
// 記録の編集・削除
// =============================================

// 編集を始める（記録の内容をフォームに入れる）
function startEdit(id) {
  const record = load(KEY_RECORDS, []).find((r) => r.id === id);
  if (!record) return;

  editingId = id;
  inputDate.value = record.date;
  inputPart.value = record.part;
  renderExercises(record.exercise);
  inputWeight.value = record.weight === 0 ? "" : String(record.weight);
  inputReps.value = String(record.reps);
  inputSets.value = String(record.sets);
  inputMemo.value = record.memo || "";

  btnSubmit.textContent = "更新する";
  btnCancelEdit.hidden = false;
  showError("");
  renderAll();

  // フォームが見えるように上へスクロール
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

// 編集をやめる（フォームを登録モードに戻す）
function endEdit() {
  editingId = null;
  btnSubmit.textContent = "登録する";
  btnCancelEdit.hidden = true;
}

// 「編集をやめる」ボタンを押したとき
function cancelEdit() {
  clearNumbers();
  endEdit();
  showError("");
  renderAll();
}

// 記録を削除する
function deleteRecord(id) {
  const records = load(KEY_RECORDS, []);
  const record = records.find((r) => r.id === id);
  if (!record) return;

  if (!confirm(`「${record.exercise}」の記録を削除しますか？`)) return;

  save(KEY_RECORDS, records.filter((r) => r.id !== id));

  // 編集中の記録を削除した場合は、編集をやめる
  if (editingId === id) {
    clearNumbers();
    endEdit();
  }
  renderAll();
}

// 入力画面と履歴の、両方の一覧を作り直す
function renderAll() {
  renderList();
  renderHistory();
}

// =============================================
// 記録1件分の表示（入力画面と履歴で共通）
// =============================================

// 記録1件分の部品（li）を作る
// onEdit：「編集」を押したときに実行する処理
function createRecordItem(record, onEdit) {
  const li = document.createElement("li");
  li.className = "record-item";
  if (record.id === editingId) li.classList.add("is-editing");

  // 1行目：部位と種目
  const head = document.createElement("div");
  head.className = "record-head";
  const part = document.createElement("span");
  part.className = "record-part";
  part.textContent = record.part;
  const exercise = document.createElement("span");
  exercise.className = "record-exercise";
  exercise.textContent = record.exercise;
  head.append(part, exercise);

  // 2行目：重量 × 回数 × セット
  const detail = document.createElement("div");
  detail.className = "record-detail";
  const weightText = record.weight === 0 ? "自重" : `${record.weight}kg`;
  detail.textContent = `${weightText} × ${record.reps}回 × ${record.sets}セット`;

  li.append(head, detail);

  // 3行目：メモ（あるときだけ）
  if (record.memo) {
    const memo = document.createElement("div");
    memo.className = "record-memo";
    memo.textContent = record.memo;
    li.appendChild(memo);
  }

  // 編集・削除ボタン
  const actions = document.createElement("div");
  actions.className = "record-actions";
  const btnEdit = document.createElement("button");
  btnEdit.type = "button";
  btnEdit.textContent = "編集";
  btnEdit.addEventListener("click", onEdit);
  const btnDelete = document.createElement("button");
  btnDelete.type = "button";
  btnDelete.className = "btn-delete";
  btnDelete.textContent = "削除";
  btnDelete.addEventListener("click", () => deleteRecord(record.id));
  actions.append(btnEdit, btnDelete);
  li.appendChild(actions);

  return li;
}

// =============================================
// その日の記録一覧（入力画面の下）
// =============================================

// 選んでいる日付の記録を一覧表示する
function renderList() {
  const date = inputDate.value;
  const records = load(KEY_RECORDS, []).filter((r) => r.date === date);

  listTitle.textContent = date ? `${formatDate(date)}の記録` : "この日の記録";
  recordList.innerHTML = "";
  listEmpty.hidden = records.length > 0;

  records.forEach((record) => {
    recordList.appendChild(createRecordItem(record, () => startEdit(record.id)));
  });
}

// =============================================
// 履歴の一覧（カレンダータブ）
// =============================================

// すべての記録を、日付ごとに新しい順で表示する
function renderHistory() {
  const records = load(KEY_RECORDS, []);

  // 日付ごとにまとめる（例：{ "2026-10-24": [記録, 記録], ... }）
  const byDate = {};
  records.forEach((record) => {
    if (!byDate[record.date]) byDate[record.date] = [];
    byDate[record.date].push(record);
  });

  // 日付を新しい順に並べる（"YYYY-MM-DD" は文字の順番がそのまま日付の順番になる）
  const dates = Object.keys(byDate).sort().reverse();

  historyList.innerHTML = "";
  historyEmpty.hidden = dates.length > 0;

  dates.forEach((date) => {
    const dayRecords = byDate[date];
    const day = document.createElement("section");
    day.className = "history-day";

    // 見出し：日付と、その日に鍛えた部位（重複なし）
    const head = document.createElement("h2");
    head.className = "history-day-head";
    const dateLabel = document.createElement("span");
    dateLabel.className = "history-date";
    dateLabel.textContent = formatDate(date);
    const parts = document.createElement("span");
    parts.className = "history-parts";
    // 部位を、選択肢と同じ順番（胸・背中・脚…）で並べる
    const partNames = PARTS.filter((p) => dayRecords.some((r) => r.part === p));
    parts.textContent = partNames.join("・");
    head.append(dateLabel, parts);

    // その日の記録
    const list = document.createElement("ul");
    list.className = "record-list";
    dayRecords.forEach((record) => {
      list.appendChild(createRecordItem(record, () => editFromHistory(record.id)));
    });

    day.append(head, list);
    historyList.appendChild(day);
  });
}

// 履歴から「編集」を押したとき：入力画面に移動して編集を始める
function editFromHistory(id) {
  showScreen("input");
  startEdit(id);
}

// =============================================
// 画面下部のタブ切り替え
// =============================================

// 指定した画面（"home" / "calendar" / "input"）に切り替える
function showScreen(name) {
  // 対応するタブだけ色を付ける
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.screen === name);
  });
  // 対応する画面だけ表示する
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.hidden = screen.id !== `screen-${name}`;
  });
  window.scrollTo(0, 0);
}

function setupTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => showScreen(tab.dataset.screen));
  });
}

// =============================================
// 最初に1回だけ実行する処理
// =============================================

function init() {
  // 設定がまだなければ初期値を保存しておく（フェーズ4で使う）
  if (!localStorage.getItem(KEY_SETTINGS)) {
    save(KEY_SETTINGS, { targetDays: [] });
  }

  inputDate.value = todayString(); // 日付の初期値は今日
  renderParts();
  renderExercises();
  renderAll();
  setupTabs();

  // 各操作に処理をつなぐ
  form.addEventListener("submit", handleSubmit);
  inputPart.addEventListener("change", () => renderExercises());
  inputDate.addEventListener("change", renderList);
  btnAddExercise.addEventListener("click", addExercise);
  btnCancelEdit.addEventListener("click", cancelEdit);

  // 種目追加の欄でEnter（完了）を押したら、登録ではなく種目の追加にする
  inputNewExercise.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addExercise();
    }
  });
}

init();
