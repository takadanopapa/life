// Google Drive の download_file_content が大きなファイルを保存した JSON(.txt) から、
// base64 の "content" を取り出してバイナリに復元する補助スクリプト。
// 使い方: node decode-drive-file.mjs <driveJsonFile> <outPath>
//
// 復元したあと optimize_images.py を必ず通す。スマホ撮影の原寸（長辺3000px超・数MB）を
// そのまま置くと、記事一覧で数十枚を一斉に読み込んで表示が終わらなくなるため。
// 長辺1600pxの本体 + -thumb(640px) + -blur(32px) の3枚がそろった状態にする。
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const src = process.argv[2];
const out = process.argv[3];
const obj = JSON.parse(fs.readFileSync(src, 'utf8'));
const buf = Buffer.from(obj.content, 'base64');
fs.mkdirSync(out.substring(0, out.lastIndexOf('/')), { recursive: true });
fs.writeFileSync(out, buf);
console.log('mimeType:', obj.mimeType, 'title:', obj.title, 'bytes:', buf.length, '->', out);

// --- Web配信用に最適化（失敗しても投稿自体は止めない） ---
const optimizer = path.join(path.dirname(fileURLToPath(import.meta.url)), 'optimize_images.py');
const r = spawnSync('python', [optimizer, out], {
  encoding: 'utf8',
  env: { ...process.env, PYTHONUTF8: '1' },
});
if (r.error || r.status !== 0) {
  console.warn('WARN: 画像最適化に失敗しました。原寸のままなので、投稿前に手動で');
  console.warn('      python scripts/optimize_images.py <このフォルダ>');
  console.warn('      を実行してください。理由:', r.error?.message || r.stderr || `exit ${r.status}`);
} else {
  process.stdout.write(r.stdout);
  console.log('optimized:', out.replace(/\.[^.]+$/, '') + '{-thumb,-blur}.jpg も生成');
}
