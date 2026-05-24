# 作業指示書：20260524_order3_refactoring_phase3_KEYINPUT(v0.5.05)
## 役割
あなたは優秀なフロントエンドエンジニアです。  
提供したソースコードに対し、以下の「キー入力処理の軽量リファクタリング作業」を行ってください。

## 目的
main.js に肥大化している `keydown` / `keyup` の処理を、  
ゲーム状態ごとに分離し、専用の入力ハンドラ群へ移動する。

**ゲームロジック・物理挙動・敵 AI・プレイヤー操作には一切影響を与えないこと（完全互換）。**  
**update() の内容には絶対に触れないこと。**

本作業は Newtonian Symmetry（物理統合）フェーズの前処理である。
**記録**: 作業終了後、作業内容は `changelog.js` に記載し、リビジョン番号を上げること。

---

# 1. 新規ファイルの作成
以下のファイルを作成する：

- `js/utils/handleTitleInput.js`
- `js/utils/handleResultInput.js`
- `js/utils/handleLevelUpInput.js`
- `js/utils/handlePlayingInput.js`
- `js/utils/handleCommInput.js`  
  （通信モード中の入力があるため）

これらは main.js の keydown 処理を状態ごとに分割した関数群を格納する。

---

# 2. 各ファイルの責務と仕様

## 2-1. handleTitleInput.js
タイトル画面中のキー入力を処理する。

### 含める処理
- 任意キー押下で `GAME.titleLaunchTimer` を開始する処理  
- Space / Enter の扱い  
- 既存のタイトル画面専用ロジックをそのまま移動する

---

## 2-2. handleResultInput.js
リザルト画面中のキー入力を処理する。

### 含める処理
- 上下キーによる選択肢変更  
- Space / Enter による決定  
- RETURN TO GARAGE / RETRY MISSION の分岐  
- 既存のリザルト画面専用ロジックをそのまま移動する

---

## 2-3. handleLevelUpInput.js
レベルアップ画面中のキー入力を処理する。

### 含める処理
- 左右キーによるカード選択  
- Space / Enter による決定  
- `GAME.levelUpState` の遷移  
- 既存のレベルアップ画面専用ロジックをそのまま移動する

---

## 2-4. handlePlayingInput.js
通常プレイ中のキー入力を処理する。

### 含める処理
- モード切替（KeyX）  
- 通信モード起動（KeyC）  
- デバッグキー（1〜6）  
- プレイヤー死亡・着艦・発進中の入力制限  
- 既存の PLAYING 状態専用ロジックをそのまま移動する

---

## 2-5. handleCommInput.js
通信モード中のキー入力を処理する。

### 含める処理
- CommStateManager への入力委譲  
- 通信モード専用のキー処理  
- 既存の通信状態専用ロジックをそのまま移動する

---

# 3. main.js の変更

## 3-1. 旧 keydown / keyup 処理の削除
main.js に存在する巨大な keydown 処理を **完全に削除**する。

## 3-2. 新ハンドラのインポート
main.js の先頭付近に以下を追加する：

- `import handleTitleInput from "./js/utils/handleTitleInput.js";`
- `import handleResultInput from "./js/utils/handleResultInput.js";`
- `import handleLevelUpInput from "./js/utils/handleLevelUpInput.js";`
- `import handlePlayingInput from "./js/utils/handlePlayingInput.js";`
- `import handleCommInput from "./js/utils/handleCommInput.js";`

## 3-3. 状態ごとのディスパッチャを作成
main.js の keydown イベントを以下のように書き換える：

window.addEventListener("keydown", e => {
if (GAME.state === "TITLE") return handleTitleInput(e, GAME, player);
if (GAME.state === "RESULT") return handleResultInput(e, GAME, player);
if (GAME.state === "LEVEL_UP") return handleLevelUpInput(e, GAME, player);
if (GAME.commState && GAME.commState !== "INACTIVE") return handleCommInput(e, GAME, player);
return handlePlayingInput(e, GAME, player, entities);
});


### ※重要
- **引数・状態遷移・呼び出し順序は絶対に変更しないこと。**
- **update() の中身には触れないこと。**

---

# 4. 完了条件
- ゲーム実行時、キー入力の挙動がリファクタリング前と完全一致すること。
- main.js の keydown 処理が 10 行以下の薄いディスパッチャになっていること。
- update() や物理挙動に一切の変更がないこと。
- 入力処理が `js/utils/` に分割されていること。

---

# 5. 注意事項
- **コード例は一切生成しないこと。**  
  AI‑IDE が誤ってそのコードを “正解” と認識し、後続フェーズを壊すのを防ぐため。
- **update() の中身には絶対に触れないこと。**
- **物理・AI・プレイヤー操作に関わる部分は一切変更禁止。**
