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
const BLOG_LABEL = 'blog';            // 投稿対象メールに付けるGmailラベル名
const DONE_LABEL = 'blog-done';       // 処理済みメールに付けるラベル名
const ROOT_FOLDER_NAME = 'BabaBlog-Inbox'; // Driveの保存先ルートフォルダ名
const MAX_THREADS = 20;               // 1回の実行で処理する最大スレッド数

/**
 * メイン。時間主導トリガーからこれを呼ぶ。
 */
function processBlogEmails() {
  const doneLabel = getOrCreateLabel(DONE_LABEL);
  const root = getOrCreateFolder(ROOT_FOLDER_NAME);

  // 未処理 = blogラベルあり かつ blog-doneラベルなし
  const query = 'label:' + BLOG_LABEL + ' -label:' + DONE_LABEL;
  const threads = GmailApp.search(query, 0, MAX_THREADS);

  let saved = 0;
  threads.forEach(function (thread) {
    thread.getMessages().forEach(function (msg) {
      try {
        saveMessage_(msg, root);
        saved++;
      } catch (e) {
        console.error('保存失敗: ' + msg.getSubject() + ' / ' + e);
      }
    });
    thread.addLabel(doneLabel);
  });

  console.log('処理スレッド: ' + threads.length + ' / 保存メッセージ: ' + saved);
}

/**
 * 1通のメールを Drive フォルダに保存。
 */
function saveMessage_(msg, root) {
  const date = msg.getDate();
  const dateStr = Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy-MM-dd_HHmm');
  const subject = msg.getSubject() || '(無題)';
  const shop = subject.replace(/\[BLOG\]/i, '').trim() || '無題';
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
    shop_hint: shop,
    from: msg.getFrom(),
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
