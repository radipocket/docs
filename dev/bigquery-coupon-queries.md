# クーポン分析の SQL（BigQuery）

**これは開発用のメモです。公開しません**（`_config.yml` の `exclude` に入れてあります）。

作成日: 2026-09-13 ／ 対象の実装: 本体 `798e4b2`（versionCode 532）

---

## まず読むこと

### **どのクエリも動作確認していません**

書いた時点で **BigQuery のテーブルがまだ存在しません。** エクスポートを有効にしたのが
2026-09-13 で、**データセットが作られるのは翌日以降**だからです。

したがって、ここにあるものは **Firebase の標準エクスポート形式を前提に机上で書いたもの**です。
**実データが入ったら直す前提で読んでください。** 特に次は実物を見るまで分かりません。

- データセット名（下の「置き換えるところ」）
- 値の分布（NULL がどれだけ出るか、想定外の値が混ざっていないか）
- テーブルのサイズと、クエリの費用

**イベント名・パラメータ名・値の語彙だけは推測していません。** すべて本体のコード
（`app/src/main/java/ca/radipocket/analytics/`）から写しました。

### 置き換えるところ

```
`radipocket.analytics_<プロパティID>.events_*`
         ~~~~~~~~~~~~~~~~~~~~~~~~
```

- **プロジェクトID は `radipocket`**（`app/src/release/google-services.json` で確認済み）
- **`<プロパティID>` は分かりません。** Firebase コンソール → プロジェクトの設定 → 統合 →
  BigQuery か、BigQuery のエクスプローラで `analytics_` で始まるデータセットを見ると分かります。
  **Firebase のプロジェクト番号（659194062040）ではありません** — GA4 のプロパティIDです

### エクスポートの設定（2026-09-13 に有効化）

| | |
|---|---|
| リージョン | **asia-northeast1（東京）** |
| 頻度 | **毎日**（ストリーミングは無効） |
| 広告IDを含める | オフ |
| Crashlytics / Performance / Cloud Messaging | いずれもオフ |
| データの開始 | **2026-09-13 から。それ以前は入りません（遡及不可）** |

**クエリは asia-northeast1 で実行してください。** BigQuery はリージョンをまたいだ結合が
できません。

毎日エクスポートなので、テーブルは `events_YYYYMMDD` だけで、`events_intraday_*` は
できません。それでも各クエリで

```sql
AND REGEXP_CONTAINS(_TABLE_SUFFIX, r'^\d{8}$')
```

を付けてあります。**`events_*` のワイルドカードは `events_intraday_*` にも当たる**ので、
あとでストリーミングを有効にした瞬間に**全部が二重に数えられる**からです。いま効かない
1行ですが、効くようになったときに気づけません。

---

## 実装で使っている名前（コードから写したもの）

### イベント

| イベント名 | パラメータ |
|---|---|
| `coupon_redeem` | `result` ／ `plan` ・ `duration` ・ `campaign`（**成功のときだけ**） |
| `coupon_ended` | `reason` ・ `plan` ・ `duration` ・ `campaign` |
| `recording_saved` | `source` |
| `chapter_used` / `bookmark_added` / `bookmark_used` / `bookmark_noted` / `alarm_set` / `plan_opened` / `purchase_opened` / `purchase_manage_opened` | なし |
| `alarm_fired` | `result` |
| `widget_added` | `kind` |
| `purchase_started` / `purchase_completed` | `plan` |
| `purchase_failed` | `reason` |

### 値の語彙

| パラメータ | 値 |
|---|---|
| `coupon_redeem.result` | `success` / `unknown` / `revoked` / `already_used` / `unavailable` |
| `coupon_ended.reason` | `expired` / `stopped` / `grace_expired` / `backstop` / `revoked` |
| `plan` | `standard` / `premium` |
| `duration` | `day1` / `day3` / `week1` / `month1` / `month6` / `unlimited` |
| `campaign` | `closed_test` / `reserved` / `other`（今後 `note_202609a` のような経路名が増えます） |
| `recording_saved.source` | `manual` / `auto` |
| `alarm_fired.result` | `radio` / `fallback` |
| `widget_added.kind` | `play` / `stations` / `recordings` |
| `purchase_failed.reason` | `cancelled` / `unavailable` / `no_product` / `already_owned` / `billing_error` / `other` |

