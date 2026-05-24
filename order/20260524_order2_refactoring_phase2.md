# 作業指示書：20260524_order2_refactoring_phase2(v0.5.04)
## 役割
あなたは優秀なフロントエンドエンジニアです。
提供したソースコードに対し、以下の「リファクタリング作業・第二段階」を行ってください。

## 目的
次フェーズで行う「物理法則の完全統合（Newtonian Symmetry）」に向けた事前準備として、`main.js` 内における自機（player）と敵機（enemies）のデータ構造をES6のクラスベースにリファクタリングする。
**【絶対原則】ゲームの見た目、操作感、敵の思考ロジック、機能は一切変更しないこと（完全互換の維持）。**

## 実装ステップと要件

### 1. 基底クラス `Ship` の定義
現状、プレーンなオブジェクト（連想配列形式）として扱われている `player` と `entities.enemies` の共通プロパティを集約するため、`main.js` 内に基底クラス `Ship` を定義してください。
- **内包する共通プロパティの例:** `x`, `y`, `vx`, `vy`, `bodyAngle`, `hp`, `maxHp`, `heat`, `isOverheated`, `overheatTimer`, `flashTimer`, `trailHistory` など。

### 2. 派生クラス `PlayerShip` と `EnemyShip` の定義
`Ship` クラスを継承し、それぞれ固有の初期化を行う派生クラスを定義してください。
- **`PlayerShip`:**
  `turretAngle`, `missileCooldown`, `boostGauge`, `boostActiveTimer`, `boostCooldownTimer`, `isLandingSequence` など、自機特有のプロパティをコンストラクタで初期化、または管理できるようにします。
- **`EnemyShip`:**
  `personality`, `spdMult`, `turnMult`, `attackMult`, `fireTimer`, `nextShootInterval`, `aimOffset`, `aimOffsetTimer`, `offsetX`, `offsetY`, `dogfightTimer`, `isLaunching`, `launchTimer` など、敵機特有のプロパティをコンストラクタで適切に受け取り初期化します。

### 3. インスタンス生成・初期化処理の置き換え
- `resetGame()` 内などで行われているグローバル変数 `player` の初期化・プロパティリセット処理を、`new PlayerShip(...)` によるインスタンス生成（またはクラス準拠の初期化メソッド）に置き換えてください。
- 敵母艦からのエネミースポーン処理における `entities.enemies.push({ ... })` のプレーンオブジェクトの追加を、`new EnemyShip(...)` によるインスタンス追加に置き換えてください。

## 完了・検証条件
- クラス化による「データの器（構造）」の変更のみを行うこと。`update()` や `draw()` 内に直書きされている物理計算ロジック、AIの思考ロジック、描画ロジック自体は一切書き換えないでください（メソッドへのロジック切り出しもこのフェーズでは行いません）。既存のコードが `player.x` や `e.vx` といったドット記法でそのままプロパティにアクセスし、正常に機能することを最優先にしてください。
- リファクタリング前と全く同じ操作感、挙動、ゲームバランスでプレイ・ミッション進行ができること。