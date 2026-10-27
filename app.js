// =============================================
// 筋トレノート：フェーズ1（入力画面）
// =============================================

// ----- localStorage のキー名 -----
const KEY_RECORDS = "workout_records";             // 記録の配列
const KEY_CUSTOM = "workout_custom_exercises";     // 追加した種目の配列
const KEY_SETTINGS = "workout_settings";           // 設定（週ごとの行く曜日）
const KEY_DELETED = "workout_deleted_ids";         // 削除した記録のidの配列（復元で生き返らせないため）
const KEY_BACKUP_INFO = "workout_backup_info";     // 前回のバックアップ日 { lastBackup: "YYYY-MM-DD" }

// バックアップを何日しなかったら知らせるか
const BACKUP_REMIND_DAYS = 14;

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
const setsField = document.getElementById("sets-field");
const numberRow = document.getElementById("number-row");
const typeButtons = document.querySelectorAll(".type-btn");
const inputMemo = document.getElementById("input-memo");
const formError = document.getElementById("form-error");
const btnSubmit = document.getElementById("btn-submit");
const btnCancelEdit = document.getElementById("btn-cancel-edit");
const listTitle = document.getElementById("list-title");
const recordList = document.getElementById("record-list");
const listEmpty = document.getElementById("list-empty");
const toast = document.getElementById("toast");
const toastTitle = document.getElementById("toast-title");
const toastDetail = document.getElementById("toast-detail");
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
const bestModal = document.getElementById("best-modal");
const bestTitle = document.getElementById("best-title");
const bestBody = document.getElementById("best-body");
const btnBest = document.getElementById("btn-best");
const btnBestClose = document.getElementById("best-close");
const pbLabel = document.getElementById("pb-label");
const pbTitle = document.getElementById("pb-title");
const pbAnimal = document.getElementById("pb-animal");
const pbAnimalText = document.getElementById("pb-animal-text");
const pbDetail = document.getElementById("pb-detail");
const btnPbOk = document.getElementById("pb-ok");
const backupLast = document.getElementById("backup-last");
const btnExport = document.getElementById("btn-export");
const btnImport = document.getElementById("btn-import");
const inputImport = document.getElementById("input-import");
const planBackupNote = document.getElementById("plan-backup-note");
const statsLegend = document.getElementById("stats-legend");
const statsSets = document.getElementById("stats-sets");
const statsSetsCompare = document.getElementById("stats-sets-compare");
const statsVolume = document.getElementById("stats-volume");
const statsVolumeCompare = document.getElementById("stats-volume-compare");
const statsParts = document.getElementById("stats-parts");

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

// 編集中の記録のid（まとめて表示している行は複数。編集していないときは空）
let editingIds = [];

// 入力中の区分（"warmup"＝アップ／"main"＝メイン）。登録したあとも残す
let inputType = "main";

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
  // セット数は編集のときだけ入力する（新しい登録は、1回＝1セット）
  const isEditing = editingIds.length > 0;
  if (isEditing && (!/^\d+$/.test(setsText) || Number(setsText) < 1)) {
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
    sets: isEditing ? Number(setsText) : 1,
    type: inputType,
    memo: inputMemo.value.trim(),
  };
}

// 登録ボタン（または更新ボタン）を押したとき
function handleSubmit(event) {
  event.preventDefault(); // ページの再読み込みを防ぐ

  const data = readForm();
  if (!data) return;

  const records = load(KEY_RECORDS, []);
  const isNew = editingIds.length === 0;

  // 登録する前の、この種目の自己ベスト（お祝いメッセージの判定に使う）
  const before = isNew ? getBests(records)[bestKey(data)] : null;

  if (isNew) {
    // 新しい記録（1セット分）を追加する
    records.push({ id: createId(), ...data });
    save(KEY_RECORDS, records);
    // 重量・区分はそのまま残し、回数とメモを空にする
    // （回数はセットごとに変わることが多い。空にすることで、2回押しての二重登録も防げる）
    inputReps.value = "";
    inputMemo.value = "";
    showToast(...registeredText(data, records));
  } else {
    // 編集：行の最初の記録を書き換え、入力したセット数を持たせる
    // 同じ行の残りの記録は削除する（表示は「×Nセット」のまま変わらない）
    const [firstId, ...restIds] = editingIds;
    const index = records.findIndex((r) => r.id === firstId);
    if (index !== -1) {
      records[index] = { id: firstId, ...data };
    }
    save(KEY_RECORDS, records.filter((r) => !restIds.includes(r.id)));
    rememberDeleted(restIds);
    clearNumbers();
    endEdit();
  }
  renderAll();

  // 新しく登録したときだけ、自己ベストを更新していたらお祝いする（編集では出さない）
  if (isNew) celebrateIfBest(data, before);
}

// 登録したときの通知の文（1行目：種目とセット数／2行目：登録した内容）
// 例：「ベンチプレス　メイン 3セット目」「60kg × 10回を登録しました」
// セット数は、その日のその種目の合計（重量が違っても、間に別の種目が入っても数える）
// メインとアップは別々に数える
function registeredText(data, records) {
  const count = records
    .filter(
      (r) =>
        r.date === data.date &&
        r.part === data.part &&
        r.exercise === data.exercise &&
        isWarmup(r) === isWarmup(data)
    )
    .reduce((sum, r) => sum + r.sets, 0);
  const weightText = data.weight === 0 ? "自重" : `${data.weight}kg`;
  const typeText = isWarmup(data) ? "アップ" : "メイン";
  return [`${data.exercise}　${typeText} ${count}セット目`, `${weightText} × ${data.reps}回を登録しました`];
}

// 画面の下に、短い通知を出す（title：太字の見出し／detail：薄い文字の説明）
// ふわっと出て（0.35秒）、3秒表示したあと、ふわっと消える（0.5秒）
let toastTimer = null;
function showToast(title, detail) {
  toastTitle.textContent = title;
  toastDetail.textContent = detail || "";
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3000);
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

