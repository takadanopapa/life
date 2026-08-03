// GitHub へファイル群を「1コミットにまとめて」投稿/更新する補助スクリプト（Git Data API 版）。
//
// なぜ 1 コミットか:
//   旧版は Contents API で 1 ファイル = 1 コミットしていた。多数ファイルを短時間に
//   連続コミットすると、Cloudflare Pages が途中のコミットでビルド→公開し、後続コミットの
//   ビルドが競合・脱落して「一部の記事だけ公開されない」事故が起きた。
//   本版は blobs → tree → commit → ref 更新で全ファイルを 1 コミットにするため、
//   ビルドは 1 回だけ走り、取りこぼしが起きない。
//
// 使い方: node gh-publish.mjs <tokenFile> '[["<local>","<repoPath>"], ...]' ["commit message"]
//   例:    node gh-publish.mjs token.txt '[["C:/.../_posts/x.md","_posts/x.md"]]'
//   削除:  local を null にすると repoPath を削除する（例 [null,"assets/old.txt"]）
//   多数:  '@<jsonファイル>' と書くとファイルからリストを読む。
//          Windows のコマンドライン長（32767文字）を超える枚数（画像の一括入れ替え等）は
//          必ずこちらを使う。分割すると複数コミットになり、下記のビルド競合が再発する。
import fs from 'node:fs';

const TOKEN = fs.readFileSync(process.argv[2], 'utf8').trim();
const OWNER = 'takadanopapa';
const REPO = 'life';
const BRANCH = 'main';
const arg = process.argv[3];
const files = JSON.parse(
  arg.startsWith('@') ? fs.readFileSync(arg.slice(1), 'utf8') : arg
);
const MESSAGE = process.argv[4]; // 任意。無ければ自動生成。

if (!Array.isArray(files) || files.length === 0) {
  console.error('No files given.');
  process.exit(1);
}

const BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;

async function gh(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'baba-blog-publisher',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    throw new Error(`${opts.method || 'GET'} ${path} -> ${res.status} ${JSON.stringify(json).slice(0, 300)}`);
  }
  return json;
}

try {
  // 1) 現在の main の HEAD コミットと、その tree を取得
  const ref = await gh(`/git/ref/heads/${BRANCH}`);
  const headSha = ref.object.sha;
  const headCommit = await gh(`/git/commits/${headSha}`);
  const baseTreeSha = headCommit.tree.sha;

  // 2) 追加/更新ファイルは blob 化。削除は sha:null。
  const treeItems = [];
  for (const [local, repoPath] of files) {
    if (local === null || local === undefined) {
      treeItems.push({ path: repoPath, mode: '100644', type: 'blob', sha: null });
      console.log('delete', repoPath);
      continue;
    }
    const content = fs.readFileSync(local).toString('base64');
    const blob = await gh(`/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content, encoding: 'base64' }),
    });
    treeItems.push({ path: repoPath, mode: '100644', type: 'blob', sha: blob.sha });
    console.log('blob  ', repoPath, '->', blob.sha.slice(0, 12));
  }

  // 3) 新しい tree を作成（既存 tree をベースに差分適用）
  const tree = await gh(`/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
  });

  // 4) 1 つのコミットを作成
  const addUpd = files.filter(([l]) => l !== null && l !== undefined).map(([, p]) => p);
  const dels = files.filter(([l]) => l === null || l === undefined).map(([, p]) => p);
  const auto =
    `post: ${files.length} file(s)` +
    (addUpd.length ? ` +${addUpd.length}` : '') +
    (dels.length ? ` -${dels.length}` : '') +
    ` [${files.map(([, p]) => p).join(', ')}]`.slice(0, 200);
  const commit = await gh(`/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message: MESSAGE || auto, tree: tree.sha, parents: [headSha] }),
  });

  // 5) main を新コミットに進める
  await gh(`/git/refs/heads/${BRANCH}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  console.log(`OK 1 commit ${commit.sha.slice(0, 12)} (${files.length} files) -> https://github.com/${OWNER}/${REPO}/commit/${commit.sha}`);
} catch (e) {
  console.error('FAILED:', e.message);
  process.exit(1);
}
