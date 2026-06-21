---
layout: post
title: "【サンプル】高田馬場で家族焼肉、子連れでも気楽でした"
date: 2026-06-21 19:30:00 +0900
category: ごはん
tags: [高田馬場, 焼肉, 子連れ]
location: 東京都新宿区高田馬場
shop_name: （サンプル）馬場焼肉ホルモン
hero: /assets/img/posts/2026-06-21-sample/placeholder.svg
images:
  - /assets/img/posts/2026-06-21-sample/placeholder.svg
---

<div class="post-hero">
  <img src="{{ page.hero | relative_url }}" alt="{{ page.shop_name }}">
</div>

金曜の夜、子どもたちが「お肉食べたい！」と騒ぎ出したので、高田馬場駅から歩いてすぐの焼肉屋さんへ。
（※これは仕組みの動作確認用サンプル記事です。実際にはメールで送った店名と写真をもとに、ここが自動で書かれます。）

## 行ってみた感想

カウンターとテーブルの両方があって、子連れでもテーブル席に通してもらえて一安心。
タン塩から始めて、カルビ、ハラミ……と王道の流れ。下の子はお肉よりもごはんとスープに夢中でした。

<div class="photo-gallery">
  {% for img in page.images %}
  <img src="{{ img | relative_url }}" alt="料理の写真">
  {% endfor %}
</div>

煙はそこそこ出るので、においが気になる日は避けたほうがいいかも。でも味と価格のバランスはよくて、また来ようと思える一軒でした。

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