// 区分（アップ／メイン）を切り替える
function setType(type) {
  inputType = type;
  typeButtons.forEach((button) => {
    const active = button.dataset.type === type;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-checked", active);
  });
}

// 編集を始める（1行分の記録の内容をフォームに入れる）
// ids：その行にまとめて表示している記録のid
function startEdit(ids) {
  const all = load(KEY_RECORDS, []);
  const rows = ids.map((id) => all.find((r) => r.id === id)).filter(Boolean);
  if (rows.length === 0) return;
  const record = rows[0];

  editingIds = rows.map((r) => r.id);
  inputDate.value = record.date;
  inputPart.value = record.part;
  renderExercises(record.exercise);
  inputWeight.value = record.weight === 0 ? "" : String(record.weight);
  inputReps.value = String(record.reps);
  // セット数は行の合計。メモは、複数あれば「 / 」でつなぐ
  inputSets.value = String(rows.reduce((sum, r) => sum + r.sets, 0));
  inputMemo.value = rows.map((r) => r.memo).filter(Boolean).join(" / ");
  setType(isWarmup(record) ? "warmup" : "main");

  // 編集のときだけ、セット数の欄を表示する
  setsField.hidden = false;
  numberRow.classList.add("has-sets");

  btnSubmit.textContent = "更新する";
  btnCancelEdit.hidden = false;
  showError("");
  renderAll();

  // フォームが見えるように上へスクロール
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

// 編集をやめる（フォームを登録モードに戻す）
function endEdit() {
  editingIds = [];
  btnSubmit.textContent = "登録する";
  btnCancelEdit.hidden = true;
  setsField.hidden = true;
  numberRow.classList.remove("has-sets");
}

// 「編集をやめる」ボタンを押したとき
function cancelEdit() {
  clearNumbers();
  endEdit();
  showError("");
  renderAll();
}

// 1行分の記録を削除する（まとめて表示している全セットを消す）
// ids：その行の記録のid／label：確認メッセージに出す内容（例：「ベンチプレス 60kg × 10回」）
function deleteRows(ids, label, totalSets) {
  const setsText = totalSets > 1 ? `の${totalSets}セット分` : "";
  if (!confirm(`「${label}」${setsText}を削除しますか？`)) return;

  save(KEY_RECORDS, load(KEY_RECORDS, []).filter((r) => !ids.includes(r.id)));
  rememberDeleted(ids);

  // 編集中の記録を削除した場合は、編集をやめる
  if (editingIds.some((id) => ids.includes(id))) {
    clearNumbers();
    endEdit();
  }
  renderAll();
}

// 削除したidを覚えておく（バックアップから復元しても、この記録は戻さない）
function rememberDeleted(ids) {
  if (ids.length === 0) return;
  const deletedIds = load(KEY_DELETED, []);
  ids.forEach((id) => {
    if (!deletedIds.includes(id)) deletedIds.push(id);
  });
  save(KEY_DELETED, deletedIds);
}

// 入力画面と履歴の、両方の一覧を作り直す
function renderAll() {
  renderList();
  renderHistory();
  renderCalendar();
  renderHome();
  renderRanking();
  renderPartList();
  renderBackupInfo();
  renderStats();
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

// アップの記録かどうか（区分がない古い記録は、メインとして扱う）
function isWarmup(record) {
  return record.type === "warmup";
}

// 同じ種目の中で、連続した「重量・回数・区分が同じ」記録を1行にまとめる
// 例：[60kg×10, 60kg×10, 70kg×8] → [[60kg×10, 60kg×10], [70kg×8]] → 「60kg × 10回 × 2セット」「70kg × 8回」
function groupSameSets(group) {
  const rows = [];
  group.forEach((record) => {
    const last = rows[rows.length - 1];
    if (
      last &&
      last[0].weight === record.weight &&
      last[0].reps === record.reps &&
      isWarmup(last[0]) === isWarmup(record)
    ) {
      last.push(record);
    } else {
      rows.push([record]);
    }
  });
  return rows;
}

// 1つのグループ（同じ種目の連続した記録）を、1つの枠（li）にして作る
// onEdit：「編集」を押したときに実行する処理（その行の記録のidの配列を受け取る）
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

  // 2行目から：同じ重量・回数・区分が続いた分を1行に（重量 × 回数 × セット ＋ 編集・削除ボタン）
  groupSameSets(group).forEach((rowRecords) => {
    const record = rowRecords[0];
    const ids = rowRecords.map((r) => r.id);
    const totalSets = rowRecords.reduce((sum, r) => sum + r.sets, 0);

    const row = document.createElement("div");
    row.className = "set-row";
    if (ids.some((id) => editingIds.includes(id))) row.classList.add("is-editing");
    if (isWarmup(record)) row.classList.add("is-warmup");

    const main = document.createElement("div");
    main.className = "set-main";
    const detail = document.createElement("div");
    detail.className = "record-detail";
    const weightText = record.weight === 0 ? "自重" : `${record.weight}kg`;
    // 1セットのときは「× 1セット」を付けない
    const baseText = `${weightText} × ${record.reps}回`;
    const detailText = totalSets > 1 ? `${baseText} × ${totalSets}セット` : baseText;
    if (isWarmup(record)) {
      const tag = document.createElement("span");
      tag.className = "warmup-tag";
      tag.textContent = "アップ";
      detail.appendChild(tag);
    }
    detail.appendChild(document.createTextNode(detailText));
    main.appendChild(detail);

    // メモ（あるものだけ、セットごとに並べる）
    rowRecords.filter((r) => r.memo).forEach((r) => {
      const memo = document.createElement("div");
      memo.className = "record-memo";
      memo.textContent = r.memo;
      main.appendChild(memo);
    });

    // 編集・削除ボタン（その行の全セットが対象）
    const actions = document.createElement("div");
    actions.className = "record-actions";
    const btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.textContent = "編集";
    btnEdit.addEventListener("click", () => onEdit(ids));
    const btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.className = "btn-delete";
    btnDelete.textContent = "削除";
    btnDelete.addEventListener("click", () => deleteRows(ids, `${record.exercise} ${baseText}`, totalSets));
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
function editFromHistory(ids) {
  showScreen("input");
  startEdit(ids);
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
  // 肩は小さいと見えにくいので、最初の形の約1.7倍（2倍にしたあと0.85倍に調整）の大きさにしている
  "肩": '<path d="M4.5 21.1Q4.1 14.9 9.3 13.8L12.3 14.8L11.4 22.2Q7.5 23.7 4.5 21.1Z M35.5 21.1Q35.9 14.9 30.7 13.8L27.7 14.8L28.6 22.2Q32.5 23.7 35.5 21.1Z"/>',
  "腕": '<path d="M5.3 17.5L9.6 19.5Q8 26 7.6 33H4.2Q4.1 24 5.3 17.5Z M34.7 17.5L30.4 19.5Q32 26 32.4 33H35.8Q35.9 24 34.7 17.5Z"/>',
};

// 背中以外の部位を描く順番（あとに描くほど手前に見える。肩はいちばん手前）
const FIGURE_DRAW_ORDER = ["胸", "腹", "脚", "腕", "肩"];

// 鍛えた部位に色を付けた人型シンボル（SVGの文字列）を作る
// 背中（オレンジ・枠線なし）を先に描き、その上に他の部位（赤・枠線あり）を決まった順番で重ねる
function createFigure(parts) {
  const back = parts.includes("背中")
    ? `<g fill="var(--figure-back)">${FIGURE_PARTS["背中"]}</g>`
    : "";
  const others = FIGURE_DRAW_ORDER
    .filter((p) => parts.includes(p))
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

  if (editingIds.length > 0) {
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
  // 次の月は右から、前の月は左から入ってくる
  playSlide(calGrid, diff > 0 ? "slide-from-right" : "slide-from-left");
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

  // 自動で出したときだけ、必要ならバックアップのリマインドを添える
  const reminder = mode === "ask" ? backupReminderText() : "";
  planBackupNote.textContent = reminder;
  planBackupNote.hidden = !reminder;

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
    btnEditPlan.textContent = "予定を登録";
  } else {
    homeTarget.textContent = target.length;
    btnEditPlan.textContent = "予定を変更";
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
// ホーム：今週のメイン（セット数・総ボリューム・部位ごとのセット数）
// =============================================
// 週の途中でも公平に比べられるよう、比べる相手は「同じ曜日まで」の数字にする
// 例：今日が水曜なら、先週の日〜水、直近4週もそれぞれの日〜水と比べる

// 期間（from〜to、どちらも含む）のメインの記録を集計する
function sumMain(records, from, to) {
  const result = { sets: 0, volume: 0, byPart: {} };
  PARTS.forEach((part) => (result.byPart[part] = 0));
  records.forEach((r) => {
    if (isWarmup(r) || r.date < from || r.date > to) return;
    result.sets += r.sets;
    if (r.weight > 0) result.volume += r.weight * r.reps * r.sets; // 自重は総ボリュームに含めない
    if (r.part in result.byPart) result.byPart[r.part] += r.sets;
  });
  return result;
}

// 増減を「▲3」「▼12%」のような文字と、色の種類にする
// 色は信号と同じ意味：比べる相手以上なら緑（"stats-ok"）、少なければ黄（"stats-warn"）
// （赤と緑は国によって「上がった／下がった」の意味が逆になるので、▲▼も付けて状態で表す）
// mode："diff"（差）／"percent"（割合）
function compareText(value, base, mode) {
  const cls = value >= base ? "stats-ok" : "stats-warn";
  if (mode === "percent") {
    if (base === 0) return { text: value === 0 ? "±0%" : "—", cls: "" };
    const pct = Math.round(((value - base) / base) * 100);
    return { text: pct === 0 ? "±0%" : `${pct > 0 ? "▲" : "▼"}${Math.abs(pct)}%`, cls: cls };
  }
  const diff = Math.round((value - base) * 10) / 10;
  return { text: diff === 0 ? "±0" : `${diff > 0 ? "▲" : "▼"}${Math.abs(diff)}`, cls: cls };
}

// 比べた結果の1行（例：「先週：12 → +3」）を作る
function compareLine(label, baseText, compare) {
  const line = document.createElement("div");
  line.append(`${label}：${baseText} `);
  const span = document.createElement("span");
  span.className = compare.cls;
  span.textContent = compare.text;
  line.appendChild(span);
  return line;
}

// 重さを「12,340kg」の形にする
function volumeText(kg) {
  return `${Math.round(kg).toLocaleString("ja-JP")}kg`;
}

function renderStats() {
  const records = load(KEY_RECORDS, []);
  const targets = loadSettings().weeklyTargets;
  const start = getWeekStart(new Date());
  const dayIndex = new Date().getDay(); // 今日が週の何日目か（0=日）

  // weeksAgo 週前の「日曜〜今日と同じ曜日」の期間
  const range = (weeksAgo) => {
    const from = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 7 * weeksAgo);
    const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + dayIndex);
    return [dateToString(from), dateToString(to)];
  };

  // 比べる相手にしない週：「今週は休み」の週と、記録を始める前の週
  const dates = records.map((r) => r.date).sort();
  const firstWeek = dates.length > 0 ? dateToString(getWeekStart(new Date(dates[0] + "T00:00:00"))) : null;
  const isUsableWeek = (weekKey) => {
    const target = targets[weekKey];
    if (Array.isArray(target) && target.length === 0) return false; // 休みの週
    return firstWeek !== null && weekKey >= firstWeek;
  };

  const [from, to] = range(0);
  const now = sumMain(records, from, to);

  // 先週（同じ曜日まで）
  const lastKey = range(1)[0];
  const last = isUsableWeek(lastKey) ? sumMain(records, ...range(1)) : null;
  const lastIsRest = Array.isArray(targets[lastKey]) && targets[lastKey].length === 0;

  // 直近4週の平均（同じ曜日まで）
  const pastWeeks = [1, 2, 3, 4].filter((w) => isUsableWeek(range(w)[0])).map((w) => sumMain(records, ...range(w)));
  let avg = null;
  if (pastWeeks.length > 0) {
    avg = { sets: 0, volume: 0, byPart: {} };
    PARTS.forEach((part) => (avg.byPart[part] = 0));
    pastWeeks.forEach((week) => {
      avg.sets += week.sets / pastWeeks.length;
      avg.volume += week.volume / pastWeeks.length;
      PARTS.forEach((part) => (avg.byPart[part] += week.byPart[part] / pastWeeks.length));
    });
  }

  // セット数
  statsSets.textContent = `${now.sets}セット`;
  statsSetsCompare.innerHTML = "";
  // 総ボリューム
  statsVolume.textContent = volumeText(now.volume);
  statsVolumeCompare.innerHTML = "";

  if (last) {
    statsSetsCompare.appendChild(compareLine("先週", `${last.sets}`, compareText(now.sets, last.sets, "diff")));
    statsVolumeCompare.appendChild(compareLine("先週", volumeText(last.volume), compareText(now.volume, last.volume, "percent")));
  } else {
    const text = lastIsRest ? "先週：休みの週" : "先週：記録なし";
    statsSetsCompare.appendChild(document.createTextNode(text));
    statsVolumeCompare.appendChild(document.createTextNode(text));
  }
  if (avg) {
    statsSetsCompare.appendChild(compareLine("4週平均", avg.sets.toFixed(1), compareText(now.sets, avg.sets, "diff")));
    statsVolumeCompare.appendChild(compareLine("4週平均", volumeText(avg.volume), compareText(now.volume, avg.volume, "percent")));
  }

  // 部位ごとのセット数（6部位を横1列。タイルの色で状態を表す）
  // 赤＝今週まだ0セット／緑＝直近4週の平均以上／黄＝平均より少ない
  // 灰＝比べる平均がまだない、または直近4週も0セット（普段やらない部位は警告しない）
  statsParts.innerHTML = "";
  PARTS.forEach((part) => {
    const sets = now.byPart[part];
    const notUsually = avg && avg.byPart[part] === 0; // 直近4週の平均が0の部位
    const li = document.createElement("li");
    if (sets === 0 && !notUsually) li.className = "is-zero";
    else if (avg && sets > 0) li.className = sets >= avg.byPart[part] ? "is-ok" : "is-warn";

    const name = document.createElement("span");
    name.className = "part-name";
    name.textContent = part;
    const count = document.createElement("span");
    count.className = "part-sets";
    count.textContent = sets;
    const diff = document.createElement("span");
    diff.className = "part-diff";
    diff.textContent = avg ? compareText(sets, avg.byPart[part], "diff").text : "—";
    li.append(name, count, diff);
    statsParts.appendChild(li);
  });

  // 色の説明（比べる期間の曜日も入れる）
  statsLegend.textContent = avg
    ? `▲▼は直近4週の平均との差（${WEEKDAYS[0]}〜${WEEKDAYS[dayIndex]}の同じ曜日までで比較）。緑＝平均以上、黄＝平均より少ない、赤＝今週まだ0セット、灰＝直近4週も0セット`
    : "記録が1週間分以上たまると、直近4週の平均と比べて色で表示します。赤＝今週まだ0セット";
}

// =============================================
// 自己ベスト（推定MAX）の計算
// =============================================

// 推定MAX（1回だけ挙げられる重さの推定値）を計算する
// Brzycki式：重量 × 36 ÷ (37 − 回数)。日本でよく使われるRM表とほぼ同じ値になる
// ・回数が多いほど推定がずれるので、13回以上は12回として計算する（少なめに見積もる）
// ・重量0（自重）とアップは対象外なので null を返す
function estimateMax(record) {
  if (!(record.weight > 0) || isWarmup(record)) return null;
  const reps = Math.min(record.reps, 12);
  const value = (record.weight * 36) / (37 - reps);
  return Math.round(value * 10) / 10; // 小数第1位まで
}

// 種目を区別する目印（同じ名前でも部位が違えば別の種目）
function bestKey(record) {
  return `${record.part}|${record.exercise}`;
}

// 全記録から、種目ごとの自己ベストをまとめる
// 戻り値：{ "胸|ベンチプレス": { part, exercise, best, bestDate, bestWeight, bestReps, first, points: [{date, value, isBest}] } }
// bestWeight・bestReps：自己ベストを出したセットの重量と回数（実際のセットの参考値）
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
      bests[key] = { part: record.part, exercise: record.exercise, best: 0, bestDate: "", bestWeight: 0, bestReps: 0, first: 0, points: [] };
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
      item.bestWeight = record.weight;
      item.bestReps = record.reps;
    }
  });

  // 「初回から +○kg」の基準：最初に実施した日の最大値（アップのセットが基準にならないように）
  // グラフで「自己ベストを更新した日」に印を付ける
  Object.values(bests).forEach((item) => {
    item.first = item.points[0].value;
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

// 自己ベストを出したセットを「95kg × 4回」の形にする
function bestSetText(item) {
  return `${item.bestWeight}kg × ${item.bestReps}回`;
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
    // 推定MAXを出したセット（重量×回数）
    const bestSet = document.createElement("span");
    bestSet.className = "best-set";
    bestSet.textContent = `${bestSetText(item)}で達成`;
    value.appendChild(bestSet);
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

  // 右側：推定MAXと、それを出したセット（重量×回数）
  const value = document.createElement("div");
  value.className = "ex-value";
  value.textContent = `${item.best}kg`;
  const bestSet = document.createElement("span");
  bestSet.className = "best-set";
  bestSet.textContent = bestSetText(item);
  value.appendChild(bestSet);
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
// データのバックアップ（書き出し・復元）
// =============================================
// バックアップファイルの中身：
// { app: "workout_log", version: 1, exportedAt: "日時",
//   records: [...], customExercises: [...], settings: {...}, deletedIds: [...] }

const BACKUP_FILE_NAME = "workout_backup.json"; // 毎回同じ名前（同じ場所に保存すると置き換えられる）

// 2つの日付（"YYYY-MM-DD"）の間の日数
function daysBetween(from, to) {
  const toUtc = (dateStr) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(to) - toUtc(from)) / 86400000);
}

// 前回のバックアップ日（まだなら null）
function getLastBackup() {
  return load(KEY_BACKUP_INFO, {}).lastBackup || null;
}

// バックアップのリマインドの文（不要なら空文字）
// 記録が1件以上あり、「一度もしていない」か「前回から14日以上」なら知らせる
function backupReminderText() {
  if (load(KEY_RECORDS, []).length === 0) return "";
  const last = getLastBackup();
  if (!last) {
    return "まだバックアップしていません。ホームの「データのバックアップ」から書き出しておきましょう";
  }
  const days = daysBetween(last, todayString());
  if (days >= BACKUP_REMIND_DAYS) {
    return `前回のバックアップから${days}日たっています。ホームの「データのバックアップ」から書き出しておきましょう`;
  }
  return "";
}

// ホームのバックアップ欄に、前回のバックアップ日を表示する
function renderBackupInfo() {
  const last = getLastBackup();
  if (!last) {
    backupLast.textContent = "前回のバックアップ：まだありません";
  } else {
    const days = daysBetween(last, todayString());
    backupLast.textContent = `前回のバックアップ：${formatDate(last)}（${days === 0 ? "今日" : `${days}日前`}）`;
  }
  backupLast.classList.toggle("is-old", backupReminderText() !== "");
}

// 書き出しが終わったら、今日をバックアップ日として覚える
function markBackedUp() {
  save(KEY_BACKUP_INFO, { lastBackup: todayString() });
  renderBackupInfo();
}

// 「バックアップを書き出す」：全データを1つのファイルにまとめて保存する
async function exportBackup() {
  const backup = {
    app: "workout_log",
    version: 1,
    exportedAt: new Date().toISOString(),
    records: load(KEY_RECORDS, []),
    customExercises: load(KEY_CUSTOM, []),
    settings: loadSettings(),
    deletedIds: load(KEY_DELETED, []),
  };
  const text = JSON.stringify(backup, null, 1);
  const file = new File([text], BACKUP_FILE_NAME, { type: "application/json" });

  // iPhoneでは「共有」画面を開く（「"ファイル"に保存」やAirDropを選べる）
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "筋トレノートのバックアップ" });
      markBackedUp();
      return;
    } catch (error) {
      // 共有画面で「キャンセル」した場合は、何もしない
      if (error.name === "AbortError") return;
      // それ以外のエラーは、下のダウンロードで保存する
    }
  }

  // 共有画面が使えない場合：ファイルとしてダウンロードする
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = BACKUP_FILE_NAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  markBackedUp();
}