### ユーザープロパティ

| 名前 | 値 | 付く条件 |
|---|---|---|
| `coupon_campaign` | `closed_test` / `reserved` / `other` … | **初めてクーポンを使ったときに1回だけ。上書きしません** |
| `coupon_active` | `yes` / `no` | いまクーポンでプランが有効か。**変わるたびに書き直します** |

**パラメータもユーザープロパティも、すべて文字列で送っています**
（`FirebaseAnalyticsSink` が `putString`）。BigQuery では `value.string_value` にだけ入り、
`int_value` は常に NULL です。数値として扱いたいときは `SAFE_CAST` してください。

### いつから付いているか

| | 実装 | 利用者に届いた版 |
|---|---|---|
| Firebase Analytics | versionCode 276 | **280（2026-08-21・最初の公開）** |
| `coupon_campaign` | versionCode 367 | **2026-08-28 の配信** |
| `coupon_ended` ／ `coupon_active` | versionCode 532 | **未配信（2026-09-13 時点）** |

**`coupon_ended` と `coupon_active` は、532 が配信されるまで1件も入りません。**
クエリ2・4は、それまで空を返します。

**2026-08-28 より前にクーポンを使った端末には `coupon_campaign` が付いていません。**
あとから付け直す仕組みはありません（`rememberCampaignOnce` が初回しか通らない）。
クローズドテストの参加者はここに該当する可能性があります。

---

## 共通の注意

### `user_pseudo_id` は端末ごと・入れ直しで変わる

Firebase の集計単位はアプリインスタンスIDです。**同じ人が入れ直すと別人**として数えられ、
**同じ人の2台目も別**です。以下のクエリで「人」と書いているのは、正確には「端末（アプリ
インスタンス）」です。

### **`purchase_completed` の意味は versionCode 533 で変わります**

**532 までは購入の回数ではありません。** コードを読んで分かった、集計に直接効く落とし穴です。

| 版 | `purchase_completed` が意味するもの |
|---|---|
| **〜532** | **有料プランを持っている人がアプリを前面に出した回数。** `applyPurchases()` が `MainActivity.onResume()` のたびに走り、そこで無条件に送っていたため |
| **533〜** | **新規の購入が成立した回数。** 承認前（`isAcknowledged` が false）の購入を初めて見たときだけ1件（本体 PR #308） |

**2026-09-13 から 533 が行き渡るまでの間、BigQuery には両方が混ざります。** 消せません。

#### 混ざったぶんの分け方

**`app_info.version` にアプリのバージョン名が入ります。** らじぽけの versionName は
`Ver 1.4.0 532` の形（`app/build.gradle.kts` の `displayVersionName`。`aapt2 dump badging` でも
`versionName='Ver 1.4.0 532'` を確認済み）なので、**末尾の数字が versionCode** です。

```sql
-- purchase_completed を、送った版で分ける
SELECT
  SAFE_CAST(REGEXP_EXTRACT(app_info.version, r'(\d+)$') AS INT64) AS version_code,
  app_info.version,
  COUNT(*)                       AS events,
  COUNT(DISTINCT user_pseudo_id) AS devices
FROM `radipocket.analytics_<プロパティID>.events_*`
WHERE REGEXP_CONTAINS(_TABLE_SUFFIX, r'^\d{8}$')
  AND _TABLE_SUFFIX >= '20260913'
  AND event_name = 'purchase_completed'
GROUP BY version_code, app_info.version
ORDER BY version_code
```

**`app_info.version` に versionName が入ることは、実データで確かめていません**（テーブルが
まだ無いため）。**最初にこのクエリを流して確かめてください。** 期待どおりでなければ、
`platform` や `app_info` の他の列を見ることになります。

**533 以降に絞るなら**、各クエリの `WHERE` に次を足します。

```sql
AND SAFE_CAST(REGEXP_EXTRACT(app_info.version, r'(\d+)$') AS INT64) >= 533
```

#### **版をまたいで数えられる読み方はありません**

数え方を変えれば揃う、という話ではありません。**数えている対象そのものが違います。**

| | 〜532 | 533〜 |
|---|---|---|
| `COUNT(*)` | 有料の人が前面に出した回数 | **新規の購入の回数** |
| `COUNT(DISTINCT user_pseudo_id)` | **期間中に有料プランを持っていた端末数** | **期間中に新しく買った端末数** |

