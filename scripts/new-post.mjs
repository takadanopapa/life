#!/usr/bin/env node
/**
 * new-post.mjs — 新しい記事の「枠」と画像配置を機械的に用意するヘルパー。
 *
 * 文章そのものは Claude が書きます。このスクリプトは下記の面倒な部分だけ担当:
 *   - _posts/YYYY-MM-DD-<slug>.md をフロントマター付きで生成
 *   - 画像を assets/img/posts/<date-slug>/ にコピー＆連番リネーム
 *   - フロントマターの hero / images に画像パスを自動で流し込む
 *
 * 使い方:
 *   node scripts/new-post.mjs \
 *     --title "高田馬場の○○で家族ランチ" \
 *     --slug "marubaba-lunch" \
 *     --category "ごはん" \
 *     --shop "○○食堂" \
 *     --location "東京都新宿区高田馬場" \
 *     --tags "高田馬場,ランチ,子連れ" \
 *     --date "2026-06-21" \
 *     --images "C:/path/photo1.jpg,C:/path/photo2.jpg"
 *
 * 生成後、Claude が本文（## 見出し以降）を埋めます。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function arg(name, def = "") {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const title = arg("title");
const slug = arg("slug");
const category = arg("category", "ごはん");
const shop = arg("shop", "");
const location = arg("location", "東京都新宿区");
const tags = arg("tags", "").split(",").map((s) => s.trim()).filter(Boolean);
const date = arg("date", new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
const time = arg("time", "12:00:00");
const imagesArg = arg("images", "");

if (!title || !slug) {
  console.error("ERROR: --title と --slug は必須です。");
  process.exit(1);
}

const dateSlug = `${date}-${slug}`;
const imgDir = path.join(ROOT, "assets", "img", "posts", dateSlug);
fs.mkdirSync(imgDir, { recursive: true });

// 画像コピー＆連番化
const webPaths = [];
const sources = imagesArg.split(",").map((s) => s.trim()).filter(Boolean);
sources.forEach((src, idx) => {
  if (!fs.existsSync(src)) {
    console.warn(`WARN: 画像が見つかりません: ${src}`);
    return;
  }
  const ext = path.extname(src).toLowerCase() || ".jpg";
  const fname = `${String(idx + 1).padStart(2, "0")}${ext}`;
  fs.copyFileSync(src, path.join(imgDir, fname));
  webPaths.push(`/assets/img/posts/${dateSlug}/${fname}`);
});

const hero = webPaths[0] || `/assets/img/posts/${dateSlug}/01.jpg`;
const imagesYaml = (webPaths.length ? webPaths : [hero])
  .map((p) => `  - ${p}`)
  .join("\n");
const tagsYaml = tags.length ? `[${tags.join(", ")}]` : "[]";

const front = `---
layout: post
title: ${JSON.stringify(title)}
date: ${date} ${time} +0900
category: ${category}
tags: ${tagsYaml}
location: ${location}
shop_name: ${shop}
hero: ${hero}
images:
${imagesYaml}
---

<!-- hero画像はレイアウト(_layouts/post.html)が front matter の hero から自動表示します -->
<!-- 本文ここから（Claudeが執筆） -->

## 行ってみた感想

（ここに感想本文）

<div class="photo-gallery">
  {% for img in page.images %}
  <img src="{{ img | relative_url }}" alt="写真">
  {% endfor %}
</div>

<div class="shop-info">
  <h3>お店情報</h3>
  <dl>
    <dt>店名</dt><dd>{{ page.shop_name }}</dd>
    <dt>場所</dt><dd>{{ page.location }}</dd>
    <dt>カテゴリ</dt><dd>{{ page.category }}</dd>
  </dl>
  <p style="font-size:.85em;color:#888;margin:0;">
    ※ 営業時間・定休日・価格などの最新情報は公式・各種グルメサイトでご確認ください。
  </p>
</div>
`;

const postPath = path.join(ROOT, "_posts", `${dateSlug}.md`);
fs.writeFileSync(postPath, front, "utf8");

console.log("✅ 記事枠を作成しました:");
console.log("   " + path.relative(ROOT, postPath));
console.log(`   画像 ${webPaths.length} 枚を配置: ${path.relative(ROOT, imgDir)}`);
