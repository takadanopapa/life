---
layout: page
title: お問い合わせ
permalink: /contact/
---

当サイトへのご質問・ご感想・掲載に関するご連絡などは、以下のフォームよりお気軽にお寄せください。内容を確認のうえ、必要に応じて折り返しご連絡いたします。

<form class="contact-form" action="https://formspree.io/f/mlgyrqrq" method="POST">
  <label>
    お名前
    <input type="text" name="name" required>
  </label>
  <label>
    メールアドレス
    <input type="email" name="email" required>
  </label>
  <label>
    お問い合わせ内容
    <textarea name="message" rows="6" required></textarea>
  </label>
  <!-- 件名（受信メールのタイトル） -->
  <input type="hidden" name="_subject" value="【たかだのパパの日常blog】お問い合わせ">
  <!-- 迷惑メール対策（人間には見えない。ボットが入力すると弾かれる） -->
  <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">
  <button type="submit">送信する</button>
</form>

<p style="font-size:.85em;color:#888;">
  ※ いただいた個人情報は、お問い合わせへの対応のみに使用します。詳しくは<a href="{{ '/privacy/' | relative_url }}">プライバシーポリシー</a>をご覧ください。
</p>