// 記録の形が正しいかを確認する（壊れたデータを取り込まないため）
function isValidRecord(r) {
  return (
    r && typeof r.id === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.date) &&
    typeof r.part === "string" && typeof r.exercise === "string" &&
    typeof r.weight === "number" && typeof r.reps === "number" && typeof r.sets === "number"
  );
}

// アプリのデータとバックアップを、記録のidで突き合わせてまとめる（マージ）
// ・両方にある記録      → アプリ側を使う（あとで編集した内容を残す）
// ・アプリにだけある記録 → そのまま残す（バックアップ後に入れた記録を守る）
// ・バックアップにだけある記録 → 戻す（消えてしまった記録を復元する）
// ・削除したidの記録   → どちらにあっても戻さない
function mergeBackup(backup) {
  const appRecords = load(KEY_RECORDS, []);
  const deleted = new Set([...load(KEY_DELETED, []), ...(backup.deletedIds || [])]);
  const appIds = new Set(appRecords.map((r) => r.id));

  // 記録
  const kept = appRecords.filter((r) => !deleted.has(r.id));
  const added = backup.records.filter((r) => isValidRecord(r) && !appIds.has(r.id) && !deleted.has(r.id));
  const removedCount = appRecords.length - kept.length;

  // 追加した種目（部位と名前が同じものは1つにする）
  const custom = load(KEY_CUSTOM, []);
  const customKeys = new Set(custom.map((c) => `${c.part}|${c.name}`));
  const addedCustom = (backup.customExercises || []).filter(
    (c) => c && PARTS.includes(c.part) && typeof c.name === "string" && !customKeys.has(`${c.part}|${c.name}`)
  );

  // 週の予定（同じ週があればアプリ側を使う）
  const settings = loadSettings();
  const backupTargets = (backup.settings && backup.settings.weeklyTargets) || {};
  const addedWeeks = Object.keys(backupTargets).filter(
    (week) => !(week in settings.weeklyTargets) && Array.isArray(backupTargets[week])
  );

  return {
    records: [...kept, ...added],
    customExercises: [...custom, ...addedCustom],
    weeklyTargets: {
      ...settings.weeklyTargets,
      ...Object.fromEntries(addedWeeks.map((week) => [week, backupTargets[week]])),
    },
    deletedIds: [...deleted],
    addedCount: added.length,
    removedCount: removedCount,
    addedCustomCount: addedCustom.length,
    addedWeekCount: addedWeeks.length,
  };
}

