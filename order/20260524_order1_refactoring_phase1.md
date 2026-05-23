# 作業指示書：20260524_order1_refactoring_phase1(v0.5.02)

## 目的
次フェーズで行う「物理法則の完全統合（Newtonian Symmetry）」に向けた事前準備として、自機（player）と敵機（enemies）のデータ構造をES6のクラスベースにリファクタリングする。
**【絶対原則】ゲームの見た目、操作感、敵の思考ロジック、機能は一切変更しないこと（完全互換の維持）。**

## 実装ステップと要件

### 1. 基底クラス `Ship` の定義
現状、プレーンなオブジェクトとして宣言されている `player` と `entities.enemies` について、共通の基底クラス `Ship` を定義する。
- **対象となる共通プロパティの例:** `x`, `y`, `vx`, `vy`, `bodyAngle`, `hp`, `maxHp`, `heat`, `isOverheated`, `overheatTimer`, `flashTimer`, `trailHistory` など。

### 2. 派生クラス `PlayerShip` と `EnemyShip` の定義
`Ship` クラスを継承し、それぞれ固有の初期化を行う派生クラスを定義する。
- **`PlayerShip`:**
  `turretAngle`, `missileCooldown`, `boosterCooldown`, `isLandingSequence` など、自機特有のプロパティをコンストラクタで初期化する。
- **`EnemyShip`:**
  `personality`, `spdMult`, `turnMult`, `fireTimer`, `isLaunching`, `targetX` など、敵機特有のプロパティをコンストラクタで初期化する。

### 3. インスタンス生成処理の置き換え
- `resetGame()` 等での `player` オブジェクトの初期化を `new PlayerShip(...)` に置き換える。
- 母艦からの敵スポーン処理における `entities.enemies.push({...})` を `new EnemyShip(...)` に置き換える。

## 完了・検証条件
- クラス化による「データの器」の変更のみを行うこと。`update()` 内の物理計算ロジック、AIの思考ロジック、描画ロジック自体は一切書き換えないこと（メソッドへの切り出しもこのフェーズでは行わない）。
- ゲームを実行した際、リファクタリング前と全く同じ挙動でプレイ・進行できること。
