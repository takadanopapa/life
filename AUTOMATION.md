# 自動化パイプライン設計（メール＋GAS橋渡し方式）

「写真添付メールを送る → 記事を自動生成 → GitHub Pages に自動公開」を
1日1回まとめて実行するための設計と、毎日 Claude が実行する手順書。

**採用方式: メール＋GAS橋渡し**（理想のUX＝メール添付を維持しつつ完全自動化）

---

## 全体フロー

```
[スマホ] お店で写真を撮る
        │
        ▼  ① 件名 [BLOG] 店名 ＋ 本文（カテゴリ/場所/メモ）＋ 写真添付 でメール送信
[Gmail]  ラベル「blog」（フィルタで自動付与推奨）
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
宛先: nozawa@beyonds.ai
件名: [BLOG] 馬場焼肉ホルモン
本文:
カテゴリ: ごはん          ← ごはん / 子育て / 旅
場所: 高田馬場
メモ: 金曜の夜に家族4人で。タンとカルビが旨かった。子連れOK。
（写真は添付するだけ）
```

- `[BLOG]` が目印（フィルタでラベル `blog` 自動付与を推奨）。
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
   3. `WRITING_GUIDE.md` を読み、Web検索で店情報を裏取り（不確かなら書かない）。
   4. `node scripts/new-post.mjs --title ... --slug ... --category ... --shop ... --images "<一時パス,...>"` で枠＋画像を作成。
   5. 生成された `_posts/*.md` の本文をペルソナで執筆・上書き。
4. `git add -A && git commit -m "post: <店名> (<日付>)" && git push`
5. 公開できたフォルダに `published.txt`（公開URL等を記載）を作成（二重投稿防止）。

> 「完全自動で即公開」設定のため人手の承認は挟まない。
> ただし WRITING_GUIDE の「事実の扱い」を厳守し、不確かな情報は書かないこと。

---

## スケジュール設定

アカウントの揃え方と GitHub 認証が決まったら、`/schedule` で
「毎朝○時にこの手順を実行」を登録する。
