# 馬場ログ セットアップ手順書（非エンジニア向け・全部入り）

作成日：2026年6月21日 ／ 参照：各手順末尾の公式ドキュメント

> このブログは2段階で進めます。
> **フェーズ1**＝まずブログをインターネットに公開する（ブラウザ操作だけ・コード不要・トークン不要）。
> **フェーズ2**＝メール→自動記事化の「自動運転」をオンにする（GAS設置＋GitHub認証。Claudeと一緒に進める）。
>
> まずはフェーズ1で「自分のブログが世界に公開される」達成感を取りに行きましょう。

---

# フェーズ1：ブログを公開する（あなたの作業・約20分）

## STEP 1. GitHub アカウントを作る

GitHub（ギットハブ）は、ブログの置き場所＆無料の公開サーバーです。

1. ブラウザで **https://github.com/** を開く。
2. 右上の **「Sign up」（サインアップ）** をクリック。
3. 画面の案内に従って、メールアドレス・パスワード・**ユーザー名**を入力。
   - ⚠️ **ユーザー名がブログのURLの一部になります**（例: `goemonama` なら `https://goemonama.github.io/...`）。覚えやすいものに。
4. 届いたメールで**メール認証**を完了する。
   - 公式注記：メール認証をしないと、リポジトリ作成などの基本操作ができません。
5. 案内に沿って**2段階認証（2FA）**を設定する（スマホの認証アプリ等）。GitHubのオンボーディングで推奨・必要になります。

> 📌 ここで一度ストップ。**決めた「ユーザー名」を私（Claude）に教えてください。**
> ブログ設定ファイル（`_config.yml`）のURL部分を、私が正しく書き換えてから次に進むと、再アップロードの手間が省けます。