// 「バックアップから復元」：選んだファイルを読み込んで、アプリのデータとまとめる
async function importBackup(file) {
  let backup;
  try {
    backup = JSON.parse(await file.text());
  } catch (error) {
    alert("ファイルを読み込めませんでした。バックアップのファイル（workout_backup.json）を選んでください");
    return;
  }
  if (!backup || backup.app !== "workout_log" || !Array.isArray(backup.records)) {
    alert("筋トレノートのバックアップではないようです。ファイルを確認してください");
    return;
  }

  const result = mergeBackup(backup);
  const createdText = backup.exportedAt ? formatDate(dateToString(new Date(backup.exportedAt))) : "日付不明";

  // 何が変わるかを見せてから、実行するか確認する
  const lines = [
    `${createdText}に作ったバックアップから復元します。`,
    "",
    `・戻す記録：${result.addedCount}件`,
  ];
  if (result.removedCount > 0) lines.push(`・削除済みのため消す記録：${result.removedCount}件`);
  if (result.addedCustomCount > 0) lines.push(`・戻す種目：${result.addedCustomCount}件`);
  if (result.addedWeekCount > 0) lines.push(`・戻す週の予定：${result.addedWeekCount}週分`);
  lines.push(
    "",
    result.removedCount > 0
      ? "それ以外の、今アプリにある記録はそのまま残ります。よろしいですか？"
      : "今アプリにある記録はそのまま残ります。よろしいですか？"
  );

  if (!confirm(lines.join("\n"))) return;

  save(KEY_RECORDS, result.records);
  save(KEY_CUSTOM, result.customExercises);
  save(KEY_SETTINGS, { weeklyTargets: result.weeklyTargets });
  save(KEY_DELETED, result.deletedIds);

  // 戻した種目を選択肢に反映する（選んでいた種目はそのまま）
  renderExercises(inputExercise.value === NEW_EXERCISE ? lastExercise : inputExercise.value);
  renderAll();
  alert(`復元しました（戻した記録：${result.addedCount}件）`);
}

