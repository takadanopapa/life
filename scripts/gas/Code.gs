/**
 * 馬場ログ — Gmail[BLOG] → Google ドライブ 橋渡しスクリプト
 *
 * 役割:
 *   ラベル「blog」が付いた未処理メールを探し、各メールごとに
 *   Drive上の保存先フォルダ（BabaBlog-Inbox/<日付>_<店名>/）を作り、
 *     - memo.txt   … 件名・日時・本文（＝店名/食べたもの等のテキスト）
 *     - meta.json  … 構造化メタ（後段のClaudeが読む）
 *     - 画像ファイル … 添付＆インライン画像をそのまま保存
 *   を書き出す。処理済みメールには「blog-done」ラベルを付けて二重処理を防ぐ。
 *
 * 後段（1日1回のClaude）は Gmail を触らず、この Drive フォルダだけを読む。
 *
 * 設置: scripts/gas/README.md を参照。
 */

// ====== 設定（必要なら変更）======
// 差出人と宛先の組み合わせで判定する（件名の合言葉は不要）。
const FROM_ADDRESS = 'goemonama@gmail.com';   // この人から
const TO_ADDRESS = 'nozawa@beyonds.ai';       // このアドレス宛（TO）に届いたメールを対象にする
const SUBJECT_TAG = 'ばばろぐ';                // 任意。件名に付いていれば店名の判定時に取り除くだけ（付けなくてよい）
const SKIP_WORDS = ['非公開', 'skip', 'スキップ', 'ブログ不要']; // 件名にこれが入っていたら対象外（保険）
const DONE_LABEL = 'blog-done';       // 処理済みメールに付けるラベル名（スクリプトが自動作成）
const ROOT_FOLDER_NAME = 'BabaBlog-Inbox'; // Driveの保存先ルートフォルダ名（マイドライブ直下に自動作成）
const MAX_THREADS = 50;               // 1回の実行で処理する最大スレッド数

/**
 * メイン。時間主導トリガーからこれを呼ぶ。
 */
function processBlogEmails() {
  const doneLabel = getOrCreateLabel(DONE_LABEL);
  const root = getOrCreateFolder(ROOT_FOLDER_NAME);

  // 対象 = FROM_ADDRESS から TO_ADDRESS 宛、blog-doneラベルが無い、直近30日のメール
  const query = 'from:' + FROM_ADDRESS + ' to:' + TO_ADDRESS +
    ' -label:' + DONE_LABEL + ' newer_than:30d';
  const threads = GmailApp.search(query, 0, MAX_THREADS);

  let saved = 0;
  let skipped = 0;
  threads.forEach(function (thread) {
    let processedAny = false;
    thread.getMessages().forEach(function (msg) {
      // スレッド検索は関係ないメールも拾うので、1通ずつ差出人と宛先を確かめる
      if (!isTarget_(msg)) return;
      if (hasSkipWord_(msg.getSubject() || '')) {
        skipped++;
        processedAny = true; // ラベルを付けて次回以降も対象外にする
        console.log('スキップ（件名に除外ワード）: ' + msg.getSubject());
        return;
      }
      try {
        saveMessage_(msg, root);
        saved++;
        processedAny = true;
      } catch (e) {
        console.error('保存失敗: ' + msg.getSubject() + ' / ' + e);
      }
    });
    if (processedAny) thread.addLabel(doneLabel);
  });

  console.log('処理スレッド: ' + threads.length + ' / 保存: ' + saved + ' / スキップ: ' + skipped);
}

/**
 * このメールがブログ化の対象か（差出人＝FROM_ADDRESS、宛先(TO)にTO_ADDRESSを含む）。
 */
function isTarget_(msg) {
  const from = (msg.getFrom() || '').toLowerCase();
  const to = (msg.getTo() || '').toLowerCase();
  if (from.indexOf(FROM_ADDRESS.toLowerCase()) === -1) return false;
  if (to.indexOf(TO_ADDRESS.toLowerCase()) === -1) return false;
  return true;
}

/**
 * 件名に除外ワードが入っているか（ブログにしたくないメールの逃げ道）。
 */
function hasSkipWord_(subject) {
  const s = subject.toLowerCase();
  return SKIP_WORDS.some(function (w) { return s.indexOf(w.toLowerCase()) !== -1; });
}

/**
 * 1通のメールを Drive フォルダに保存。
 */