📖 出典 🟢📅最新（一次情報）：
- [Creating an account on GitHub - GitHub Docs](https://docs.github.com/en/get-started/start-your-journey/creating-an-account-on-github)
- [Getting started with your GitHub account - GitHub Docs](https://docs.github.com/en/get-started/onboarding/getting-started-with-your-github-account)

---

## STEP 2. リポジトリ（保管箱）を作る

「リポジトリ」＝ブログのファイル一式を入れる箱です。

1. 画面右上の **「＋」** をクリック →**「New repository」（新しいリポジトリ）** を選ぶ。
2. **Repository name（リポジトリ名）** に、**`takadanobaba-blog`** と入力。
   - ⚠️ この名前で設定ファイルを用意済みなので、**この名前を強く推奨**します（変える場合は私に教えてください。設定を直します）。
3. **Public（公開）** を選ぶ。
   - 公式注記：GitHub Pages（無料公開）は、無料プランでは**公開リポジトリ**で使えます。
4. 「Add a README file」などのチェックは**付けないまま**でOK（空の箱を作る）。
5. **「Create repository」** をクリック。

📖 出典 🟢📅最新（一次情報）：
- [Creating a new repository - GitHub Docs](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)
- [About GitHub Pages の提供条件（Quickstart）](https://docs.github.com/en/pages/quickstart)

---

## STEP 3. ブログのファイルをアップロードする（ドラッグ&ドロップ）

パソコンの中のブログ一式を、作った箱にそのまま放り込みます。

1. 作ったリポジトリのページで、**「Add file」→「Upload files」** をクリック。
2. パソコンで、ブログのフォルダを開く：
   `C:\Users\goemo\OneDrive\デスクトップ\Claude Test\takadanobaba-blog`
3. ⚠️ **重要**：このフォルダ**ごと**ではなく、**中身を全部**選んで入れます。
   - フォルダを開いた状態で **Ctrl + A**（全選択）→ そのままGitHubの画面へ**ドラッグ&ドロップ**。
   - こうすると `_config.yml` などが箱の**一番上（ルート）**に入ります。フォルダごと入れると階層がずれて表示が崩れるので注意。
   - サブフォルダ（`_posts`, `assets`, `scripts`）は階層を保ったまま一緒に上がります。
4. 下の **「Commit changes」** ボタンを押す（メッセージは初期のままでOK）。

> 公式の制限：ブラウザからは**1ファイル25MiBまで／一度に100ファイルまで**。今回の写真サンプルは軽いので問題ありません。

📖 出典 🟢📅最新（一次情報）：
- [Adding a file to a repository - GitHub Docs](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
- [Uploading a project to GitHub - GitHub Docs](https://docs.github.com/en/get-started/start-your-journey/uploading-a-project-to-github)

---

## STEP 4. GitHub Pages をオンにして公開する

これで「ただのファイル置き場」が「Webサイト」になります。

1. リポジトリの上部メニューで **「Settings」（設定）** をクリック。
2. 左メニューの **「Pages」** をクリック。
3. **「Build and deployment」→「Source」** で **「Deploy from a branch」** を選ぶ。
4. **Branch（ブランチ）** のドロップダウンで **`main`**、フォルダは **`/ (root)`** を選び、**Save**。
5. 数分待つと、同じPagesの画面の上部に **公開URL** が表示されます。
   - URLの形：`https://<あなたのユーザー名>.github.io/takadanobaba-blog/`
   - クリックして、サンプルの焼肉記事が表示されたら**公開成功**です🎉

> 反映には初回数分かかることがあります。すぐ出なくても少し待って再読み込みを。

📖 出典 🟢📅最新（一次情報）：
- [Quickstart for GitHub Pages - GitHub Docs](https://docs.github.com/en/pages/quickstart)
- [Configuring a publishing source for your GitHub Pages site - GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

---

# フェーズ2：自動運転をオンにする（Claudeと一緒に）

ここからは「メールを送るだけで記事が自動で増える」仕組みです。
GAS設置はあなたの作業、GitHubへの自動投稿の認証はClaudeと一緒に設定します。

## STEP 5. GAS（メール→Drive 自動保存）を設置する

写真添付メールを、Googleドライブへ自動で運ぶ小さな仕組みです。**nozawa@beyonds.ai** で行います。

1. **nozawa@beyonds.ai でログインした状態**で **https://script.google.com/** を開く。
2. **「新しいプロジェクト」** を作成。
3. このフォルダの **`scripts/gas/Code.gs`** の中身を全部コピーして、エディタに貼り付け、保存（💾）。
4. 上部の関数選択で **`processBlogEmails`** を選び、**「実行（▶ Run）」**。
5. 初回は権限の確認が出ます → **「権限を確認」→ アカウント選択 → 「許可」**。
   - 公式の流れ：初回実行時に「Review permissions」が出るので、アカウントを選び「Allow」。
6. テスト：自分宛に件名 **`[BLOG] テスト店`** で写真添付メールを送り、もう一度 `processBlogEmails` を実行。
   → Googleドライブに `BabaBlog-Inbox/日付_テスト店/` ができ、写真と `memo.txt` が入っていれば成功。
7. 自動化ON：関数選択で **`installTrigger`** を選び ▶ 実行。
   → 15分おきに自動でメールをチェックするようになります（時間主導トリガー）。

📖 出典 🟢📅最新（一次情報）：
- [Authorization for Google Services - Apps Script](https://developers.google.com/apps-script/guides/services/authorization)
- [Installable Triggers - Apps Script](https://developers.google.com/apps-script/guides/triggers/installable)
- [Apps Script エディタ（script.google.com/create）](https://developers.google.com/apps-script/guides/services/authorization)

## STEP 6. GitHubへの自動投稿の認証（Claudeと一緒に）

毎朝Claudeが記事を自動で公開するには、あなたのGitHubに書き込む「鍵」が必要です。
非エンジニアでも安全に進められるよう、設定はClaudeと画面を見ながら一緒にやります。方法は2通り：

- **方法A（おすすめ・トークン不要）**：パソコンのGit（インストール済み）で初回だけブラウザ認証する方式。Claudeが`git push`を実行→ブラウザでGitHubにログイン許可するだけ。
- **方法B（fine-grained トークン）**：GitHubで「特定のリポジトリだけ・書き込み権限だけ」の鍵を発行してClaudeに渡す。
  - 場所：右上アイコン→**Settings**→左下**Developer settings**→**Personal access tokens → Fine-grained tokens**→**Generate new token**。
  - ⚠️ **トークンはパスワード同然**。有効期限を設定し、対象は `takadanobaba-blog` のみ、権限は **Contents: Read and write** に絞るのが安全。

> どちらにするかは、フェーズ1が終わってからClaudeと相談して決めましょう。

📖 出典 🟢📅最新（一次情報）：
- [Managing your personal access tokens - GitHub Docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

## STEP 7. 毎朝の自動実行を登録（Claudeが実施）

フェーズ2の認証まで終わったら、Claudeが `/schedule` で「毎朝○時に Drive を見て記事化・公開」を登録します。これで完成です。

---

# 自信度・鮮度サマリ

| 項目 | 自信度 | 鮮度 | 種別 |
|---|---|---|---|
| GitHubアカウント作成手順 | 🟢 | 📅最新 | 一次（docs.github.com） |
| リポジトリ作成手順 | 🟢 | 📅最新 | 一次 |
| ブラウザでのファイルアップロード（25MiB/100件制限含む） | 🟢 | 📅最新 | 一次 |
| GitHub Pages 有効化（Deploy from a branch） | 🟢 | 📅最新 | 一次 |
| fine-grained トークン作成場所・推奨 | 🟢 | 📅最新 | 一次 |
| Apps Script 実行・権限承認 | 🟢 | 📅最新 | 一次 |
| Apps Script 時間主導トリガー | 🟢 | 📅最新 | 一次 |
| 公開URLが反映されるまでの所要時間（数分） | 🟡 | 📅最新 | 一次（環境差あり） |
| 2FAが必須かどうかの厳密な条件 | 🟡 | 📅最新 | 一次（オンボーディングで推奨/要求。条件は変動しうる） |

> 注：GitHub / Google の管理画面のボタン名や配置は、予告なく小幅に変わることがあります。
> 文言が少し違っても、上記の「やること」自体は変わりません。迷ったら画面を私に伝えてください。
