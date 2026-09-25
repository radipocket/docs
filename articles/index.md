---
title: 記事
description: ラジオ番組の録音や、聴き逃した番組をあとから聴く方法など、ラジオをもっと便利に聴くための記事をまとめています。
schema: SoftwareApplication
date_modified: "2026-09-25"
---

# 記事

ラジオ番組の録音や、聴き逃した番組をあとから聴く方法など、ラジオを便利に聴くための記事をまとめています。

{%- comment -%}
  一覧は articles/ の中の Markdown から組み立てる（新しい順）。記事を足すときにここを直す必要はない。
  並べるのは schema: Article のページだけ。このページ自身や、ひな形（_template.md・公開されない）は出ない。
{%- endcomment -%}
{% assign articles = site.pages | where: "schema", "Article" | sort: "date_published" | reverse %}
{% for a in articles %}
## [{{ a.title }}]({{ a.url | relative_url }})

<p class="article-meta">{{ a.date_published | date: "%Y年%-m月%-d日" }}</p>

{{ a.description }}
{% endfor %}

---

らじぽけは、ラジオ番組を録音して、あとから好きなときに聴ける Android アプリです。基本的な機能は無料で使えます。

[らじぽけを Google Play で見る](https://play.google.com/store/apps/details?id=ca.radipocket&referrer=utm_source%3Dsite%26utm_medium%3Darticle%26utm_campaign%3Darticles_index)

<p class="article-note">らじぽけは個人が開発している非公式のアプリで、放送局や配信サービスの各社とは関係ありません。</p>
