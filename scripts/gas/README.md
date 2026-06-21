# GAS 橋渡しの設置手順（Gmail[BLOG] → Drive）

メールに添付した写真と本文を、Google ドライブの `BabaBlog-Inbox/` に自動保存する
Google Apps Script の設置手順です。設置後は「写真添付メールを送るだけ」で運用できます。

## 0. 実行アカウント: nozawa@beyonds.ai（決定）

GAS は **nozawa@beyonds.ai** で作成します（方式B）。Gmail・Drive コネクタと同じ
アカウントなので、フォルダ共有などの追加設定は不要です。
[BLOG] メールも **nozawa@beyonds.ai 宛**に送ってください。

## 1. Gmail にラベルを用意（nozawa@beyonds.ai）
Gmail で `blog` というラベルを作成（スクリプトが自動作成もしますが、振り分け用に手動が便利）。

おすすめ: Gmail のフィルタで「件名に [BLOG] を含む」→ ラベル `blog` を自動付与。
これで送るときにラベルを意識しなくて済みます。

## 2. Apps Script プロジェクトを作る
1. 上記で決めたアカウントで [script.google.com](https://script.google.com) を開く。
2. 「新しいプロジェクト」を作成。
3. `Code.gs`（このフォルダの中身）を丸ごと貼り付けて保存。
4. プロジェクト名は「BabaBlog Bridge」などに。

## 3. 権限を承認して動作確認
1. 関数選択で `processBlogEmails` を選び ▶ 実行。
2. 初回は Gmail / Drive へのアクセス承認を求められるので許可。
3. テスト用に、自分宛に件名 `[BLOG] テスト店` で写真添付メールを送ってから実行 →
   Drive に `BabaBlog-Inbox/<日付>_テスト店/` ができ、`memo.txt`・`meta.json`・画像が入っていればOK。

## 4. 自動実行をオンにする
関数選択で `installTrigger` を選び ▶ 実行。
→ 15分おきに `processBlogEmails` が自動で回ります（頻度は `installTrigger` 内で変更可）。

## メールの書き方（運用）

```
宛先: 自分（上で決めたアカウント）
件名: [BLOG] 店名
本文:
カテゴリ: ごはん          ← ごはん / 子育て / 旅
場所: 高田馬場
メモ: 金曜の夜に家族4人で。タンとカルビが旨かった。子連れOK。
（写真は添付するだけ）
```

- `[BLOG]` がフィルタ／検索の目印。
- 本文の `カテゴリ` `場所` `メモ` は任意だが、あると記事の精度が上がる。

## 保存されるもの（後段Claudeが読む形）

```
BabaBlog-Inbox/
└─ 2026-06-21_馬場焼肉ホルモン/
   ├─ memo.txt        # 人間用：件名・日時・本文
   ├─ meta.json       # 機械用：shop_hint, body, date_iso, status:"pending" ...
   ├─ 01.jpg          # 添付写真
   └─ 02.jpg
```

後段は `status:"pending"`（= `published.txt` がまだ無い）フォルダだけを処理し、
公開後にそのフォルダへ `published.txt` を置いて二重投稿を防ぎます。