**533 以降、「いま何人が有料か」は `purchase_completed` からは出せません。** 前からの契約者は
イベントを出さなくなるからです。**その数字は Play Console で見てください** ——
分析のイベントで代用しようとすると、また同じ間違いをします。

逆に **533 以降は「期間中に買った端末数」が素直に出ます。** 532 まではそれが出せませんでした。

「購入の手続きを始めた回数」を見たいなら `purchase_started` です（購入ボタンを押したとき1回）。
**こちらは 532 以前から同じ意味**で、`onResume` を通りません。失敗したぶんも含みます。
**版をまたいで比べられるのは、いまのところこれだけです。**

---

## 1. `coupon_redeem` の成功／失敗（campaign × plan × duration）

**何を見るためのものか:** どの配布経路のコードが、どの種類で、どれだけ通ったか／弾かれたか。
配ったコードが実際に使われているかを確かめる、いちばん基本の集計です。

```sql
-- クーポンの使用結果を、経路・プラン・期間ごとに数える
SELECT
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'result')   AS result,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'campaign') AS campaign,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'plan')     AS plan,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'duration') AS duration,
  COUNT(*)                       AS events,
  COUNT(DISTINCT user_pseudo_id) AS devices,
  MIN(event_date)                AS first_date,
  MAX(event_date)                AS last_date
FROM `radipocket.analytics_<プロパティID>.events_*`
WHERE REGEXP_CONTAINS(_TABLE_SUFFIX, r'^\d{8}$')
  AND _TABLE_SUFFIX >= '20260913'
  AND event_name = 'coupon_redeem'
GROUP BY result, campaign, plan, duration
ORDER BY result, campaign, plan, duration
```

**失敗の行は `campaign` / `plan` / `duration` が NULL になります。不具合ではありません。**
通らなかったコードは中身を読めていないので、書けば嘘になるから送っていません
（`CouponEvent` にその旨が書いてあります）。

失敗の内訳だけを見たいときは:

```sql
SELECT
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'result') AS result,
  COUNT(*) AS events, COUNT(DISTINCT user_pseudo_id) AS devices
FROM `radipocket.analytics_<プロパティID>.events_*`
WHERE REGEXP_CONTAINS(_TABLE_SUFFIX, r'^\d{8}$')
  AND _TABLE_SUFFIX >= '20260913'
  AND event_name = 'coupon_redeem'
GROUP BY result
ORDER BY events DESC
```

`unknown` が多ければ打ち間違いか偽造、`already_used` が多ければ同じコードを配りすぎ、
という読み方になります。

---

## 2. `coupon_ended` を理由別に

**何を見るためのものか:** 配ったクーポンがどう終わったか。**期間を使い切ったのか、
こちらが止めたのか、通信できなくて切れたのか**を分けて数えます。

```sql
-- クーポンの終わり方を、理由・経路・種類ごとに数える
SELECT
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'reason')   AS reason,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'campaign') AS campaign,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'plan')     AS plan,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'duration') AS duration,
  COUNT(DISTINCT user_pseudo_id) AS devices,
  COUNT(*)                       AS events
FROM `radipocket.analytics_<プロパティID>.events_*`
WHERE REGEXP_CONTAINS(_TABLE_SUFFIX, r'^\d{8}$')
  AND _TABLE_SUFFIX >= '20260913'
  AND event_name = 'coupon_ended'
GROUP BY reason, campaign, plan, duration
ORDER BY devices DESC
```

理由の読み方:

| `reason` | 意味 | 多いときに考えること |
|---|---|---|
| `expired` | 期間を使い切った | **いちばん普通の終わり方。** これが多いのは健全 |
| `stopped` | `campaigns.json` の `active` を 0 にした | こちらが止めた数。意図と合っているか |
| `grace_expired` | 遠隔フラグを7日ぶん確認できなかった | **こちらは止めていない。** 通信できない利用者が切られている |
| `backstop` | バックストップ期限を過ぎた | 止め忘れ。フラグでの停止が間に合っていない |
| `revoked` | 無効化の一覧に入れた | 流出への対処が効いた数 |

