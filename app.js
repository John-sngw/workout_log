// =============================================
// 筋トレノート：フェーズ1（入力画面）
// =============================================

// ----- localStorage のキー名 -----
const KEY_RECORDS = "workout_records";             // 記録の配列
const KEY_CUSTOM = "workout_custom_exercises";     // 追加した種目の配列
const KEY_SETTINGS = "workout_settings";           // 設定（週ごとの行く曜日）

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
const addExerciseBox = document.getElementById("add-exercise");
const inputNewExercise = document.getElementById("input-new-exercise");
const btnAddExercise = document.getElementById("btn-add-exercise");
const btnCancelExercise = document.getElementById("btn-cancel-exercise");
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
const calTitle = document.getElementById("cal-title");
const calGrid = document.getElementById("cal-grid");
const btnCalPrev = document.getElementById("cal-prev");
const btnCalNext = document.getElementById("cal-next");

const homeRange = document.getElementById("home-range");
const homeDone = document.getElementById("home-done");
const homeTarget = document.getElementById("home-target");
const homeMessage = document.getElementById("home-message");
const homeDays = document.getElementById("home-days");
const btnEditPlan = document.getElementById("btn-edit-plan");
const planModal = document.getElementById("plan-modal");
const planTitle = document.getElementById("plan-title");
const planDays = document.getElementById("plan-days");
const planCount = document.getElementById("plan-count");
const btnPlanOk = document.getElementById("plan-ok");
const btnPlanLater = document.getElementById("plan-later");
const btnPlanRest = document.getElementById("plan-rest");

const rankList = document.getElementById("rank-list");
const rankEmpty = document.getElementById("rank-empty");
const partList = document.getElementById("part-list");
const partEmpty = document.getElementById("part-empty");
const pbModal = document.getElementById("pb-modal");
const pbLabel = document.getElementById("pb-label");
const pbTitle = document.getElementById("pb-title");
const pbAnimal = document.getElementById("pb-animal");
const pbAnimalText = document.getElementById("pb-animal-text");
const pbDetail = document.getElementById("pb-detail");
const btnPbOk = document.getElementById("pb-ok");

// 種目別で開いている部位と、グラフを開いている種目
const openParts = new Set();
let openExerciseKey = null;

// 曜日の名前（0=日 〜 6=土）
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

// 予定の登録メッセージで選んでいる曜日（0=日 〜 6=土）
let planSelected = [];

// カレンダーで表示している年と月（月は 0=1月 〜 11=12月）
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();

// 編集中の記録のid（編集していないときは null）
let editingId = null;

// 種目のプルダウンの最後に出す「新しい種目を入力」の値（種目名と重ならない特別な値）
const NEW_EXERCISE = "__new__";

// 「新しい種目を入力」を選ぶ前に選んでいた種目（キャンセルしたら元に戻すため）
let lastExercise = "";

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

  // いちばん下に「新しい種目を入力」を追加する
  const newOption = document.createElement("option");
  newOption.value = NEW_EXERCISE;
  newOption.textContent = "＋ 新しい種目を入力";
  inputExercise.appendChild(newOption);

  if (selectedName) {
    inputExercise.value = selectedName;
  }
  lastExercise = inputExercise.value;
  closeAddExercise();
}

// 種目のプルダウンを変えたとき
function handleExerciseChange() {
  if (inputExercise.value === NEW_EXERCISE) {
    // 「新しい種目を入力」を選んだら、追加の欄を表示する
    addExerciseBox.hidden = false;
    inputNewExercise.focus();
  } else {
    lastExercise = inputExercise.value;
    closeAddExercise();
  }
}

// 種目の追加の欄を閉じる
function closeAddExercise() {
  addExerciseBox.hidden = true;
  inputNewExercise.value = "";
}

// 種目の追加をやめる（直前に選んでいた種目に戻す）
function cancelAddExercise() {
  inputExercise.value = lastExercise;
  closeAddExercise();
  showError("");
}

