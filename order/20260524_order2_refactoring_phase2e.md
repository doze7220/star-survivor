# hud.js 分離指示書

## 【役割】
あなたは優秀なフロントエンドエンジニアです。
main.js にある HUD（ヘッドアップディスプレイ）および UI 描画ロジックを分離し、`js/hud.js` を作成してください。

## 【作業内容】
1. **js/hud.js の作成**:
    * `HUDManager` オブジェクト（またはクラス）を作成すること。
    * `main.js` にある `updateHUD()` 関数と、描画ループ内で `ctx` を直接操作している UI 関連ロジック（ステータスパネル表示、ゲージ描画など）をすべてここに移動すること。
2. **メソッドの実装**:
    * `HUDManager.update(playerStats, GAME)`: UIの状態更新ロジックを移動。
    * `HUDManager.draw(ctx, player, GAME)`: 描画ロジックを移動。
3. **main.js の改修**:
    * `main.js` の描画ループから、直接的な UI 描画命令を削除し、`HUDManager.draw(...)` の呼び出しに置き換えること。
    * `main.js` から `updateHUD()` 関数を完全に削除すること。
4. **HTML設定**: `index.html` に新しいスクリプト `js/hud.js` の読み込みを追加すること。
5. **記録**: 作業内容は `js/changelog.js` に記載し、リビジョン番号を上げること。

## 【重要】
* ゲームの見た目（フォント、位置、色、ゲージの動き）は一切変更しないこと。
* 物理計算ロジックやゲーム状態管理には一切触れないこと。
* UI 描画に必要な HTML 要素（stats-panel 等）の ID 参照などは、`HUDManager` 内で完結させること。