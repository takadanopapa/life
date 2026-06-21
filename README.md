# 馬場ログ — 高田馬場ライフログ自動ブログ

高田馬場在住・アラフォー・子ども二人のおやじが、ごはん／子育て／旅の毎日を
[Claude Code](https://claude.com/claude-code) で自動更新する GitHub Pages ブログです。

「お店で写真を撮って店名を送る → 記事が自動生成されて公開される」を目指しています。

## 構成

```
takadanobaba-blog/
├─ _config.yml              # サイト設定（公開前に url/baseurl を要編集）
├─ index.md / about.md      # トップ・自己紹介
├─ _posts/                  # 記事（YYYY-MM-DD-slug.md）
├─ assets/
│  ├─ css/style.scss        # 見た目の調整（ギャラリー等）
│  └─ img/posts/<日付-slug>/ # 記事ごとの写真
├─ scripts/new-post.mjs     # 記事枠＋画像配置のヘルパー（node）
├─ WRITING_GUIDE.md         # 記事のペルソナ・文体ルール
├─ AUTOMATION.md            # 自動化パイプラインの設計と手順
└─ README.md
```

## セットアップ（一度だけ）

### 1. GitHub リポジトリを作る
GitHub で新規リポジトリ（例 `takadanobaba-blog`）を作成。

### 2. `_config.yml` を編集
`url` と `baseurl` を自分のものに書き換える。
- ユーザーページ（`USERNAME.github.io` リポジトリ）: `baseurl: ""`
- プロジェクトページ（`takadanobaba-blog` リポジトリ）: `baseurl: "/takadanobaba-blog"`

### 3. push する
```bash
cd takadanobaba-blog
git init
git add -A
git commit -m "init: 馬場ログ"
git branch -M main
git remote add origin https://github.com/USERNAME/takadanobaba-blog.git
git push -u origin main
```
※ HTTPS push では Personal Access Token（PAT）の入力が必要です。

### 4. GitHub Pages を有効化
リポジトリの Settings → Pages → Source を「Deploy from a branch」、
ブランチ `main` / `/ (root)` に設定。数分で公開されます。

## ローカルプレビュー（任意・Rubyが必要）

```bash
bundle install
bundle exec jekyll serve
```
※ Ruby 未インストールでも、GitHub 上では問題なくビルドされます。

## 新しい記事を手動で追加する

```bash
node scripts/new-post.mjs --title "タイトル" --slug "shop-name" \
  --category "ごはん" --shop "店名" --location "高田馬場" \
  --tags "高田馬場,ランチ,子連れ" --images "C:/photos/a.jpg,C:/photos/b.jpg"
```
枠が生成されるので、本文を書いて commit & push。

## 自動更新について

メール起点の自動投稿パイプラインの設計は [AUTOMATION.md](AUTOMATION.md) を参照。
着手前に「写真の経路」「投稿用アカウント」「GitHub認証」の3点を決める必要があります。
