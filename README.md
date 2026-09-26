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
| `articles/index.md` | https://radipocket.github.io/docs/articles/ （記事の一覧） |
| `articles/record-radio-android.md` | https://radipocket.github.io/docs/articles/record-radio-android.html |
| `articles/catch-up-radio.md` | https://radipocket.github.io/docs/articles/catch-up-radio.html |
| `sitemap.xml` | https://radipocket.github.io/docs/sitemap.xml （検索エンジン向けの一覧） |

## 開発用のメモ（公開しません）

`dev/` は `_config.yml` の `exclude` に入れてあり、**GitHub Pages には出ません。**
このリポジトリを開いた人だけが読むものです。

| ファイル | 何か |
|---|---|
| `dev/bigquery-coupon-queries.md` | クーポン分析の SQL（BigQuery）。イベント名・パラメータは本体の実装から写したもの |

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

## SNS の投稿用の画像（posts/img/）

X・Threads の自動投稿（本体の `scripts/marketing/`）で使う画像の置き場。
**Threads の API は画像のファイルを受け取らず、公開された URL を読みに来る**ので、ここで公開している
（`https://radipocket.github.io/docs/posts/img/<名前>.jpg`）。

- **サイトのどのページからもリンクしない。** `sitemap.xml` は .html のページだけを載せるので、ここは載らない
- 中身の決まり: 開発用の表示・試験のデータ・テスト広告・他社の番組表（放送予定）を写さない。写っていれば切る
- JPEG（Threads が受け付ける形式）。元の置き場は OneDrive の `マーケ\投稿\img\`（同じファイル）

## 紹介動画（_data/videos.yml・RP-068）

YouTube（@kuronekofukuyahonpo）に上げた紹介動画を、**押すまで YouTube を読み込まない形**で出す。

- 動画の一覧は `_data/videos.yml` の1か所だけ。枠（long・teaser_h・teaser_v・short01〜10）ごとに題・id・形・サムネイル
- ページには `{% raw %}{% include video.html key="long" %}{% endraw %}` と書く。**id が空の枠は何も出ない**（公開の予約中・未公開の動画は id を空のままにする）
- 最初はこのサイトの `videos/img/<枠>.jpg`（完パケ_v3 のサムネイルを縮めたもの）と再生の印だけ。押したら `youtube-nocookie.com` の埋め込みに差し替える（`_includes/head-custom.html` の小さなスクリプト）
- いま置いている場所: トップ（long）・「聴き逃したラジオ番組を、あとから聴くには」（short01）・「Android でラジオ番組を録音する方法」（short03）
- **新しく公開されたら**: チャンネルの公開の RSS（`https://www.youtube.com/feeds/videos.xml?channel_id=UCVvXm39QMWwSx1ZFV5MDZ6w`）で公開済みか確かめ、その枠の id を入れる（予約中の動画は RSS に出ない）

## 記事を足すとき（articles/）

1. `articles/_template.md` を `articles/<英小文字とハイフンの名前>.md` に写して書く。
   **`_` で始まるひな形は公開されない。** 書き方の決まり（他社名・日数・非公式の注記・
   Play へのリンクの utm）は、ひな形の中に書いてある。
2. 画面の写真は `articles/img/` に webp で置き、Markdown で `{: .shot}` を付ける。
   テスト広告や開発用の表示が写っていないものを使う。
3. 一覧（`articles/index.md`）と `sitemap.xml` は**自動で組み立てる**ので、直さなくてよい。
   構造化データ（`_includes/structured-data.html`）も front matter の `schema` から出る。
4. 上の表に1行足す。

`sitemap.xml` に載せたくないページは、front matter に `sitemap: false` を書く。

## 冒頭の「最終更新日」は配信日に合わせる（2026-09-07 に追加）

`changelog.md` の冒頭にある **最終更新日は、いちばん新しい「配信したバージョン」の
ブロックの日付**にそろえる。ファイルを触った日ではない。

**見出しが「（配信予定）」のブロックに1行足しただけでは動かさない。** あれはまだ誰の端末にも届いて
いない変更で、そこに合わせて日付を進めると、利用者から見て「更新されたのに自分の
アプリには何も無い」ことになる。**公開されて見出しを「（YYYY/M/D配信）」に替えた回に、その配信日へ進める。**
（2026-09-26: 見出しの書き方を「次回配信予定」の欄から「Ver x.y.z 始め-終わり（配信予定）」に改めた。）

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