// =============================================
// 入力画面の「自己ベスト」ポップアップ
// =============================================
// 漸進性過負荷のため、選んでいる種目の次の3つをすぐ見られるようにする
// ・自己ベストのセット（推定MAXがいちばん大きいセット）
// ・自己ベストを更新するための目標の例（同じ重量で+1回／+2.5kgで同じ回数）
// ・前回のメインのセット（入力中の日付より前で、いちばん新しい日）

// ポップアップの中に、文字の段落を1つ追加する
function addText(parent, className, text) {
  const p = document.createElement("p");
  p.className = className;
  p.textContent = text;
  parent.appendChild(p);
  return p;
}

// 「自己ベスト」「更新するには」「前回のメイン」の区切りを1つ作る
function addSection(label) {
  const section = document.createElement("div");
  section.className = "best-section";
  addText(section, "best-label", label);
  bestBody.appendChild(section);
  return section;
}

// 重さの刻み：ダンベルの種目は1kg、それ以外は2.5kg
// ・種目名に「ダンベル」が付くもの
// ・名前に付かないが、ほぼダンベルで行う種目
//  （ショルダープレスなど、ダンベル以外でも行う種目は 2.5kg のまま）
const DUMBBELL_EXERCISES = ["サイドレイズ", "フロントレイズ", "リアレイズ", "ハンマーカール"];
function weightStep(exercise) {
  return exercise.includes("ダンベル") || DUMBBELL_EXERCISES.includes(exercise) ? 1 : 2.5;
}