function saveMessage_(msg, root) {
  const date = msg.getDate();
  const dateStr = Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy-MM-dd_HHmm');
  const subject = msg.getSubject() || '(無題)';
  // 件名は「原則、店名だけ」。日付や合言葉が混ざっていても取り除いて店名を取り出す。
  const parsed = parseSubject_(subject);
  const shop = parsed.shop || '無題';
  const folderName = dateStr + '_' + sanitize_(shop);
  const folder = root.createFolder(folderName);

  const body = msg.getPlainBody() || '';

  // 人間が読むテキスト
  folder.createFile(
    'memo.txt',
    '件名: ' + subject + '\n日時: ' + date + '\n差出人: ' + msg.getFrom() + '\n\n' + body,
    'text/plain'
  );

  // Claudeが読む構造化メタ
  const meta = {
    subject: subject,
    shop_hint: shop,                       // 件名から日付・合言葉を除いた「店名らしい部分」
    date_in_subject: parsed.dateText,      // 件名に日付が混ざっていた場合の生文字列（例 "7/22"）。無ければ ""
    date_in_subject_iso: parsed.dateIso,   // 上を解決した YYYY-MM-DD（今日以前の直近で解釈）。無ければ ""
    from: msg.getFrom(),
    to: msg.getTo(),
    date_iso: date.toISOString(),
    body: body,
    gmail_message_id: msg.getId(),
    saved_at: new Date().toISOString(),
    status: 'pending' // 公開後にClaudeが published.txt を置く運用
  };
  folder.createFile('meta.json', JSON.stringify(meta, null, 2), 'application/json');

  // 画像（添付＋インライン）
  const atts = msg.getAttachments({ includeInlineImages: true, includeAttachments: true });
  let imgCount = 0;
  atts.forEach(function (att) {
    const ct = (att.getContentType() || '').toLowerCase();
    if (ct.indexOf('image/') === 0) {
      imgCount++;
      const blob = att.copyBlob();
      const ext = ct.split('/')[1].split('+')[0] || 'jpg';
      blob.setName(pad2_(imgCount) + '.' + (ext === 'jpeg' ? 'jpg' : ext));
      folder.createFile(blob);
    }
  });

  console.log('保存: ' + folderName + ' （画像 ' + imgCount + ' 枚）');
}

// ====== ヘルパー ======
function getOrCreateLabel(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

function getOrCreateFolder(name) {
  const it = DriveApp.getRootFolder().getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.getRootFolder().createFolder(name);
}

// 件名からキーワード（SUBJECT_TAG）を1回だけ取り除く（大文字小文字を無視）。店名の抽出に使う。
function stripTag_(subject) {
  const lower = subject.toLowerCase();
  const tag = SUBJECT_TAG.toLowerCase();
  const idx = lower.indexOf(tag);
  const out = idx === -1 ? subject : subject.slice(0, idx) + subject.slice(idx + SUBJECT_TAG.length);
  return out.trim();
}

/**
 * 件名を「店名」と「うっかり混ざった日付」に分ける。
 *
 * 件名は原則 店名だけ の運用だが、「7/22 てけてけ」「ばばろぐ 7月22日 でですけ」のように
 * 日付や合言葉が入っても困らないようにする。
 *   入力: "ばばろぐ 7/22 てけてけ"  → { shop: "てけてけ", dateText: "7/22", dateIso: "2026-07-22" }
 *   入力: "てけてけ"               → { shop: "てけてけ", dateText: "",     dateIso: "" }
 * 日付は「今日以前で最も近い年」で解釈する（未来になるなら前年）。
 */
function parseSubject_(subject) {
  let s = stripTag_(subject);

  // 日付らしい表記を探す（年あり → 年なし の順に試す）
  const patterns = [
    /(\d{4})[\/\-年](\d{1,2})[\/\-月](\d{1,2})日?/,   // 2026/7/22, 2026年7月22日
    /(\d{1,2})[\/\-月](\d{1,2})日?/                    // 7/22, 7月22日
  ];

  let dateText = '';
  let dateIso = '';
  for (let i = 0; i < patterns.length; i++) {
    const m = s.match(patterns[i]);
    if (!m) continue;
    dateText = m[0];
    const now = new Date();
    let y, mo, d;
    if (m.length === 4) {
      y = parseInt(m[1], 10); mo = parseInt(m[2], 10); d = parseInt(m[3], 10);
    } else {
      mo = parseInt(m[1], 10); d = parseInt(m[2], 10);
      y = now.getFullYear();
      // その月日が今日より未来なら前年とみなす
      if (new Date(y, mo - 1, d).getTime() > now.getTime()) y -= 1;
    }
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      dateIso = y + '-' + pad2_(mo) + '-' + pad2_(d);
      s = (s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length));
    } else {
      dateText = '';
    }
    break;
  }

  // 区切り記号と余分な空白を落として店名だけにする
  // 「ー」（カタカナの長音）は店名に使うので落とさないこと
  const trimChars = /^[\s　\-‐–—―:：;；、,，。\.\/|｜>＞]+|[\s　\-‐–—―:：;；、,，。\/|｜>＞]+$/g;
  const shop = s.replace(/[\s　]+/g, ' ').replace(trimChars, '').trim();
  return { shop: shop, dateText: dateText, dateIso: dateIso };
}

function sanitize_(s) {
  return s.replace(/[\\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').slice(0, 60);
}

function pad2_(n) {
  return (n < 10 ? '0' : '') + n;
}

/**
 * 一度だけ実行: 15分おきの自動実行トリガーを登録する。
 */
function installTrigger() {
  // 既存の同名トリガーを掃除
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'processBlogEmails') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('processBlogEmails').timeBased().everyMinutes(15).create();
  console.log('15分おきのトリガーを登録しました。');
}