**`events` が `devices` より多い行があれば、二度打ちを疑ってください。**
1本のクーポンにつき終わりは1回だけ数える作りですが、**遠隔フラグを 0 → 1 → 0 と
動かすと、意図どおり2回出ます**（別々の「終わり」なので）。

### 補足: 使い始めと終わりの突き合わせ

「配った N 本のうち、何本が期間の終わりまで使われたか」を出すなら、1 と 2 を
**同じ軸（`campaign` × `plan` × `duration`）で並べます。**

```sql
WITH base AS (
  SELECT
    event_name,
    user_pseudo_id,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'result')   AS result,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'reason')   AS reason,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'campaign') AS campaign,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'plan')     AS plan,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'duration') AS duration
  FROM `radipocket.analytics_<プロパティID>.events_*`
  WHERE REGEXP_CONTAINS(_TABLE_SUFFIX, r'^\d{8}$')
    AND _TABLE_SUFFIX >= '20260913'
    AND event_name IN ('coupon_redeem', 'coupon_ended')
)
SELECT
  campaign, plan, duration,
  COUNT(DISTINCT IF(event_name = 'coupon_redeem' AND result = 'success', user_pseudo_id, NULL)) AS started,
  COUNT(DISTINCT IF(event_name = 'coupon_ended',                          user_pseudo_id, NULL)) AS ended,
  COUNT(DISTINCT IF(event_name = 'coupon_ended' AND reason = 'expired',    user_pseudo_id, NULL)) AS ended_by_expiry
FROM base
WHERE campaign IS NOT NULL
GROUP BY campaign, plan, duration
ORDER BY started DESC
```

**`started` と `ended` は同じ期間では釣り合いません。** 使い始めてから終わるまでに最長で
6ヶ月かかる（無期限なら終わらない）ので、**終わりは必ず遅れて出ます。**

---

## 3. クーポンを使い始めた人の継続率

**何を見るためのものか:** クーポンを配った人が、そのあとアプリを使い続けているか。
配布が「入口」として働いているのか、1回触って終わりなのかを見ます。

```sql
-- クーポンを使った日を 0 日目として、n 日目に何台が動いていたか
WITH redeemed AS (
  SELECT
    user_pseudo_id,
    MIN(PARSE_DATE('%Y%m%d', event_date)) AS start_date,
    ARRAY_AGG(
      (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'campaign')
      ORDER BY event_timestamp LIMIT 1
    )[OFFSET(0)] AS campaign
  FROM `radipocket.analytics_<プロパティID>.events_*`
  WHERE REGEXP_CONTAINS(_TABLE_SUFFIX, r'^\d{8}$')
    AND _TABLE_SUFFIX >= '20260913'
    AND event_name = 'coupon_redeem'
    AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'result') = 'success'
  GROUP BY user_pseudo_id
),
activity AS (
  SELECT DISTINCT user_pseudo_id, PARSE_DATE('%Y%m%d', event_date) AS active_date
  FROM `radipocket.analytics_<プロパティID>.events_*`
  WHERE REGEXP_CONTAINS(_TABLE_SUFFIX, r'^\d{8}$')
    AND _TABLE_SUFFIX >= '20260913'
),
joined AS (
  SELECT
    r.campaign,
    r.user_pseudo_id,
    DATE_DIFF(a.active_date, r.start_date, DAY) AS day_offset
  FROM redeemed r
  JOIN activity a USING (user_pseudo_id)
  WHERE a.active_date >= r.start_date
)
SELECT
  campaign,
  COUNT(DISTINCT user_pseudo_id) AS cohort,
  COUNT(DISTINCT IF(day_offset >= 1,  user_pseudo_id, NULL)) AS day1_plus,
  COUNT(DISTINCT IF(day_offset >= 3,  user_pseudo_id, NULL)) AS day3_plus,
  COUNT(DISTINCT IF(day_offset >= 7,  user_pseudo_id, NULL)) AS day7_plus,
  COUNT(DISTINCT IF(day_offset >= 14, user_pseudo_id, NULL)) AS day14_plus,
  COUNT(DISTINCT IF(day_offset >= 30, user_pseudo_id, NULL)) AS day30_plus
FROM joined
GROUP BY campaign
ORDER BY cohort DESC
```

**読むときの注意。**

