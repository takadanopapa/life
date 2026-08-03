#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
画像の整合性チェック（投稿前・push前の確認用）

  1. 記事の hero / images が参照するファイルが実在するか
  2. hero に対応する -thumb.jpg / -blur.jpg が実在するか
     （_layouts/home.html と post.html がこの命名で参照するため、無いと画像が欠ける）
  3. 長辺・ファイルサイズが最適化後の想定に収まっているか

使い方: python scripts/verify_images.py
終了コード 0 = 問題なし / 1 = 要対応
"""

import glob
import os
import re
import sys

from PIL import Image

MAX_LONG = 1600
WARN_BYTES = 500 * 1024

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(root)

errors = []
warns = []

hero_re = re.compile(r'^hero:\s*(\S+)\s*$', re.M)
img_re = re.compile(r'/assets/img/[^\s"\'\)\]]+')

posts = sorted(glob.glob('_posts/*.md'))
for md in posts:
    name = os.path.basename(md)
    text = open(md, encoding='utf-8').read()

    for ref in set(img_re.findall(text)):
        if not os.path.exists(ref.lstrip('/')):
            errors.append('%s: 参照先が存在しない %s' % (name, ref))

    m = hero_re.search(text)
    if not m:
        warns.append('%s: hero が未設定' % name)
        continue
    hero = m.group(1).strip('"\'')
    if hero.lower().endswith('.svg'):
        continue          # プレースホルダーは派生ファイル不要
    stem = os.path.splitext(hero)[0]
    for suffix in ('-thumb.jpg', '-blur.jpg'):
        p = (stem + suffix).lstrip('/')
        if not os.path.exists(p):
            errors.append('%s: %s が無い（一覧/heroの背景が欠ける）' % (name, stem + suffix))

# 実ファイル側のサイズ検査
for p in sorted(glob.glob('assets/img/posts/*/*.jpg')):
    base = os.path.basename(p)
    if '-blur.' in base:
        continue
    size = os.path.getsize(p)
    try:
        with Image.open(p) as im:
            long_side = max(im.size)
    except Exception as e:
        errors.append('%s: 画像として開けない (%s)' % (p, e))
        continue
    limit = MAX_LONG if '-thumb.' not in base else 640
    if long_side > limit:
        errors.append('%s: 長辺 %dpx（上限 %dpx）— optimize_images.py を実行' % (p, long_side, limit))
    elif '-thumb.' not in base and size > WARN_BYTES:
        warns.append('%s: %.0fKB（重い）' % (p, size / 1024))

n_thumb = len(glob.glob('assets/img/posts/*/*-thumb.jpg'))
n_blur = len(glob.glob('assets/img/posts/*/*-blur.jpg'))
n_main = len([p for p in glob.glob('assets/img/posts/*/*.jpg')
              if '-thumb.' not in p and '-blur.' not in p])
total = sum(os.path.getsize(p) for p in glob.glob('assets/img/posts/*/*'))

print('記事 %d / 本体 %d 枚・thumb %d 枚・blur %d 枚 / 画像合計 %.1fMB'
      % (len(posts), n_main, n_thumb, n_blur, total / 1048576))

for w in warns:
    print('  [WARN ] ' + w)
for e in errors:
    print('  [ERROR] ' + e)

if errors:
    print('--- 要対応 %d 件' % len(errors))
    sys.exit(1)
print('--- 問題なし（警告 %d 件）' % len(warns))
sys.exit(0)
