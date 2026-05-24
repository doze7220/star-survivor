# 作業指示書：20260524_order3_refactoring_phase3_RENDERING_LEVELUP_INTEGRATION(v0.5.05)
## 役割
あなたは優秀なフロントエンドエンジニアです。  
すでに実行済みの「描画フェーズ分離指示書（簡略版）」に追加する形で、  
レベルアップ画面の描画処理を drawHUD に統合してください。

## 目的
main.js に残っている `drawLevelUpScreen()` を、  
HUD と同じ UI レイヤーとして扱い、  
`drawHUD.js` に統合する。

**ゲームロジック・物理挙動・敵 AI・プレイヤー操作には一切影響を与えないこと（完全互換）。**  
**update() の内容には絶対に触れないこと。**

本作業は、既存の描画分離構造を拡張するための追加パッチである。

---

# 1. 対象ファイル
- `main.js`
- `js/utils/drawHUD.js`

---

# 2. drawLevelUpScreen の扱い

## 2-1. 移動対象
以下の処理を **drawHUD.js** に移動する：

- レベルアップ画面の描画処理（`drawLevelUpScreen`）
  - カードの描画  
  - カーソルの描画  
  - 選択状態の描画  
  - テキスト描画  
  - その他レベルアップ UI の純粋描画

### 注意
- **描画のみ移動すること。**  
- **レベルアップの状態更新（選択・決定・カーソル移動など）は update() 側に残す。**

---

# 3. drawHUD.js の拡張

## 3-1. HUD と LevelUpScreen の統合
`drawHUD.js` 内に以下の構造を追加する：

- 通常 HUD 描画  
- **GAME.state が 'LEVEL_UP' の場合は、HUD の代わりにレベルアップ画面を描画する**

### 条件分岐の例（構造のみ）
if (GAME.state === 'LEVEL_UP') {
// レベルアップ画面の描画処理
} else {
// 通常 HUD の描画処理
}

※ コード例は書かないこと。

---

# 4. main.js の変更

## 4-1. 旧 drawLevelUpScreen の削除
main.js 内に残っている `drawLevelUpScreen()` の定義を削除する。

## 4-2. draw() の変更は不要
すでに `drawHUD()` を呼び出す構造になっているため、  
draw() の変更は不要。

---

# 5. 完了条件
- レベルアップ画面の描画が drawHUD.js に統合されていること。
- main.js から drawLevelUpScreen が完全に削除されていること。
- ゲーム実行時、レベルアップ画面の見た目・挙動がリファクタリング前と完全一致すること。
- update() や物理挙動に一切の変更がないこと。
- 既存の描画分離構造（drawBackground / drawEffects / drawHUD / drawOverlay）が維持されていること。

---

# 6. 注意事項
- **コード例は一切生成しないこと。**  
- **update() の中身には絶対に触れないこと。**
- **プレイヤー描画・敵描画は移動禁止。**
- **レベルアップのロジック（選択・決定）は移動禁止。**
