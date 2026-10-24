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
  renderCalendar();
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
  inputExercise.addEventListener("change", handleExerciseChange);
  btnAddExercise.addEventListener("click", addExercise);
  btnCancelExercise.addEventListener("click", cancelAddExercise);
  btnCalPrev.addEventListener("click", () => changeMonth(-1));
  btnCalNext.addEventListener("click", () => changeMonth(1));
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
