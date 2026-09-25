---
# 記事のひな形。**ファイル名が _ で始まるので、公開されない**（Jekyll が読み飛ばす）。
# 新しい記事は、このファイルを articles/<英小文字とハイフンの名前>.md に写して書く。
# 公開 URL は https://radipocket.github.io/docs/articles/<名前>.html になる。
#
# title       … 検索結果とタブに出る題。困りごとの言葉で書く（例「〜するには」「〜する方法」）
# description … 検索結果の説明文。120字くらいまで。何が分かる記事かを1〜2文で
# og_type     … article のまま（SNS に貼ったときの種類）
# schema      … Article のまま（構造化データ。_includes/structured-data.html が読む）
#               記事の一覧（articles/index.md）も、これを見て自動で並べる
# date_published / date_modified … 公開日・更新日。**必ず "" で囲む**（囲まないと日付型になり、
#               構造化データの書式が崩れる）。直したら date_modified だけ進める
# image       … SNS 用の画像を記事ごとに変えるときだけ（1200x675）。無ければ全体の既定
title: 〜するには
description: 〜する方法をまとめました。〜と、〜を紹介します。
og_type: article
schema: Article
date_published: "2026-01-01"
date_modified: "2026-01-01"
---

# 〜するには

<p class="article-meta">公開: 2026年1月1日 ・ {{ site.developer.name }}</p>

<!--
書き方の決まり
- 検索した人の困りごとに答える。らじぽけは「解決策の一つ」として後半で紹介し、売り込みすぎない
- 他社のサービス名は事実の説明にとどめ、公式と誤解させない。末尾に非公式である旨を書く（下の article-note）
- 法律上の可否は言い切らない（「私的に楽しむ範囲でご利用ください」まで）
- 具体的な日数・まだ無い機能は書かない
- 画面の写真は articles/img/ に置き、{: .shot} を付ける。テスト広告や開発用の表示が写っていないものを使う
- Play へのリンクは、下の形の utm_campaign を記事ごとの名前（英小文字と _）に変える
  （Play Console の「獲得レポート」で、どの記事から入ったかを見るため）
-->

（前置き: 読み手の困りごとを1〜2段落で）

## 方法1

## 方法2

## らじぽけで〜する

![画面の説明](img/xxx.webp){: .shot}

[らじぽけを Google Play で見る](https://play.google.com/store/apps/details?id=ca.radipocket&referrer=utm_source%3Dsite%26utm_medium%3Darticle%26utm_campaign%3D記事の名前)

## まとめ

---

<p class="article-note">らじぽけは個人が開発している非公式のアプリで、放送局や配信サービスの各社とは関係ありません。番組・放送局に関する権利は、それぞれの権利者に帰属します。</p>

[記事の一覧へ](./)