// 「重量 × 回数 補足」の1行を、表のように4つの列に分けて追加する
// 列：重量（右揃え）／×（中央）／回数（左揃え）／補足（推定○kg や × Nセット）
// 3つの項目すべてで同じ列の位置を使うので、重量・×・回数・補足の位置がそれぞれ揃う
function addSetLine(parent, weight, reps, extra) {
  const line = document.createElement("div");
  line.className = "set-line";
  const cells = [
    ["set-weight", weight === 0 ? "自重" : `${weight}kg`],
    ["set-times", "×"],
    ["set-reps", `${reps}回`],
    ["set-extra", extra],
  ];
  cells.forEach(([className, text]) => {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    line.appendChild(span);
  });
  parent.appendChild(line);
}

function openBestModal() {
  const part = inputPart.value;
  const exercise = inputExercise.value;
  bestBody.innerHTML = "";

  if (!exercise || exercise === NEW_EXERCISE) {
    bestTitle.textContent = "自己ベスト";
    addText(bestBody, "best-empty", "種目を選んでください");
  } else {
    bestTitle.textContent = exercise;
    const records = load(KEY_RECORDS, []);
    const best = getBests(records)[`${part}|${exercise}`];

    // 自己ベストのセットと、更新するための目標の例
    if (best) {
      const section = addSection("自己ベスト");
      addSetLine(section, best.bestWeight, best.bestReps, `（推定${best.best}kg）`);
      addText(section, "best-meta", formatDate(best.bestDate));

      const goals = addSection("更新するには（どちらか）");
      const addGoal = (weight, reps) => {
        addSetLine(goals, weight, reps, `（推定${estimateMax({ weight: weight, reps: reps })}kg）`);
      };
      // 同じ重量で、もう1回（12回までは回数が増えると推定MAXも増える）
      if (best.bestReps < 12) addGoal(best.bestWeight, best.bestReps + 1);
      // 1段階重くして、同じ回数（ダンベルは1kg刻み、それ以外は2.5kg刻み）
      addGoal(Math.round((best.bestWeight + weightStep(exercise)) * 10) / 10, best.bestReps);
    }

    // 前回のメイン：入力中の日付より前で、この種目のメインを記録したいちばん新しい日
    const today = inputDate.value || todayString();
    const mains = records.filter((r) => r.part === part && r.exercise === exercise && !isWarmup(r) && r.date < today);
    if (mains.length > 0) {
      const lastDate = mains.map((r) => r.date).sort().pop();
      const section = addSection(`前回のメイン（${formatDate(lastDate)}）`);
      // 同じ重量・回数が続いたセットは「× Nセット」にまとめる（一覧と同じまとめ方）
      groupSameSets(mains.filter((r) => r.date === lastDate)).forEach((rows) => {
        const r = rows[0];
        const sets = rows.reduce((sum, x) => sum + x.sets, 0);
        addSetLine(section, r.weight, r.reps, sets > 1 ? `× ${sets}セット` : "");
      });
    }

    if (!best && mains.length === 0) {
      addText(bestBody, "best-empty", "まだメインの記録がありません");
    } else if (!best) {
      addText(bestBody, "best-empty", "自重の種目は、自己ベスト（推定MAX）の対象外です");
    }
  }

  bestModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeBestModal() {
  bestModal.hidden = true;
  document.body.classList.remove("modal-open");
}

// =============================================
// ホームの中のタブ（今週／ランキング／種目別）
// =============================================

// ホームの中のタブの並び（左から順に）
const HOME_PANELS = ["week", "rank", "part"];
const homePager = document.getElementById("home-pager");
const segmentIndicator = document.getElementById("segment-indicator");

const homeTrack = document.getElementById("home-track");

// いま表示しているタブの番号（0=今週、1=ランキング、2=種目別）
let homeIndex = 0;
// 送りの動きが終わったあとの処理を予約するタイマー
let homeAnimTimer = null;

// 指の動きの記録（スワイプ中だけ使う）
const drag = {
  active: false,  // 指が触れているか
  dir: null,      // 動かし始めの向き："x"（横）／"y"（縦）／null（まだ決まっていない）
  startX: 0,
  startY: 0,
  dx: 0,          // 横に動いた距離
  history: [],    // 直近の指の位置と時刻（はじいた速さを出すため）
};

// 1タブ分の幅（＝見える窓の幅）
function pagerWidth() {
  return homePager.clientWidth;
}

// 帯の位置と、上の選択中の印を動かす
// position：タブの番号を小数で表した位置（例：0.5 は「今週」と「ランキング」のちょうど中間）
// animate：true なら0.3秒かけて動かす、false なら指に合わせてすぐ動かす
function setPagerPosition(position, animate) {
  homeTrack.classList.toggle("is-animating", animate);
  segmentIndicator.classList.toggle("is-animating", animate);
  homeTrack.style.transform = `translateX(${-position * pagerWidth()}px)`;
  const clamped = Math.min(Math.max(position, 0), HOME_PANELS.length - 1);
  segmentIndicator.style.transform = `translateX(${clamped * 100}%)`;
  const index = Math.round(clamped);
  document.querySelectorAll(".segment-btn").forEach((b, i) => {
    b.classList.toggle("is-active", i === index);
  });
}

// 表示しているタブの高さに、窓の高さを合わせる（下に余白が出ないように）
function fitPagerHeight() {
  const panel = document.getElementById(`panel-${HOME_PANELS[homeIndex]}`);
  if (panel) homePager.style.height = `${panel.offsetHeight}px`;
}

// 指定したタブへ移る（0.3秒の送りの動き → 止まったら高さを合わせる）
function goToHomePanel(index) {
  homeIndex = Math.min(Math.max(index, 0), HOME_PANELS.length - 1);
  setPagerPosition(homeIndex, true);
  clearTimeout(homeAnimTimer);
  homeAnimTimer = setTimeout(() => {
    homeTrack.classList.remove("is-animating");
    segmentIndicator.classList.remove("is-animating");
    fitPagerHeight();
  }, 320);
}

// 位置と高さを今のタブに合わせ直す（ホームを表示したとき・画面の幅や中身の高さが変わったとき）
function syncHomePager() {
  if (pagerWidth() === 0 || drag.active) return; // 非表示のときと、スワイプ中は何もしない
  setPagerPosition(homeIndex, false);
  fitPagerHeight();
}

// ボタンを押したときなどに、指定したタブへ移る
function showHomePanel(name) {
  goToHomePanel(HOME_PANELS.indexOf(name));
}

// --- スワイプ（指の動き） ---

function onPagerTouchStart(event) {
  const touch = event.touches[0];
  // 2本指の操作と、画面の端（Safariの「戻る」操作）から始まった動きは扱わない
  if (event.touches.length !== 1 || touch.clientX < 16 || touch.clientX > window.innerWidth - 16) {
    drag.active = false;
    return;
  }
  drag.active = true;
  drag.dir = null;
  drag.startX = touch.clientX;
  drag.startY = touch.clientY;
  drag.dx = 0;
  drag.history = [{ x: touch.clientX, t: event.timeStamp }];
  clearTimeout(homeAnimTimer);
}

function onPagerTouchMove(event) {
  if (!drag.active) return;
  const touch = event.touches[0];
  const dx = touch.clientX - drag.startX;
  const dy = touch.clientY - drag.startY;

  // 動かし始め（8px）で、横の操作か縦の操作かを決める
  if (drag.dir === null) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    drag.dir = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    // 横に動かし始めたら、中身の高さで切れないように、窓の高さの固定をいったん外す
    if (drag.dir === "x") homePager.style.height = "";
  }
  if (drag.dir !== "x") return; // 縦の操作は、ふつうの縦スクロールに任せる

  event.preventDefault(); // 横に動かしている間は、画面が縦に動かないようにする
  // 端のタブでさらに引っ張ったときは、少しだけ動く（引っ張りの手応え）
  const atEdge = (homeIndex === 0 && dx > 0) || (homeIndex === HOME_PANELS.length - 1 && dx < 0);
  drag.dx = atEdge ? dx * 0.3 : dx;
  setPagerPosition(homeIndex - drag.dx / pagerWidth(), false);

  // はじいた速さを出すため、直近0.1秒の指の位置を残す
  drag.history.push({ x: touch.clientX, t: event.timeStamp });
  while (drag.history.length > 2 && event.timeStamp - drag.history[0].t > 100) drag.history.shift();
}

