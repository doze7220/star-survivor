# input.js 分離指示書

## 【役割】
あなたは優秀なフロントエンドエンジニアです。
main.js にある入力管理ロジックを分離し、js/input.js を作成してください。

## 【作業内容】
1. js/input.js を作成し、`keys` オブジェクトと `mouse` オブジェクト、およびそれに関連する window.addEventListener 定義をすべてここに移動すること。
2. InputManager オブジェクトを作成し、以下のインターフェースを提供すること。
   - `InputManager.isPressed(key)`: 特定のキーが押されているか判定。
   - `InputManager.getMouse()`: 現在のマウス状態を取得。
3. main.js での直接的な `keys[...]` 参照をすべて `InputManager.isPressed(...)` に書き換えること。
4. 作業内容は js/changelog.js に記載し、リビジョン番号を上げること。

## 【重要】
* ゲームの操作感は一切変えないこと。
* 物理計算ロジックやゲーム状態管理には一切触れないこと。
* 作業後、main.js から以前の入力関連コードは完全に削除すること。