// 種目を追加する
function addExercise() {
  const name = inputNewExercise.value.trim();
  const part = inputPart.value;

  if (!name) {
    showError("追加する種目名を入力してください");
    return;
  }

  // まだない種目なら保存する（すでにある種目なら、それを選ぶだけ）
  if (!getExercises(part).includes(name)) {
    const custom = load(KEY_CUSTOM, []);
    custom.push({ part: part, name: name });
    save(KEY_CUSTOM, custom);
  }

  renderExercises(name); // 追加した種目を選んだ状態にする（追加の欄も閉じる）
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
  if (inputExercise.value === NEW_EXERCISE) {
    showError("新しい種目を「追加」するか、キャンセルしてください");
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
  const isNew = !editingId;

  // 登録する前の、この種目の自己ベスト（お祝いメッセージの判定に使う）
  const before = isNew ? getBests(records)[bestKey(data)] : null;

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

  // 新しく登録したときだけ、自己ベストを更新していたらお祝いする（編集では出さない）
  if (isNew) celebrateIfBest(data, before);
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
  renderCalendar();
  renderHome();
  renderRanking();
  renderPartList();
}

// =============================================
// 記録の表示（入力画面と履歴で共通）
// =============================================

// 連続して登録した「同じ部位・同じ種目」の記録を1つのグループにまとめる
// 例：[ベンチ, ベンチ, カール, ベンチ] → [[ベンチ, ベンチ], [カール], [ベンチ]]
// （間に別の種目が入ったら別のグループにする。スーパーセットなどの順番を残すため）
function groupConsecutive(records) {
  const groups = [];
  records.forEach((record) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup[0].part === record.part && lastGroup[0].exercise === record.exercise) {
      lastGroup.push(record);
    } else {
      groups.push([record]);
    }
  });
  return groups;
}