function onPagerTouchEnd(event) {
  if (!drag.active) return;
  drag.active = false;
  if (drag.dir !== "x") {
    fitPagerHeight();
    return;
  }

  // はじいた速さ（px/ミリ秒。右向きがプラス）
  const first = drag.history[0];
  const last = drag.history[drag.history.length - 1];
  const dt = last.t - first.t;
  const velocity = dt > 0 ? (last.x - first.x) / dt : 0;

  // 次のどちらかなら、隣のタブへ移る。どちらでもなければ元のタブに戻る
  // ・タブ幅の15%以上動かした
  // ・速くはじいた（0.3px/ミリ秒以上）
  let next = homeIndex;
  const moved = drag.dx / pagerWidth();
  if (moved < -0.15 || velocity < -0.3) next = homeIndex + 1; // 左へ動かした → 右隣のタブ
  if (moved > 0.15 || velocity > 0.3) next = homeIndex - 1;   // 右へ動かした → 左隣のタブ
  goToHomePanel(next);
}

function setupHomeTabs() {
  document.querySelectorAll(".segment-btn").forEach((button) => {
    button.addEventListener("click", () => showHomePanel(button.dataset.panel));
  });

  // スワイプは、ホーム画面のどこを触っても受け付ける
  // （タブの中身が短いときに、その下の空いている部分でもスワイプできるように）
  const homeScreen = document.getElementById("screen-home");
  homeScreen.addEventListener("touchstart", onPagerTouchStart, { passive: true });
  // 横の操作のときに画面の縦の動きを止めるため、passive: false にする
  homeScreen.addEventListener("touchmove", onPagerTouchMove, { passive: false });
  homeScreen.addEventListener("touchend", onPagerTouchEnd, { passive: true });
  homeScreen.addEventListener("touchcancel", onPagerTouchEnd, { passive: true });

  // 種目別を開いた・記録が増えたなどで中身の高さが変わったら、高さを合わせ直す
  const observer = new ResizeObserver(() => {
    if (!drag.active && !homeTrack.classList.contains("is-animating")) fitPagerHeight();
  });
  document.querySelectorAll(".home-panel").forEach((panel) => observer.observe(panel));
  window.addEventListener("resize", syncHomePager);
}

