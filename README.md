# docs

Android アプリ「らじぽけ」の公開ドキュメント置き場です。

GitHub Pages で公開しています: https://radipocket.github.io/docs/

| ファイル | 公開URL |
|---|---|
| `privacy-policy.md` | https://radipocket.github.io/docs/privacy-policy.html |
| `roadmap.md` | https://radipocket.github.io/docs/roadmap.html |
| `changelog.md` | https://radipocket.github.io/docs/changelog.html |
| `manual.md` | https://radipocket.github.io/docs/manual.html |
| `manual-listen.md` | https://radipocket.github.io/docs/manual-listen.html |
| `manual-record.md` | https://radipocket.github.io/docs/manual-record.html |
| `manual-use.md` | https://radipocket.github.io/docs/manual-use.html |
| `manual-faq.md` | https://radipocket.github.io/docs/manual-faq.html |

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

## URL を変えないこと

アプリ（らじぽけ本体）は、この公開先の URL を `AppLinks` に持っています。ファイル名や
公開先を変えると**アプリを更新するまでリンク切れになります**。

このリポジトリを移管したときも同じことが起きました。GitHub はリポジトリ自体への
アクセスは転送しますが、**GitHub Pages の URL は転送しません**。移管前の Pages の
URL は 404 になります。
