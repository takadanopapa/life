# 自動化パイプライン設計（メール＋GAS橋渡し方式）

「写真添付メールを送る → 記事を自動生成 → GitHub Pages に自動公開」を
1日1回まとめて実行するための設計と、毎日 Claude が実行する手順書。

**採用方式: メール＋GAS橋渡し**（理想のUX＝メール添付を維持しつつ完全自動化）

---

## 全体フロー

```
[スマホ] お店で写真を撮る
        │
        ▼  ① 件名に店名、本文（カテゴリ/場所/メモ）＋ 写真添付 でメール送信
[Gmail]  （ラベル・合言葉不要。goemonama@gmail.com → TO nozawa@beyonds.ai の全メールが対象）
        │
        ▼  ② GAS が15分おきに添付＋本文を Drive へ保存（scripts/gas/Code.gs）
[Google ドライブ] BabaBlog-Inbox/<日付>_<店名>/  ← memo.txt, meta.json, 画像
        │
        ▼  ③ 1日1回、スケジュール実行された Claude が処理
[Claude Code]
   ├─ status:"pending" のフォルダ（published.txt が無い）を検出
   ├─ meta.json から店名・カテゴリ・メモを取得、画像を download_file_content で取得
   ├─ Web検索で店情報を裏取り（WRITING_GUIDE のルール厳守）
   ├─ ペルソナで本文を生成
   ├─ scripts/new-post.mjs で記事枠＋画像を配置、本文を書き込み
   ├─ git commit & push
   └─ 該当 Drive フォルダに published.txt を置く（二重投稿防止）
        │
        ▼  ④ GitHub Pages が自動ビルド・公開
[ブログ公開] https://USERNAME.github.io/...
```

ポイント: **後段の Claude は Gmail を一切触らず、Drive フォルダだけを読む。**
（現在の Gmail ツールは添付DL不可のため、写真取得は Drive 経由に一本化。）

---

## 実行アカウント: beyonds.ai（決定）

GAS・Gmail・Drive すべて **nozawa@beyonds.ai** で統一（方式B）。
- [BLOG] メールの送信先 = **nozawa@beyonds.ai**
- GAS も beyonds.ai の script.google.com で作成
- Drive コネクタと同一アカウントなので**共有設定は不要**

## ⚠️ 残りのセットアップ1点

### GitHub への push 認証
`gh` CLI は無い。git はある。Personal Access Token (PAT) を使った HTTPS push が手軽。

---

## メールの書き方（運用ルール）

```
差出人: goemonama@gmail.com
宛先(TO): nozawa@beyonds.ai
件名: 馬場焼肉ホルモン     ← 原則「店名だけ」。合言葉は不要
本文:
カテゴリ: ごはん          ← ごはん / 子育て / 旅
場所: 高田馬場
メモ: 金曜の夜に家族4人で。タンとカルビが旨かった。子連れOK。
（写真は添付するだけ）
```

- **判定は差出人＋宛先**。`goemonama@gmail.com` から `nozawa@beyonds.ai` 宛（TO）なら、件名に関係なく全件が対象
  （`Code.gs` の `FROM_ADDRESS` / `TO_ADDRESS` で変更可）。
- **件名は原則「店名だけ」**。日付が混ざっても自動で切り離して訪問日として使う（`7/22 てけてけ` などOK）。
- ブログにしたくないメールは、件名に `非公開` / `skip` / `スキップ` / `ブログ不要` を入れると対象外（`SKIP_WORDS`）。
- `カテゴリ` `場所` `メモ` は任意。あると記事の精度が上がる。

---

## Drive 保存フォーマット（GAS出力 → Claude入力）

```
BabaBlog-Inbox/
└─ 2026-06-21_馬場焼肉ホルモン/
   ├─ memo.txt        # 件名・日時・本文
   ├─ meta.json       # { shop_hint, body, date_iso, status:"pending", ... }
   ├─ 01.jpg
   └─ 02.jpg
```

---

## 毎日の実行手順（スケジュール実行された Claude 用）

1. Drive で `BabaBlog-Inbox/` 配下の各フォルダを `search_files` で列挙。
2. `published.txt` が **無い**フォルダ（= 未公開）だけを対象にする。
3. 各フォルダについて：
   1. `meta.json` を読み、店名(`shop_hint`)・カテゴリ・場所・メモを取得。
   2. 画像を `download_file_content` で取得し、ローカルの一時パスに保存。
      - 復元は `node scripts/decode-drive-file.mjs <driveJson> <出力先>`。
        このスクリプトが復元直後に `scripts/optimize_images.py` を呼び、
        **長辺1600pxの本体＋`-thumb.jpg`(640px)＋`-blur.jpg`(32px)** の3枚をそろえる。
      - スマホ原寸（長辺3000px超・1枚3〜7MB）をそのまま置くと、記事一覧が
        表示されなくなる（2026-08-03 に実際に発生）。`WARN: 画像最適化に失敗` が出たら
        `python scripts/optimize_images.py <画像フォルダ>` を手で実行してから先へ進む。
      - push 前に `python scripts/verify_images.py` を実行して、
        hero に対応する `-thumb` / `-blur` が欠けていないことを確認する。
   3. `WRITING_GUIDE.md` を読み、Web検索で店情報を裏取り（不確かなら書かない）。
   4. `node scripts/new-post.mjs --title ... --slug ... --category ... --shop ... --images "<一時パス,...>"` で枠＋画像を作成。
   5. 生成された `_posts/*.md` の本文をペルソナで執筆・上書き。
   6. **アフィリエイト（もしも経由・楽天／積極）** ※WRITING_GUIDE「アフィリエイトの入れ方」に従う。
      - 対象は**全カテゴリ**（子育て/旅/ごはん）。本文に明確な言及が無くても**テーマから関連商品を推測**可。無関係は不可。
      - 物販（楽天市場）：`search` → `link`（本文）／`shelf`（記事末）。
      - 宿（旅カテゴリ・楽天トラベル）：`hotel-search` → `hotel-link`（本文）／`hotel-shelf`（記事末）。
      - 本文挿入は言及段落直後/まとめ前、棚は記事末。旅は宿＋旅行グッズの混在可。
      - **本文＋末棚の合計は最大3個**（max_per_article）。`affiliate: true` を付与。
      - 検索0件 / 生成失敗 の分はスキップ。両方作れなければ通常投稿（`affiliate:true`も付けない）。
4. `git add -A && git commit -m "post: <店名> (<日付>)" && git push`
5. 公開できたフォルダに `published.txt`（公開URL等を記載）を作成（二重投稿防止）。

> 「完全自動で即公開」設定のため人手の承認は挟まない。
> ただし WRITING_GUIDE の「事実の扱い」を厳守し、不確かな情報は書かないこと。

---

## スケジュール設定

アカウントの揃え方と GitHub 認証が決まったら、`/schedule` で
「毎朝○時にこの手順を実行」を登録する。
