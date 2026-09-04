# docs

Android アプリ「らじぽけ」の公開ドキュメント置き場です。

GitHub Pages で公開しています: https://radipocket.github.io/docs/

| ファイル | 公開URL |
|---|---|
| `privacy-policy.md` | https://radipocket.github.io/docs/privacy-policy.html |
| `roadmap.md` | https://radipocket.github.io/docs/roadmap.html |
| `changelog.md` | https://radipocket.github.io/docs/changelog.html |
| `manual.html` | https://radipocket.github.io/docs/manual.html |
| `manual-listen.md` | https://radipocket.github.io/docs/manual-listen.html （案内だけ） |
| `manual-record.md` | https://radipocket.github.io/docs/manual-record.html （案内だけ） |
| `manual-use.md` | https://radipocket.github.io/docs/manual-use.html （案内だけ） |
| `manual-faq.md` | https://radipocket.github.io/docs/manual-faq.html （案内だけ） |

## 使い方のページ

使い方は **`manual.html` の1ページ**にまとまっています。他のページと骨格が違うので、
専用のものを持っています。

| 置き場 | 何か |
|---|---|
| `manual.html` | 本文。**Markdown ではなく HTML**（表・動画・アコーディオンを組むため） |
| `_layouts/manual.html` | 左に目次・右に本文の骨格。目次は**本文の見出しから組み立てる** |
| `manual/manual.css` | 使い方ページだけの見た目 |
| `manual/manual.js` | 目次の組み立て・現在地・ページ内検索。**サーバーは使わない** |
| `manual/img/` | 画面写真（webp・幅540） |
| `manual/video/` | 操作の動画（mp4・音声なし・`<video autoplay muted loop playsinline>`） |

`manual-listen` / `manual-record` / `manual-use` / `manual-faq` は、
**昔の URL を切らさないための案内ページ**です。中身は `manual.html` の見出しへ送るだけで、
本文は持っていません。

見出しを増やすと目次にも自動で載ります。**見出しには `id` を手で付けてください**
（プランの札を含む見出しがあるため、自動生成に任せると id がぶれます）。

## 更新のしかた

`main` に push すると GitHub Pages が自動で再ビルドします。反映まで1〜2分かかります。
**main への直接 push はせず、ブランチを切って PR を出すこと。**

`_config.yml` は Pages（Jekyll）の設定です。テーマは GitHub Pages が標準で用意している
ものしか使えません。

## ページを増やすとき

1. `<名前>.md` を置く。**先頭に front matter が要る**（これが無いと Markdown が
   そのまま出て、見出しもテーマも効かない）。

   ```
   ---
   title: ページの見出し
   ---
   ```

2. `index.md` の一覧に1行足す。
3. 上の表に1行足す。
4. アプリからも開くなら、本体リポジトリの `AppLinks` に URL を足す。

## changelog を書くたびに roadmap.md も見る（2026-08-28 に追加）

`roadmap.md` の「開発中」「開発予定」が実態とズレる事故が起きた（有料プラン・ブックマークが
完成後も「開発中」に残り、大画面対応は公開済みにすら載っていなかった）。**changelog.md に
1行足すたびに、次のどちらかに当てはまらないか roadmap.md も確認する。**

| changelog に書いた内容 | roadmap.md でやること |
|---|---|
| 「開発中」「開発予定」にある項目が完成した | その項目を「公開済み」へ移す |
| 「公開済み」のどこにも無い新しい機能を追加した | 「公開済み」に1行足す |

**新しい仕組み（CI チェック等）は作らない。** changelog を書く手を止める、その回数だけ
roadmap を見る機会にする——既にある習慣に乗せるほうが続く。

「開発予定」に残す項目は、**実現の見込みが薄いまま放置しない。** 着手のめどが立たず、
費用や新しいインフラの投資が要る項目は、外すか理由を添えて残すかを都度判断する
（2026-08-28 に「AI による番組の要約」「録音内容の全文検索」を除外。着手ゼロで実現時期を
示せないものを載せ続けると、利用者を期待させたまま実現しないことになる。「CM の自動
スキップ」は頭出し機能の無音検出基盤が既にあり、実運用での精度確認待ちのため残した）。

## URL を変えないこと

アプリ（らじぽけ本体）は、この公開先の URL を `AppLinks` に持っています。ファイル名や
公開先を変えると**アプリを更新するまでリンク切れになります**。

このリポジトリを移管したときも同じことが起きました。GitHub はリポジトリ自体への
アクセスは転送しますが、**GitHub Pages の URL は転送しません**。移管前の Pages の
URL は 404 になります。