- **観測できる日数が足りていないと、単に日が経っていないだけで低く出ます。** 2026-09-13 に
  データが始まったばかりなので、`day30_plus` が意味を持つのは 2026-10-13 以降です。
  期間を絞るなら `redeemed` に `AND start_date <= DATE_SUB(CURRENT_DATE('Asia/Tokyo'), INTERVAL 30 DAY)` を足します
- **入れ直すと `user_pseudo_id` が変わる**ので、入れ直した人は「離脱」に見えます
- クーポンを使った日を 0 日目としています。**インストール日ではありません**

---

## 4. `coupon_active` / `coupon_campaign` 別の機能の使われ方

**何を見るためのものか:** クーポンでプランが有効な人と、そうでない人とで、機能の使われ方が
どう違うか。**有料の機能が実際に使われているのか**を確かめます。

```sql
-- 区分ごとに、主要な機能のイベント数を比べる
SELECT
  (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'coupon_active')   AS coupon_active,
  (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'coupon_campaign') AS coupon_campaign,
  event_name,
  COUNT(*)                       AS events,
  COUNT(DISTINCT user_pseudo_id) AS devices,
  ROUND(SAFE_DIVIDE(COUNT(*), COUNT(DISTINCT user_pseudo_id)), 2) AS events_per_device
FROM `radipocket.analytics_<プロパティID>.events_*`
WHERE REGEXP_CONTAINS(_TABLE_SUFFIX, r'^\d{8}$')
  AND _TABLE_SUFFIX >= '20260913'
  AND event_name IN (
    'recording_saved', 'chapter_used',
    'bookmark_added', 'bookmark_used', 'bookmark_noted',
    'alarm_set', 'alarm_fired', 'widget_added', 'plan_opened'
  )
GROUP BY coupon_active, coupon_campaign, event_name
ORDER BY event_name, coupon_campaign, coupon_active
```

**必ず `events_per_device` で比べてください。** 区分ごとに母数がまるで違うので、`events` の
大小には意味がありません。

**ユーザープロパティは「そのイベントを送った時点の値」が入ります。** だから
`coupon_active = 'yes'` の行は「クーポンが有効だった間の使われ方」、`'no'` の行は
「終わったあと（または使っていない人）の使われ方」になります。**同じ端末が両方の行に
出ます。** それが狙いです。

3つの状態は2つのプロパティの組で読みます。

| `coupon_campaign` | `coupon_active` | どういう人か |
|---|---|---|
| 値がある | `yes` | いまクーポンで使っている |
| 値がある | `no` | 使っていたが、終わった |
| NULL | `no` | クーポンを使ったことが無い |
| NULL | NULL | **532 より前の版**（プロパティがまだ無い） |

---

## 5. クーポン経由かどうかで `purchase_completed` を比べる

**何を見るためのものか:** クーポンを配ることが、有料プランの加入につながっているか。
配布を続けるかどうかの判断材料です。

```sql
-- 端末ごとに「クーポン経由か」「有料プランを持っていたか」を出してから比べる
WITH per_device AS (
  SELECT
    user_pseudo_id,
    MAX(IF((SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'coupon_campaign') IS NOT NULL, 1, 0)) AS via_coupon,
    MAX(IF(event_name = 'purchase_completed', 1, 0)) AS had_paid_plan,
    MAX(IF(event_name = 'purchase_started',   1, 0)) AS tried_to_buy,
    MAX(IF(event_name = 'purchase_opened',    1, 0)) AS opened_purchase
  FROM `radipocket.analytics_<プロパティID>.events_*`
  WHERE REGEXP_CONTAINS(_TABLE_SUFFIX, r'^\d{8}$')
    AND _TABLE_SUFFIX >= '20260913'
  GROUP BY user_pseudo_id
)
SELECT
  IF(via_coupon = 1, 'クーポン経由', 'それ以外') AS segment,
  COUNT(*)              AS devices,
  SUM(opened_purchase)  AS opened_purchase_devices,
  SUM(tried_to_buy)     AS tried_to_buy_devices,
  SUM(had_paid_plan)    AS had_paid_plan_devices,
  ROUND(SAFE_DIVIDE(SUM(had_paid_plan), COUNT(*)), 4) AS paid_rate,
  ROUND(SAFE_DIVIDE(SUM(had_paid_plan), NULLIF(SUM(tried_to_buy), 0)), 4) AS conversion_from_try
FROM per_device
GROUP BY segment
ORDER BY segment
```