// 1つのグループ（同じ種目の連続した記録）を、1つの枠（li）にして作る
// onEdit：「編集」を押したときに実行する処理（記録のidを受け取る）
function createGroupItem(group, onEdit) {
  const li = document.createElement("li");
  li.className = "record-item";

  // 1行目：部位と種目
  const head = document.createElement("div");
  head.className = "record-head";
  const part = document.createElement("span");
  part.className = "record-part";
  part.textContent = group[0].part;
  const exercise = document.createElement("span");
  exercise.className = "record-exercise";
  exercise.textContent = group[0].exercise;
  head.append(part, exercise);
  li.appendChild(head);

  // 2行目から：1回の登録ごとに1行（重量 × 回数 × セット ＋ 編集・削除ボタン）
  group.forEach((record) => {
    const row = document.createElement("div");
    row.className = "set-row";
    if (record.id === editingId) row.classList.add("is-editing");

    const main = document.createElement("div");
    main.className = "set-main";
    const detail = document.createElement("div");
    detail.className = "record-detail";
    const weightText = record.weight === 0 ? "自重" : `${record.weight}kg`;
    detail.textContent = `${weightText} × ${record.reps}回 × ${record.sets}セット`;
    main.appendChild(detail);

    // メモ（あるときだけ）
    if (record.memo) {
      const memo = document.createElement("div");
      memo.className = "record-memo";
      memo.textContent = record.memo;
      main.appendChild(memo);
    }

    // 編集・削除ボタン
    const actions = document.createElement("div");
    actions.className = "record-actions";
    const btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.textContent = "編集";
    btnEdit.addEventListener("click", () => onEdit(record.id));
    const btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.className = "btn-delete";
    btnDelete.textContent = "削除";
    btnDelete.addEventListener("click", () => deleteRecord(record.id));
    actions.append(btnEdit, btnDelete);

    row.append(main, actions);
    li.appendChild(row);
  });

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

  groupConsecutive(records).forEach((group) => {
    recordList.appendChild(createGroupItem(group, startEdit));
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
    day.id = `day-${date}`; // カレンダーからこの日に移動するための目印

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
    groupConsecutive(dayRecords).forEach((group) => {
      list.appendChild(createGroupItem(group, editFromHistory));
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
// 月のカレンダー（カレンダータブ）
// =============================================

// 人型シンボルの形（SVG）。大きさの基準は 横40 × 縦58
// 体（灰色）：頭・首・胴体・左右の腕・左右の脚
const FIGURE_BODY =
  '<circle cx="20" cy="6" r="5"/>' +
  '<rect x="17.5" y="10" width="5" height="4" rx="1"/>' +
  '<path d="M9 14.5Q20 12 31 14.5L29 29Q27.5 35 28 41H12Q12.5 35 11 29Z"/>' +
  '<path d="M9 14.5L5.5 16Q3.5 28 3.8 40L7.2 40.5Q7.8 30 10.6 22Z"/>' +
  '<path d="M31 14.5L34.5 16Q36.5 28 36.2 40L32.8 40.5Q32.2 30 29.4 22Z"/>' +
  '<path d="M12 41H19.3L18.8 57H13.4Q11.6 50 12 41Z"/>' +
  '<path d="M28 41H20.7L21.2 57H26.6Q28.4 50 28 41Z"/>';

// 部位ごとに色を付ける場所
const FIGURE_PARTS = {
  "背中": '<path d="M10.5 15.5Q20 13.5 29.5 15.5L27 29Q24 35 20 38.5Q16 35 13 29Z"/>',
  "胸": '<path d="M12 16.8Q16 15.3 19.4 16.3V24Q15.5 25.5 12 23Z M28 16.8Q24 15.3 20.6 16.3V24Q24.5 25.5 28 23Z"/>',
  "腹": '<path d="M15.2 26Q20 27.5 24.8 26V39.5H15.2Z"/>',
  "脚": '<path d="M12.2 42H19.2L19 50.5H12.7Q12 46 12.2 42Z M27.8 42H20.8L21 50.5H27.3Q28 46 27.8 42Z"/>',
  "肩": '<path d="M5.6 16.3Q7 13.6 11 14.2L10.6 19.6Q7.5 19.2 5.6 16.3Z M34.4 16.3Q33 13.6 29 14.2L29.4 19.6Q32.5 19.2 34.4 16.3Z"/>',
  "腕": '<path d="M5.3 17.5L9.6 19.5Q8 26 7.6 33H4.2Q4.1 24 5.3 17.5Z M34.7 17.5L30.4 19.5Q32 26 32.4 33H35.8Q35.9 24 34.7 17.5Z"/>',
};

// 鍛えた部位に色を付けた人型シンボル（SVGの文字列）を作る
// 背中（オレンジ・枠線なし）を先に描き、その上に他の部位（赤・枠線あり）を重ねる
function createFigure(parts) {
  const back = parts.includes("背中")
    ? `<g fill="var(--figure-back)">${FIGURE_PARTS["背中"]}</g>`
    : "";
  const others = parts
    .filter((p) => p !== "背中" && FIGURE_PARTS[p])
    .map((p) => FIGURE_PARTS[p])
    .join("");
  return (
    '<svg class="figure" viewBox="0 0 40 58" aria-hidden="true">' +
    `<g fill="var(--figure)">${FIGURE_BODY}</g>` +
    back +
    `<g fill="var(--figure-hit)" stroke="var(--figure-line)" stroke-width="0.9" stroke-linejoin="round">${others}</g>` +
    "</svg>"
  );
}

// 年・月・日から "YYYY-MM-DD" を作る（月は 0=1月）
function toDateString(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// 表示している月のカレンダーを作る
function renderCalendar() {
  calTitle.textContent = `${calYear}年${calMonth + 1}月`;

  // 日付ごとに、鍛えた部位をまとめる（例：{ "2026-10-24": ["胸", "腕"] }）
  const partsByDate = {};
  load(KEY_RECORDS, []).forEach((record) => {
    if (!partsByDate[record.date]) partsByDate[record.date] = [];
    if (!partsByDate[record.date].includes(record.part)) {
      partsByDate[record.date].push(record.part);
    }
  });

  const firstWeekday = new Date(calYear, calMonth, 1).getDay(); // 1日が何曜日か（0=日）
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate(); // その月の日数
  const today = todayString();

  calGrid.innerHTML = "";

  // 1日より前の空きマス（日曜はじまりなので、1日の曜日の数だけ空ける）
  for (let i = 0; i < firstWeekday; i++) {
    const blank = document.createElement("div");
    blank.className = "cal-day is-blank";
    calGrid.appendChild(blank);
  }

  // 1日〜月末までのマス
  for (let day = 1; day <= daysInMonth; day++) {
    const date = toDateString(calYear, calMonth, day);
    const parts = partsByDate[date] || [];

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cal-day";
    if (date === today) cell.classList.add("is-today");

    // 曜日の色（日曜は赤、土曜は青）
    const weekday = (firstWeekday + day - 1) % 7;
    const num = document.createElement("span");
    num.className = "cal-num";
    if (weekday === 0) num.classList.add("sun");
    if (weekday === 6) num.classList.add("sat");
    num.textContent = day;
    cell.appendChild(num);

    // トレーニングした日は人型シンボルを表示
    if (parts.length > 0) {
      cell.insertAdjacentHTML("beforeend", createFigure(parts));
      cell.setAttribute("aria-label", `${day}日：${parts.join("・")}`);
    }

    cell.addEventListener("click", () => handleCalendarTap(date, parts.length > 0));
    calGrid.appendChild(cell);
  }
}

// カレンダーの日付をタップしたとき
function handleCalendarTap(date, hasRecords) {
  if (hasRecords) {
    // 記録がある日：下の履歴のその日まで移動する
    const target = document.getElementById(`day-${date}`);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  // 記録がない日：確認してから、入力画面でその日付の登録を始める
  if (!confirm(`${formatDate(date)}の記録を登録しますか？`)) return;

  if (editingId) {
    clearNumbers();
    endEdit();
  }
  showError("");
  inputDate.value = date;
  showScreen("input");
  renderAll();
}

// 前の月・次の月へ切り替える（diff：-1 なら前の月、1 なら次の月）
function changeMonth(diff) {
  const d = new Date(calYear, calMonth + diff, 1);
  calYear = d.getFullYear();
  calMonth = d.getMonth();
  renderCalendar();
}

// =============================================
// 週ごとの予定（行く曜日）
// =============================================
// 保存の形：{ weeklyTargets: { "その週の日曜の日付": [行く曜日の番号], ... } }
// 例：{ weeklyTargets: { "2026-10-25": [1, 3, 5] } } → 10/25の週は月・水・金
// 「今週は休み」は空の配列 [] で保存する

// 設定を読み込む（古い形や空のときは、新しい形に整える）
function loadSettings() {
  const settings = load(KEY_SETTINGS, {});
  return { weeklyTargets: settings.weeklyTargets || {} };
}

// 指定した日を含む週の、日曜日の Date を返す
function getWeekStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
}

// Date を "YYYY-MM-DD" にする
function dateToString(date) {
  return toDateString(date.getFullYear(), date.getMonth(), date.getDate());
}

// 今週の目印（今週の日曜の日付 "YYYY-MM-DD"）
function currentWeekKey() {
  return dateToString(getWeekStart(new Date()));
}

// 今週の予定（曜日の配列）を返す。まだ登録していなければ null
function getThisWeekTarget() {
  const target = loadSettings().weeklyTargets[currentWeekKey()];
  return Array.isArray(target) ? target : null;
}

// 今週の予定を保存する
function saveThisWeekTarget(days) {
  const settings = loadSettings();
  settings.weeklyTargets[currentWeekKey()] = days;
  save(KEY_SETTINGS, settings);
}

// 今週より前で、いちばん新しい週の予定を返す（なければ空の配列）
function getLastWeekTarget() {
  const targets = loadSettings().weeklyTargets;
  const thisWeek = currentWeekKey();
  const pastKeys = Object.keys(targets).filter((key) => key < thisWeek).sort();
  return pastKeys.length > 0 ? targets[pastKeys[pastKeys.length - 1]] : [];
}

// 「10/25〜10/31」の形で今週の期間を返す
function thisWeekRangeText() {
  const start = getWeekStart(new Date());
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return `${start.getMonth() + 1}/${start.getDate()}〜${end.getMonth() + 1}/${end.getDate()}`;
}

// =============================================
// 予定の登録メッセージ
// =============================================

// メッセージを開く
// mode："ask"（未登録のときに自動で出す）／"edit"（ホームの「変更」ボタンから開く）
function openPlanModal(mode) {
  // 最初に選んでおく曜日：今週の予定があればそれ、なければ前の週と同じ
  planSelected = [...(getThisWeekTarget() || getLastWeekTarget())];

  planTitle.textContent = mode === "edit"
    ? `今週（${thisWeekRangeText()}）の予定を変更`
    : `今週（${thisWeekRangeText()}）の予定`;
  btnPlanLater.textContent = mode === "edit" ? "キャンセル" : "あとで";

  renderPlanDays();
  planModal.hidden = false;
  document.body.classList.add("modal-open");
}

// メッセージを閉じる
function closePlanModal() {
  planModal.hidden = true;
  document.body.classList.remove("modal-open");
}

// 日〜土のボタンを作る
function renderPlanDays() {
  planDays.innerHTML = "";
  WEEKDAYS.forEach((name, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "plan-day";
    button.textContent = name;
    const selected = planSelected.includes(index);
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", selected);
    button.addEventListener("click", () => togglePlanDay(index));
    planDays.appendChild(button);
  });

  // 選んだ数がそのまま今週の目標回数になる
  planCount.textContent = planSelected.length;
  // 1つも選んでいないときは OK を押せない（休みなら「今週は休み」を押す）
  btnPlanOk.disabled = planSelected.length === 0;
}

// 曜日のボタンを押したとき：選択／解除を切り替える
function togglePlanDay(index) {
  if (planSelected.includes(index)) {
    planSelected = planSelected.filter((d) => d !== index);
  } else {
    planSelected = [...planSelected, index].sort((a, b) => a - b); // 日→土の順に並べる
  }
  renderPlanDays();
}

// 「OK」：選んだ曜日を今週の予定として保存する
function submitPlan() {
  saveThisWeekTarget(planSelected);
  closePlanModal();
  renderHome();
}

// 「今週は休み」：0回の予定として保存する
function restThisWeek() {
  saveThisWeekTarget([]);
  closePlanModal();
  renderHome();
}

// 今週の予定がまだなければ、メッセージを出す
// （アプリを開いたときと、アプリに戻ってきたときに呼ぶ）
function checkWeeklyPlan() {
  renderHome(); // 日付が変わっている場合もあるので、ホームを作り直す
  if (!planModal.hidden) return; // すでに開いているときは何もしない
  if (getThisWeekTarget() === null) {
    openPlanModal("ask");
  }
}

// =============================================
// ホーム画面（今週の目標と実績）
// =============================================

function renderHome() {
  const target = getThisWeekTarget(); // 予定の曜日（未登録なら null）
  const start = getWeekStart(new Date());
  const today = todayString();

  // 記録がある日（同じ日に何件あっても1日と数える）
  const trainedDates = new Set(load(KEY_RECORDS, []).map((r) => r.date));

  homeRange.textContent = thisWeekRangeText();
  homeDays.innerHTML = "";
  let done = 0;

  // 日〜土の7つの丸を作る
  for (let i = 0; i < 7; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const dateStr = dateToString(date);
    const isPlan = target !== null && target.includes(i);
    const isDone = trainedDates.has(dateStr); // 予定日以外に行った日も実施として数える
    if (isDone) done++;

    const day = document.createElement("div");
    day.className = "home-day";
    if (dateStr === today) day.classList.add("is-today");

    const label = document.createElement("span");
    label.textContent = WEEKDAYS[i];
    if (i === 0) label.className = "sun";
    if (i === 6) label.className = "sat";

    const circle = document.createElement("div");
    circle.className = "home-circle";
    if (isPlan) circle.classList.add("is-plan");
    if (isDone) circle.classList.add("is-done");
    circle.textContent = date.getDate();

    day.append(label, circle);
    homeDays.appendChild(day);
  }

  // 「今週 2/3回」と、その下のひとこと
  homeDone.textContent = done;
  if (target === null) {
    homeTarget.textContent = "-";
    homeMessage.textContent = "今週の予定がまだ登録されていません";
    btnEditPlan.textContent = "今週の予定を登録";
  } else {
    homeTarget.textContent = target.length;
    btnEditPlan.textContent = "今週の予定を変更";
    if (target.length === 0) {
      homeMessage.textContent = "今週は休みの予定です";
    } else if (done >= target.length) {
      homeMessage.textContent = "今週の目標を達成しました！";
    } else {
      homeMessage.textContent = `目標まであと${target.length - done}回`;
    }
  }
}

// =============================================
// 自己ベスト（推定MAX）の計算
// =============================================

// 推定MAX（1回だけ挙げられる重さの推定値）を計算する
// Brzycki式：重量 × 36 ÷ (37 − 回数)。日本でよく使われるRM表とほぼ同じ値になる
// ・回数が多いほど推定がずれるので、13回以上は12回として計算する（少なめに見積もる）
// ・重量0（自重）は対象外なので null を返す
function estimateMax(record) {
  if (!(record.weight > 0)) return null;
  const reps = Math.min(record.reps, 12);
  const value = (record.weight * 36) / (37 - reps);
  return Math.round(value * 10) / 10; // 小数第1位まで
}

// 種目を区別する目印（同じ名前でも部位が違えば別の種目）
function bestKey(record) {
  return `${record.part}|${record.exercise}`;
}

// 全記録から、種目ごとの自己ベストをまとめる
// 戻り値：{ "胸|ベンチプレス": { part, exercise, best, bestDate, first, points: [{date, value, isBest}] } }
function getBests(records) {
  // 日付の古い順に並べる（同じ日なら登録した順）
  const sorted = records
    .map((record, index) => ({ record, index }))
    .sort((a, b) => (a.record.date === b.record.date ? a.index - b.index : a.record.date < b.record.date ? -1 : 1))
    .map((item) => item.record);

  const bests = {};
  sorted.forEach((record) => {
    const value = estimateMax(record);
    if (value === null) return;

    const key = bestKey(record);
    if (!bests[key]) {
      bests[key] = { part: record.part, exercise: record.exercise, best: 0, bestDate: "", first: value, points: [] };
    }
    const item = bests[key];

    // グラフ用：1日に何回あっても、その日の最大値を1点にする
    const last = item.points[item.points.length - 1];
    if (last && last.date === record.date) {
      last.value = Math.max(last.value, value);
    } else {
      item.points.push({ date: record.date, value: value, isBest: false });
    }

    // 自己ベストの更新（同じ値なら、最初に出した日のまま）
    if (value > item.best) {
      item.best = value;
      item.bestDate = record.date;
    }
  });

  // グラフで「自己ベストを更新した日」に印を付ける
  Object.values(bests).forEach((item) => {
    let max = 0;
    item.points.forEach((point) => {
      point.isBest = point.value > max;
      if (point.isBest) max = point.value;
    });
  });

  return bests;
}

// 重さにいちばん近い動物を選ぶ（重さの比が1に最も近いもの）
function pickAnimal(kg) {
  return ANIMALS.reduce((best, animal) =>
    Math.abs(Math.log(kg / animal.kg)) < Math.abs(Math.log(kg / best.kg)) ? animal : best
  );
}

// 「ライオン 1.0頭分」の形にする
function animalText(kg) {
  const animal = pickAnimal(kg);
  return `${animal.name} ${(kg / animal.kg).toFixed(1)}${animal.unit}分`;
}

// 動物のシルエット（SVGの文字列）を作る
function animalSvg(kg) {
  const animal = pickAnimal(kg);
  return (
    `<svg class="animal" viewBox="0 0 100 70" role="img" aria-label="${animal.name}">` +
    `<path fill-rule="evenodd" d="${animal.d}"/></svg>`
  );
}

// "YYYY-MM-DD" を「10/24」の形にする
function shortDate(dateStr) {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${m}/${d}`;
}

// 種目ごとの自己ベストを、重い順に並べた配列で返す
function getSortedBests() {
  return Object.values(getBests(load(KEY_RECORDS, []))).sort((a, b) => b.best - a.best);
}

// =============================================
// ホーム：ランキング
// =============================================

function renderRanking() {
  const items = getSortedBests();
  rankList.innerHTML = "";
  rankEmpty.hidden = items.length > 0;

  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "rank-item";

    // 順位（1〜3位は金・銀・銅の丸）
    const num = document.createElement("span");
    num.className = "rank-num";
    if (index < 3) num.classList.add(`is-${index + 1}`);
    num.textContent = index + 1;

    // 種目名・推定MAX・動物・更新日・初回からの伸び
    const main = document.createElement("div");
    main.className = "rank-main";
    const name = document.createElement("div");
    name.className = "rank-name";
    name.textContent = `${item.exercise}（${item.part}）`;
    const value = document.createElement("div");
    value.className = "rank-value";
    value.textContent = `${item.best}kg`;
    const sub = document.createElement("div");
    sub.className = "rank-sub";
    sub.textContent = `${animalText(item.best)} ・ ${shortDate(item.bestDate)}更新`;
    const growth = Math.round((item.best - item.first) * 10) / 10;
    if (growth > 0) {
      const g = document.createElement("span");
      g.className = "rank-growth";
      g.textContent = ` ・ 初回から +${growth}kg`;
      sub.appendChild(g);
    }
    main.append(name, value, sub);

    li.append(num);
    li.insertAdjacentHTML("beforeend", animalSvg(item.best));
    li.append(main);
    rankList.appendChild(li);
  });
}

// =============================================
// ホーム：種目別（部位ごとにたたむ一覧＋グラフ）
// =============================================

function renderPartList() {
  const items = getSortedBests();
  partList.innerHTML = "";
  partEmpty.hidden = items.length > 0;

  // 部位の順番（胸・背中・脚…）で、記録のある部位だけ表示する
  PARTS.forEach((part) => {
    const partItems = items.filter((item) => item.part === part);
    if (partItems.length === 0) return;

    const group = document.createElement("section");
    group.className = "part-group";
    const isOpen = openParts.has(part);
    group.classList.toggle("is-open", isOpen);

    // 部位の見出し（押すと開く／たたむ）
    const head = document.createElement("button");
    head.type = "button";
    head.className = "part-head";
    head.setAttribute("aria-expanded", isOpen);
    head.innerHTML = `<span></span><span class="part-count"></span><span class="part-arrow">›</span>`;
    head.children[0].textContent = part;
    head.children[1].textContent = `${partItems.length}種目`;
    head.addEventListener("click", () => {
      if (openParts.has(part)) openParts.delete(part);
      else openParts.add(part);
      renderPartList();
    });

    // 部位の中の種目
    const body = document.createElement("div");
    body.className = "part-body";
    body.hidden = !isOpen;
    partItems.forEach((item) => body.append(...createExerciseRow(item)));

    group.append(head, body);
    partList.appendChild(group);
  });
}

// 種目の行と、その下のグラフを作る
function createExerciseRow(item) {
  const key = bestKey(item);
  const isOpen = openExerciseKey === key;

  const row = document.createElement("button");
  row.type = "button";
  row.className = "ex-row";
  row.setAttribute("aria-expanded", isOpen);
  row.insertAdjacentHTML("beforeend", animalSvg(item.best));

  const main = document.createElement("div");
  main.className = "ex-main";
  const name = document.createElement("div");
  name.className = "ex-name";
  name.textContent = item.exercise;
  const sub = document.createElement("div");
  sub.className = "ex-sub";
  sub.textContent = `${animalText(item.best)} ・ ${shortDate(item.bestDate)}更新`;
  main.append(name, sub);

  const value = document.createElement("div");
  value.className = "ex-value";
  value.textContent = `${item.best}kg`;
  row.append(main, value);

  // 押すとグラフを開く（開けるのは1つだけ。もう一度押すと閉じる）
  row.addEventListener("click", () => {
    openExerciseKey = isOpen ? null : key;
    renderPartList();
  });

  const chart = document.createElement("div");
  chart.className = "ex-chart";
  chart.hidden = !isOpen;
  if (isOpen) {
    if (item.points.length < 2) {
      chart.innerHTML = '<p class="chart-empty">記録が2日分以上になると、グラフを表示します</p>';
    } else {
      chart.innerHTML = '<p class="chart-title">推定MAXの推移（●：自己ベスト更新）</p>' + createChart(item.points);
    }
  }

  return [row, chart];
}

// 推定MAXの推移グラフ（SVGの文字列）を作る。横軸：日付／縦軸：推定MAX(kg)
function createChart(points) {
  const W = 320, H = 170;                               // グラフ全体の大きさ
  const left = 40, right = 12, top = 18, bottom = 24;   // まわりの余白（目盛りの文字用）

  // 横軸：実際の日付の間隔に合わせる（間が空いた期間は、グラフでも空く）
  const toDay = (dateStr) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return Date.UTC(y, m - 1, d) / 86400000;
  };
  const firstDay = toDay(points[0].date);
  const lastDay = toDay(points[points.length - 1].date);
  const x = (dateStr) => left + ((toDay(dateStr) - firstDay) / (lastDay - firstDay)) * (W - left - right);

  // 縦軸：最小値〜最大値に少し余裕を持たせる
  const values = points.map((p) => p.value);
  let min = Math.min(...values), max = Math.max(...values);
  const pad = Math.max((max - min) * 0.15, 2);
  min = Math.max(0, min - pad);
  max = max + pad;
  const y = (value) => top + (1 - (value - min) / (max - min)) * (H - top - bottom);

  // 折れ線と点
  const line = points.map((p) => `${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const dots = points
    .map((p) => `<circle class="chart-dot${p.isBest ? " is-best" : ""}" cx="${x(p.date).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="4"/>`)
    .join("");

  // いちばん高い点に値を書く
  // （グラフの端で文字が切れないよう、端に近いときは内側に寄せる）
  const top1 = points.reduce((a, b) => (b.value > a.value ? b : a));
  const topX = x(top1.date);
  const anchor = topX > W - 40 ? "end" : topX < left + 30 ? "start" : "middle";
  const bestLabel = `<text class="chart-label is-strong" x="${topX.toFixed(1)}" y="${(y(top1.value) - 8).toFixed(1)}" text-anchor="${anchor}">${top1.value}kg</text>`;

  // 目盛り：縦は下・上の値、横は最初と最後の日付
  const labels =
    `<text class="chart-label" x="${left - 6}" y="${y(min) + 4}" text-anchor="end">${Math.round(min)}</text>` +
    `<text class="chart-label" x="${left - 6}" y="${y(max) + 4}" text-anchor="end">${Math.round(max)}</text>` +
    `<text class="chart-label" x="${left}" y="${H - 6}" text-anchor="start">${shortDate(points[0].date)}</text>` +
    `<text class="chart-label" x="${W - right}" y="${H - 6}" text-anchor="end">${shortDate(points[points.length - 1].date)}</text>`;

  const axis =
    `<line class="chart-axis" x1="${left}" y1="${top}" x2="${left}" y2="${H - bottom}"/>` +
    `<line class="chart-axis" x1="${left}" y1="${H - bottom}" x2="${W - right}" y2="${H - bottom}"/>`;

  return (
    `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="推定MAXの推移">` +
    axis + labels + `<polyline class="chart-line" points="${line}"/>` + dots + bestLabel +
    "</svg>"
  );
}

// =============================================
// 自己ベストのお祝いメッセージ
// =============================================

// 登録した記録が自己ベストなら、お祝いメッセージを出す
// before：登録する前の、この種目の自己ベスト（初めての種目なら undefined）
function celebrateIfBest(record, before) {
  const value = estimateMax(record);
  if (value === null) return; // 自重の種目は対象外

  if (!before) {
    // その種目の初めての記録：控えめに知らせる
    pbLabel.textContent = "初記録";
    pbTitle.textContent = record.exercise;
    pbDetail.textContent = `推定MAX ${value}kg（ここから記録していきましょう）`;
  } else if (value > before.best) {
    // 自己ベスト更新
    const diff = Math.round((value - before.best) * 10) / 10;
    pbLabel.textContent = "自己ベスト更新！";
    pbTitle.textContent = record.exercise;
    pbDetail.textContent = `推定MAX ${before.best}kg → ${value}kg（+${diff}kg）`;
  } else {
    return; // 更新していなければ何も出さない
  }

  pbAnimal.innerHTML = animalSvg(value);
  pbAnimalText.textContent = animalText(value);
  pbModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closePbModal() {
  pbModal.hidden = true;
  document.body.classList.remove("modal-open");
}

// =============================================
// ホームの中のタブ（今週／ランキング／種目別）
// =============================================

function setupHomeTabs() {
  document.querySelectorAll(".segment-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const panel = button.dataset.panel;
      document.querySelectorAll(".segment-btn").forEach((b) => {
        b.classList.toggle("is-active", b === button);
      });
      document.querySelectorAll(".home-panel").forEach((p) => {
        p.hidden = p.id !== `panel-${panel}`;
      });
    });
  });
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
  // 設定を新しい形（週ごとの予定）で保存し直す（古い targetDays は使わないので消える）
  save(KEY_SETTINGS, loadSettings());

  inputDate.value = todayString(); // 日付の初期値は今日
  renderParts();
  renderExercises();
  renderAll();
  setupTabs();

  // 各操作に処理をつなぐ
  form.addEventListener("submit", handleSubmit);
  inputPart.addEventListener("change", () => renderExercises());
  inputDate.addEventListener("change", renderList);
  inputExercise.addEventListener("change", handleExerciseChange);
  btnAddExercise.addEventListener("click", addExercise);
  btnCancelExercise.addEventListener("click", cancelAddExercise);
  btnCalPrev.addEventListener("click", () => changeMonth(-1));
  btnCalNext.addEventListener("click", () => changeMonth(1));
  btnCancelEdit.addEventListener("click", cancelEdit);
  btnEditPlan.addEventListener("click", () => openPlanModal("edit"));
  btnPlanOk.addEventListener("click", submitPlan);
  btnPlanLater.addEventListener("click", closePlanModal);
  btnPlanRest.addEventListener("click", restThisWeek);
  btnPbOk.addEventListener("click", closePbModal);
  setupHomeTabs();

  // アプリに戻ってきたとき（ホーム画面のアプリは裏で残っていることがあるため）も確認する
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkWeeklyPlan();
  });
  // 開いたとき：今週の予定がまだなら、メッセージを出す
  checkWeeklyPlan();

  // 種目追加の欄でEnter（完了）を押したら、登録ではなく種目の追加にする
  inputNewExercise.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addExercise();
    }
  });
}

init();
