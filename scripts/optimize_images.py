#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
たかだのパパの日常blog 画像最適化スクリプト

スマホ撮影の原寸JPEG（長辺3000px超・1枚3〜7MB）がそのまま置かれていると、
記事一覧で数十枚を一斉に読み込んで表示が終わらなくなる。
1枚の写真から Web 配信用に3種類そろえて、その状態を防ぐ。

  NN.jpg        長辺 1600px / quality 82 / progressive … 記事本文・hero 用（原本を上書き）
  NN-thumb.jpg  長辺  640px / quality 78 / progressive … 一覧カードのサムネイル
  NN-blur.jpg   長辺   32px / quality 50               … CSSでぼかす背景（LQIP）

冪等。すでに最適化済み（長辺<=1600px かつ 350KB以下）の原本は再圧縮せず、
足りない -thumb / -blur だけを作る。--force で全部やり直す。

使い方（リポジトリのどこから実行してもよい）:
  python scripts/optimize_images.py                     # assets/img/posts 配下すべて
  python scripts/optimize_images.py <ディレクトリ|ファイル> ...   # 一部だけ（自動投稿から呼ぶ用）
  python scripts/optimize_images.py --force             # 再圧縮を強制
"""

import os
import sys
import tempfile

from PIL import Image, ImageOps

# ---- 設定 ---------------------------------------------------------------
MAX_LONG = 1600      # 原本の長辺上限（記事内で最大表示されるサイズに対して十分）
MAX_QUALITY = 82
SKIP_BYTES = 350 * 1024   # 長辺が収まっていて、かつこのサイズ以下なら原本はいじらない

THUMB_LONG = 640     # 一覧カード（高さ220px・contain）用。Retinaでも足りる
THUMB_QUALITY = 78

BLUR_LONG = 32       # CSSで blur(16〜30px) をかける背景専用。1枚1KB前後
BLUR_QUALITY = 50

TARGET_EXT = ('.jpg', '.jpeg')   # 中身がPNGでも拡張子.jpgならJPEGとして書き直す
DERIVED_MARKS = ('-thumb.', '-blur.')
# ------------------------------------------------------------------------


def repo_root():
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def is_target(path):
    name = os.path.basename(path).lower()
    if not name.endswith(TARGET_EXT):
        return False
    return not any(m in name for m in DERIVED_MARKS)


def collect(paths):
    out = []
    for p in paths:
        if os.path.isfile(p):
            if is_target(p):
                out.append(p)
        elif os.path.isdir(p):
            for root, _dirs, files in os.walk(p):
                for f in files:
                    fp = os.path.join(root, f)
                    if is_target(fp):
                        out.append(fp)
        else:
            print('  [skip] 見つかりません: %s' % p)
    return sorted(set(out))


def derived_path(src, mark):
    stem, _ext = os.path.splitext(src)
    return stem + mark + '.jpg'


def save_jpeg(im, dest, quality, progressive=True):
    """同じフォルダの一時ファイルに書いてから置き換える（書き込み途中の壊れたファイルを残さない）"""
    d = os.path.dirname(dest) or '.'
    os.makedirs(d, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=d, suffix='.tmp.jpg')
    os.close(fd)
    try:
        im.save(tmp, 'JPEG', quality=quality, optimize=True,
                progressive=progressive, subsampling=2)
        os.replace(tmp, dest)   # Windowsでも上書きできる
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)


def fit_long(im, long_px):
    w, h = im.size
    if max(w, h) <= long_px:
        return im
    if w >= h:
        nw, nh = long_px, max(1, round(h * long_px / w))
    else:
        nh, nw = long_px, max(1, round(w * long_px / h))
    return im.resize((nw, nh), Image.LANCZOS)


def load_normalized(path):
    """EXIFの回転を実ピクセルに反映し、JPEGで保存できるモードに正す"""
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)
    if im.mode not in ('RGB', 'L'):
        if im.mode in ('RGBA', 'LA', 'P'):
            im = im.convert('RGBA')
            bg = Image.new('RGB', im.size, (255, 255, 255))
            bg.paste(im, mask=im.split()[-1])
            im = bg
        else:
            im = im.convert('RGB')
    return im


def process(src, force=False):
    before = os.path.getsize(src)
    thumb = derived_path(src, '-thumb')
    blur = derived_path(src, '-blur')

    im = load_normalized(src)
    orig_size = im.size

    need_main = force or max(orig_size) > MAX_LONG or before > SKIP_BYTES
    need_thumb = force or not os.path.exists(thumb)
    need_blur = force or not os.path.exists(blur)

    if not (need_main or need_thumb or need_blur):
        im.close()
        return None

    if need_main:
        save_jpeg(fit_long(im, MAX_LONG), src, MAX_QUALITY)
    if need_thumb:
        save_jpeg(fit_long(im, THUMB_LONG), thumb, THUMB_QUALITY)
    if need_blur:
        save_jpeg(fit_long(im, BLUR_LONG), blur, BLUR_QUALITY, progressive=False)
    im.close()

    after = os.path.getsize(src) + os.path.getsize(thumb) + os.path.getsize(blur)
    return {
        'src': src,
        'orig_size': orig_size,
        'before': before,
        'after_main': os.path.getsize(src),
        'after_total': after,
    }


def main(argv):
    force = '--force' in argv
    args = [a for a in argv if not a.startswith('--')]

    root = repo_root()
    if not args:
        args = [os.path.join(root, 'assets', 'img', 'posts')]

    targets = collect(args)
    if not targets:
        print('対象の画像がありません。')
        return 0

    print('対象 %d 枚 / 長辺%dpx・q%d に統一（--force: %s）'
          % (len(targets), MAX_LONG, MAX_QUALITY, force))

    done = skipped = 0
    sum_before = sum_after = 0
    for i, p in enumerate(targets, 1):
        rel = os.path.relpath(p, root).replace(os.sep, '/')
        try:
            r = process(p, force=force)
        except Exception as e:                      # 1枚壊れていても全体は止めない
            print('  [ERROR] %s : %s' % (rel, e))
            continue
        if r is None:
            skipped += 1
            continue
        done += 1
        sum_before += r['before']
        sum_after += r['after_total']
        print('  [%3d/%3d] %s  %dx%d %.1fMB -> 本体 %.0fKB (+thumb+blur 計 %.0fKB)'
              % (i, len(targets), rel, r['orig_size'][0], r['orig_size'][1],
                 r['before'] / 1048576, r['after_main'] / 1024, r['after_total'] / 1024))

    print('---')
    print('最適化 %d 枚 / スキップ %d 枚' % (done, skipped))
    if done:
        print('合計 %.1fMB -> %.1fMB（%.1f%% 削減）'
              % (sum_before / 1048576, sum_after / 1048576,
                 (1 - sum_after / sum_before) * 100))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
