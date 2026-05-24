# 作業指示書：RENDERING_SIMPLE_WITH_SPRITES
## 役割
あなたは優秀なフロントエンドエンジニアです。  
提供したソースコードに対し、以下の「描画フェーズの軽量リファクタリング＋弾・ミサイルのスプライト化」を行ってください。

## 目的
main.js に肥大化している描画処理（Rendering）のうち、  
**ゲームロジックと無関係な純粋描画部分のみ** を utils に分離し、  
さらに **弾・ミサイル描画を asset.js のスプライト化へ移行**する。

**ゲームロジック・物理挙動・敵 AI・プレイヤー操作には一切影響を与えないこと（完全互換）。**  
**update() の内容には絶対に触れないこと。**

本作業は Newtonian Symmetry（物理統合）フェーズの前処理である。
**記録**: 作業終了後、作業内容は `changelog.js` に記載し、リビジョン番号を上げること。

---

# 1. 新規ファイルの作成（utils 直下）
以下のファイルを utils 直下に作成する：

- `js/utils/drawBackground.js`
- `js/utils/drawEffects.js`
- `js/utils/drawHUD.js`
- `js/utils/drawOverlay.js`

※ フォルダは作らず、すべて utils 直下に置く。

---

# 2. asset.js の拡張（弾・ミサイルのスプライト化）
描画フェーズで毎フレーム canvas に直接描いている以下の描画を、  
**asset.js 内でスプライト化する**：

- 自機弾（黄色レーザー）
- 敵弾（赤レーザー）
- ミサイル（白い三角＋四角の組み合わせ）

## 2-1. 追加するスプライト
asset.js に以下のスプライト生成関数を追加する：

- 自機弾スプライト  
- 敵弾スプライト  
- ミサイルスプライト  

### 要件
- 既存の見た目を完全に再現すること  
- 色・形状・サイズは既存描画と同一  
- スプライトは canvas に描画したものをキャッシュする形式  
- SpriteCache に以下のプロパティを追加する：  
  - `playerBullet`  
  - `enemyBulletLaser`  
  - `missile`  

### 注意
- **ロジック（速度・角度・衝突判定）は一切変更しないこと。**  
- **描画だけをスプライト化する。**

---

# 3. 描画フェーズの分離（utils へ移動）

## 3-1. drawBackground.js
背景（Starfield）の描画処理を移動する。

### 含める処理
- stars 配列の走査  
- レイヤーごとのスクロール描画  
- 背景の純粋描画処理

---

## 3-2. drawEffects.js
エフェクト系の描画をまとめて移動する。

### 含める処理
- パーティクル（entities.particles）  
- デブリ（entities.debris）  
- 爆発（entities.explosions）  
- トレイル（player.leftTrailHistory / rightTrailHistory など）の描画部分  
- **弾・ミサイルの描画（スプライト化したものを drawImage で描画）**

### 注意
- トレイル生成ロジック（update 側）は移動禁止。  
- プレイヤー描画・敵描画はここに含めない。

---

## 3-3. drawHUD.js
HUD（UI）の描画を移動する。

### 含める処理
- HPバー  
- ヒートゲージ  
- ブーストゲージ  
- クレジット表示  
- その他 HUD の純粋描画

---

## 3-4. drawOverlay.js
UI オーバーレイ（フェード・カウントダウンなど）を移動する。

### 含める処理
- フェードイン / フェードアウト  
- カウントダウン表示  
- その他純粋 UI 描画

---

# 4. main.js の変更

## 4-1. 旧描画処理の削除
main.js の draw() 内に存在する純粋描画処理を削除し、  
代わりに utils の描画関数を呼び出す。

## 4-2. 新描画関数のインポート
main.js の先頭付近に以下を追加する：

- `import drawBackground from "./js/utils/drawBackground.js";`
- `import drawEffects from "./js/utils/drawEffects.js";`
- `import drawHUD from "./js/utils/drawHUD.js";`
- `import drawOverlay from "./js/utils/drawOverlay.js";`

## 4-3. draw() の構造を以下のように整理する：
function draw() {
drawBackground(ctx, stars, GAME);
drawEffects(ctx, player, entities, SpriteCache);
drawHUD(ctx, GAME, playerStats);
drawOverlay(ctx, GAME);
}


### ※重要
- **プレイヤー描画・敵描画は絶対に移動しないこと。**  
  （物理ロジックと密結合しているため）
- **update() の中身には触れないこと。**

---

# 5. 完了条件
- ゲーム実行時、描画の挙動がリファクタリング前と完全一致すること。
- 弾・ミサイルの見た目が完全に一致していること。
- main.js の draw() が 10〜15 行程度の薄い関数になっていること。
- update() や物理挙動に一切の変更がないこと。
- 描画処理が utils 直下に分割されていること。
- 弾・ミサイル描画が asset.js のスプライト化に置き換わっていること。

---

# 6. 注意事項
- **コード例は一切生成しないこと。**  
  AI‑IDE が誤ってそのコードを “正解” と認識し、後続フェーズを壊すのを防ぐため。
- **プレイヤー描画・敵描画は移動禁止。**
- **update() の中身には絶対に触れないこと。**
- **物理・AI・プレイヤー操作に関わる部分は一切変更禁止。**