経路ごとに割りたいときは `via_coupon` の代わりに、端末ごとの `coupon_campaign` の値
（`MAX(...)` で1つに畳む）でグループ化します。

**この5番は、いちばん慎重に読む必要があります。**

1. **`had_paid_plan` は「期間中に有料プランを持っていた端末」であって、「期間中に買った端末」
   ではありません。** 532 までは `purchase_completed` が前面に戻るたびに出ますし、533 以降でも
   **前から加入している人はそもそもイベントを出さなくなる**ので、どちらの版でも
   「買った端末」にはなりません。**533 以降で「期間中に買った端末」を数えたいなら、
   `purchase_completed` の件数をそのまま使えます**（1件＝1つの新規購入）
2. **`coupon_campaign` が NULL でも「クーポンを使ったことが無い」とは限りません。**
   2026-08-28 より前に使った端末には付いていません
3. **クーポンでプランが有効な間は、買う理由がありません。** クーポンが切れたあとに買うか
   どうかが知りたいので、`coupon_ended` が出た端末に絞ったほうが実態に近くなります

3 を踏まえた形:

```sql
WITH per_device AS (
  SELECT
    user_pseudo_id,
    MAX(IF(event_name = 'coupon_ended', 1, 0)) AS coupon_ended,
    MIN(IF(event_name = 'coupon_ended', event_timestamp, NULL)) AS ended_at,
    MAX(IF((SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'coupon_campaign') IS NOT NULL, 1, 0)) AS via_coupon
  FROM `radipocket.analytics_<プロパティID>.events_*`
  WHERE REGEXP_CONTAINS(_TABLE_SUFFIX, r'^\d{8}$')
    AND _TABLE_SUFFIX >= '20260913'
  GROUP BY user_pseudo_id
),
bought_after AS (
  SELECT DISTINCT e.user_pseudo_id
  FROM `radipocket.analytics_<プロパティID>.events_*` e
  JOIN per_device d USING (user_pseudo_id)
  WHERE REGEXP_CONTAINS(e._TABLE_SUFFIX, r'^\d{8}$')
    AND e._TABLE_SUFFIX >= '20260913'
    AND e.event_name = 'purchase_started'
    AND d.ended_at IS NOT NULL
    AND e.event_timestamp > d.ended_at
)
SELECT
  COUNT(*) AS coupon_ended_devices,
  COUNT(DISTINCT b.user_pseudo_id) AS started_purchase_after_end,
  ROUND(SAFE_DIVIDE(COUNT(DISTINCT b.user_pseudo_id), COUNT(*)), 4) AS rate
FROM per_device d
LEFT JOIN bought_after b USING (user_pseudo_id)
WHERE d.coupon_ended = 1
```

**`coupon_ended` は 532 が配信されるまで1件も入らない**ので、こちらが動くのは配信後です。

---

## やらないこと

**個別のクーポンコードを特定するクエリは書けません。** コードも id も連番も送っていません
（`CouponEvent` に理由が書いてあります。連番が分かれば配布表と突き合わせて1本を特定でき、
それは特定の人を追うことになるため）。**分かるのは経路・プラン・期間までです。**

---

## データが入ったら確かめること

1. データセット名を確かめて、この文書の `<プロパティID>` を実際の値に置き換える
2. クエリ1を流して、**`result` の値が5種類に収まっているか**を見る。想定外の値があれば実装とずれている
3. クエリ4を流して、**`coupon_active` が NULL の行がどれだけあるか**を見る。532 が行き渡るまでは NULL が多いのが正常
4. クエリ5の `had_paid_plan_devices` と、Play Console の実際の加入者数を突き合わせる。
   **大きくずれていたら、上の「532 までは購入の回数ではない」が効いています**
5. **`app_info.version` に versionName（`Ver 1.4.0 532` の形）が入るか**を確かめる。
   入っていれば、修正前後を版で切り分けられる
6. 533 が行き渡ったあと、**定期購入の更新で `purchase_completed` が出ていないか**を見る。
   更新のたびに承認を求められないという理解で作ってあるが、**実際の課金でしか確かめられない**。
   加入者数より多く出ていたら、更新も数えている
