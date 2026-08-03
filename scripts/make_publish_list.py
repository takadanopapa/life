#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
GitHub(takadanopapa/life @ main) と手元を突き合わせて、
「中身が違う／GitHubに無い」ファイルだけの publish リスト(JSON)を作る。

gh-publish.mjs は 1 回の実行を 1 コミットにまとめる（Cloudflare Pages のビルド競合よけ）。
そのため大量ファイルでも分割せず、このリストを `@ファイル` 渡しで一度に流す。

使い方:
  python scripts/make_publish_list.py <出力json> [対象パス ...]
  対象パスを省略すると、公開に必要な既定セット（_posts, _layouts, assets, scripts 他）を見る。
"""

import hashlib
import json
import os
import subprocess
import sys

OWNER_REPO = 'takadanopapa/life'
BRANCH = 'main'
TOKEN_FILE = r'C:\babalog\keys\gh_token.txt'

DEFAULT_TARGETS = [
    '_posts', '_layouts', 'assets/css', 'assets/img', 'scripts',
    '_config.yml', 'index.md', 'about.md', 'contact.md', 'privacy.md', 'robots.txt',
]
# ビルドに関係なく、リポジトリに置かない/置く必要のないもの
SKIP_NAMES = {'.DS_Store', 'Thumbs.db', 'rebuild-trigger.txt'}
SKIP_EXT = {'.tmp'}


def git_blob_sha(path):
    """git の blob オブジェクトSHA（GitHub API の tree.sha と同じ値）"""
    data = open(path, 'rb').read()
    h = hashlib.sha1()
    h.update(b'blob %d\x00' % len(data))
    h.update(data)
    return h.hexdigest()


def fetch_tree():
    token = open(TOKEN_FILE, encoding='utf-8').read().strip()
    url = 'https://api.github.com/repos/%s/git/trees/%s?recursive=1' % (OWNER_REPO, BRANCH)
    out = subprocess.run(
        ['curl.exe', '-s', '-H', 'Authorization: Bearer ' + token,
         '-H', 'Accept: application/vnd.github+json', url],
        capture_output=True, check=True).stdout
    tree = json.loads(out)
    if 'tree' not in tree:
        raise SystemExit('GitHub tree が取得できません: %s' % str(tree)[:300])
    if tree.get('truncated'):
        raise SystemExit('tree が truncated。件数が多すぎるので方式を見直すこと。')
    return {b['path']: b['sha'] for b in tree['tree'] if b['type'] == 'blob'}


def walk(targets, root):
    for t in targets:
        p = os.path.join(root, t)
        if os.path.isfile(p):
            yield p
        elif os.path.isdir(p):
            for dirpath, _dirs, files in os.walk(p):
                for f in files:
                    yield os.path.join(dirpath, f)


def main(argv):
    if not argv:
        print(__doc__)
        return 1
    out_path = argv[0]
    targets = argv[1:] or DEFAULT_TARGETS

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    remote = fetch_tree()

    items = []
    same = 0
    for p in sorted(walk(targets, root)):
        base = os.path.basename(p)
        if base in SKIP_NAMES or os.path.splitext(base)[1] in SKIP_EXT:
            continue
        rel = os.path.relpath(p, root).replace(os.sep, '/')
        if remote.get(rel) == git_blob_sha(p):
            same += 1
            continue
        items.append([p.replace(os.sep, '/'), rel])

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False)

    n_img = len([1 for _l, r in items if r.startswith('assets/img/')])
    total = sum(os.path.getsize(l) for l, _r in items)
    print('GitHubと同一でスキップ: %d 件' % same)
    print('push対象: %d 件（うち画像 %d 件） / 転送 %.1fMB' % (len(items), n_img, total / 1048576))
    for _l, r in items:
        if not r.startswith('assets/img/'):
            print('   ' + r)
    print('-> %s' % out_path)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