// =============================================
// 左右のスワイプ
// =============================================

// 要素に、左右のスワイプの処理を付ける
// ・横の動きが50px以上で、縦の動きよりはっきり大きいときだけスワイプとみなす（縦スクロールと区別するため）
// ・画面の端（左右20px）から始まった動きは無視する（Safariの「戻る」操作とぶつからないように）
function addSwipe(element, onSwipeLeft, onSwipeRight) {
  let startX = null;
  let startY = 0;

  element.addEventListener("touchstart", (event) => {
    const touch = event.touches[0];
    const edge = 20;
    if (event.touches.length !== 1 || touch.clientX < edge || touch.clientX > window.innerWidth - edge) {
      startX = null;
      return;
    }
    startX = touch.clientX;
    startY = touch.clientY;
  }, { passive: true });

  element.addEventListener("touchend", (event) => {
    if (startX === null) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    startX = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) onSwipeLeft();
    else onSwipeRight();
  }, { passive: true });
}

// 横から入ってくる動きを1回だけ再生する
function playSlide(element, className) {
  element.classList.remove("slide-from-right", "slide-from-left");
  void element.offsetWidth; // 同じ動きを続けて再生できるように、一度リセットする
  element.classList.add(className);
  element.addEventListener("animationend", () => element.classList.remove(className), { once: true });
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
  // ホームを表示したら、上の選択中の印と高さを合わせる
  if (name === "home") syncHomePager();
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
  // カレンダーを左にスワイプ → 次の月、右にスワイプ → 前の月
  addSwipe(document.querySelector(".calendar"), () => changeMonth(1), () => changeMonth(-1));
  btnCancelEdit.addEventListener("click", cancelEdit);
  typeButtons.forEach((button) => {
    button.addEventListener("click", () => setType(button.dataset.type));
  });
  btnEditPlan.addEventListener("click", () => openPlanModal("edit"));
  btnPlanOk.addEventListener("click", submitPlan);
  btnPlanLater.addEventListener("click", closePlanModal);
  btnPlanRest.addEventListener("click", restThisWeek);
  btnPbOk.addEventListener("click", closePbModal);
  // 自己ベストのポップアップ：ボタンで開き、✕ボタンかポップアップの外側（暗い部分）を触ると閉じる
  btnBest.addEventListener("click", openBestModal);
  btnBestClose.addEventListener("click", closeBestModal);
  bestModal.addEventListener("click", (event) => {
    if (event.target === bestModal) closeBestModal();
  });
  btnExport.addEventListener("click", exportBackup);
  // 「バックアップから復元」は、隠してあるファイル選択を開く
  btnImport.addEventListener("click", () => inputImport.click());
  inputImport.addEventListener("change", async () => {
    const file = inputImport.files[0];
    inputImport.value = ""; // 同じファイルをもう一度選べるように空にしておく
    if (file) await importBackup(file);
  });
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
