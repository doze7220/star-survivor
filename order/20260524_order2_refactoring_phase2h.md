# 作業指示書：20260524_order3_refactoring_phase3_RESETGAME(v0.5.05)
## 役割
あなたは優秀なフロントエンドエンジニアです。  
提供したソースコードに対し、以下の「resetGame() の軽量リファクタリング作業」を行ってください。

## 目的
main.js に肥大化している `resetGame()` の処理を、  
責務ごとに分割し、適切なユーティリティ関数へ移動する。

**ゲームロジック・物理挙動・敵 AI・プレイヤー操作には一切影響を与えないこと（完全互換）。**  
**update() の内容には絶対に触れないこと。**

本作業は Newtonian Symmetry（物理統合）フェーズの前処理である。

---

# 1. 新規ファイルの作成
以下のファイルを作成する：

- `js/utils/initPlayer.js`
- `js/utils/initEntities.js`
- `js/utils/initGameState.js`
- `js/utils/initUI.js`
- `js/utils/initMothership.js`

これらは resetGame() の内部処理を責務ごとに分割した関数群を格納する。

---

# 2. 各ファイルの責務と仕様

## 2-1. initPlayer.js
プレイヤー機体の初期化処理を担当する。

### 含める処理
- player の座標・速度・角度の初期化  
- 着艦シーケンス関連フラグの初期化  
- トレイル履歴の初期化  
- HP・ヒート・オーバーヒート状態の初期化  
- プレイヤー固有フラグ（例：_hpWarningPlayed）の初期化

### 注意
- **playerStats の値は変更しないこと（既存の初期化ロジックをそのまま移動するだけ）。**

---

## 2-2. initEntities.js
ゲーム内エンティティ（敵・弾・パーティクルなど）の初期化を担当する。

### 含める処理
- entities.enemies  
- entities.bullets  
- entities.enemyBullets  
- entities.particles  
- entities.gems  
- entities.missiles  
- entities.debris  
- entities.explosions  

これらの配列を空にする処理を移動する。

---

## 2-3. initGameState.js
GAME オブジェクトの状態初期化を担当する。

### 含める処理
- GAME.isPlayerDying  
- GAME.isMissionClear  
- GAME.isResultTriggered  
- GAME.killCount  
- GAME.damageTaken  
- GAME.operationTime  
- GAME.operationFrameCount  
- GAME.quotaReminderTimer  
- GAME.launchSequence  
- GAME.launchTimer  
- GAME.landingBlockedTimer  

### 注意
- **GAME.state は変更しないこと（resetGame() 呼び出し元が制御するため）。**

---

## 2-4. initUI.js
UI 要素の初期化を担当する。

### 含める処理
- `#credits-panel` の非表示  
- `#cielo-comm` の非表示  
- その他 resetGame() 内で行われている UI 初期化処理

### 注意
- **通信システム（comm.play）はここでは呼ばないこと。**  
  resetGame() の外側で呼ばれているため。

---

## 2-5. initMothership.js
敵母艦（enemyMothership）の初期化を担当する。

### 含める処理
- x, y  
- hp, maxHp  
- radius  
- isDead  
- launchTimer  
- flashTimer  

### 注意
- **CONFIG.SPAWN_X / SPAWN_Y の参照はそのまま維持する。**

---

# 3. main.js の変更

## 3-1. resetGame() の分割
main.js 内の resetGame() を以下のように書き換える：

- 旧 resetGame() の内部処理をすべて削除する  
- 代わりに以下の関数を順番に呼び出す：

initGameState(GAME);
initPlayer(player, playerStats);
initEntities(entities);
initMothership(entities, CONFIG);
initUI();


※ 引数は必要に応じて調整してよい。

### ※重要
- **resetGame() の呼び出しタイミング・外部から見た挙動は絶対に変更しないこと。**
- **resetGame() の最後にある `comm.play("ミッションは敵撃破10機！…")` はそのまま残すこと。**

---

# 4. 完了条件
- ゲーム実行時、resetGame() の挙動がリファクタリング前と完全一致すること。
- main.js の resetGame() が 5 行程度の薄い関数になっていること。
- update() や物理挙動に一切の変更がないこと。
- 初期化処理が `js/utils/` に分割されていること。

---

# 5. 注意事項
- **コード例は一切生成しないこと。**  
  AI‑IDE が誤ってそのコードを “正解” と認識し、後続フェーズを壊すのを防ぐため。
- **update() の中身には絶対に触れないこと。**
- **物理・AI・プレイヤー操作に関わる部分は一切変更禁止。**
