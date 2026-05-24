# 作業指示書：20260525_order5_refactoring_phase5_CONTROLLER_ABSTRACTION

## 役割
あなたは優秀なフロントエンドエンジニアです。  
提供したソースコードに対し、以下の「Controller Abstraction / Newtonian Symmetry 完成フェーズ」を段階的に実施してください。

---

# 目的

Phase3〜4 により：

- Ship / PlayerShip / EnemyShip
- entity class 化
- collision 分離
- update orchestration 化

は完了済みである。

本フェーズでは：

「プレイヤー」と「敵AI」が、
同一の操縦入力システムを通して機体を制御する構造へ統合する。

つまり：

- プレイヤーは HumanController
- 敵AIは AIController

を使用し、

最終的に：

ship.applyControl(controllerInput)

を通じて同じ物理宇宙を共有する。

---

# 最重要

## 本フェーズは「ゲーム法則変更」ではなく「入力経路統合」である

目的は：

- vx/vy の直接操作を除去すること
- AI が仮想コントローラー入力を生成すること
- Player / Enemy が同一 physics を通過すること

であり、

ゲームバランス変更や AI 強化を目的としない。

【絶対原則】現在のゲーム挙動・移動感覚・敵軌道・戦闘テンポを可能な限り維持すること。

---

# 1. 現状の前提（重要）

- Ship.updatePhysics() は既に存在する
- PlayerShip / EnemyShip は update() を持つ
- collision / cleanup / lifecycle は固定済み
- update 順序は既に安定化済み
- 敵 AI は現在 steering math により直接 vx/vy を変更している
- プレイヤーは InputManager の入力を直接処理している

本フェーズでは：

「入力」と「物理」を分離する。

---

# 2. 実装方針（重要）

- updatePhysics() の計算式は変更しない
- collision 順序を変更しない
- cleanup 順序を変更しない
- draw 順序を変更しない
- AI 思考ロジックを変更しない
- 敵 personality を変更しない
- boost 性能を変更しない
- recoil を変更しない
- heat system を変更しない
- 発艦シーケンスを変更しない
- 着艦シーケンスを変更しない
- homing missile を変更しない

本フェーズの目的は：

「AI の意思決定結果」を
「仮想入力」へ変換することである。

---

# 3. 禁止事項（重要）

以下は禁止：

- physics engine rewrite
- steering algorithm rewrite
- AI behavior rewrite
- ECS 化
- event system 化
- deltaTime 化
- object pooling
- multithreading 的構造
- entity registry 化
- 汎用 behavior tree 導入
- generic state machine 化

現在のロジックを、
「controller input 化」することのみを目的とする。

---

# 4. Controller abstraction の設計

## ControllerInput の導入

Player / Enemy 共通で使用する：

ControllerInput

を導入する。

例：

- thrust
- brake
- turn
- strafe
- firePrimary
- fireSecondary
- boost

など。

ただし：

現在ゲーム内で実際に使用されている入力のみを定義すること。

未来拡張を目的とした過剰 abstraction は禁止。

---

# 5. Ship.applyControl() の導入

Ship へ：

applyControl(controllerInput)

を実装する。

ここでは：

- thrust
- turn
- brake
- boost

による：

- acceleration
- rotation
- impulse

のみを処理する。

---

# 6. updatePhysics() の責務固定

updatePhysics() は：

- position 更新
- velocity 更新
- friction
- clamp

のみを担当する。

以下を含めない：

- AI 判断
- 入力生成
- weapon fire
- recoil
- boost gauge
- heat gauge
- state 遷移

---

# 7. HumanController の導入

現在 InputManager に存在する：

- keyboard
- mouse
- controlMode

を、

HumanController.getInput()

へ移植する。

ただし：

入力マッピングを変更しないこと。

---

# 8. AIController の導入

Enemy AI は：

直接 vx/vy を変更するのではなく、

AIController.getInput()

によって：

- thrust
- turn
- brake
- fire

を生成する構造へ変更する。

---

# 9. AI 思考ロジックの扱い

重要：

AI の：

- personality
- target selection
- steering decision
- avoidance
- engagement distance

は変更しない。

変更するのは：

「出力先」のみ。

つまり：

旧：
- vx += ...
- vy += ...

新：
- input.turn = ...
- input.thrust = ...

へ変換する。

---

# 10. 仮想コントローラー化の段階実装（超重要）

以下の順序で段階的に実施すること。

---

## ✔ Step 1：Player controller abstraction

Player のみ：

HumanController → applyControl()

へ移行する。

Enemy はまだ旧方式のまま維持する。

---

## ✔ Step 2：Enemy virtual controller 導入

Enemy AI の出力を：

AIController → applyControl()

へ変換する。

ただし：

旧 steering ロジックは可能な限り維持する。

---

## ✔ Step 3：direct velocity 操作の除去

EnemyShip 内に残る：

- vx +=
- vy +=

による直接制御を段階的に除去する。

recoil / impulse は除外可能。

---

## ✔ Step 4：Newtonian Symmetry 完成

Player / Enemy の両方が：

- 同一 applyControl()
- 同一 updatePhysics()

を通過する状態へ統合する。

---

# 11. 完全互換モード（重要）

比較検証用に：

USE_UNIFIED_CONTROLLER

フラグを導入すること。

false 時：
- 旧方式

true 時：
- 新方式

を使用できるようにする。

ロールバック可能性を維持すること。

---

# 12. update 順序固定（超重要）

現在 main.js に存在する：

- update 順
- collision 順
- cleanup 順
- remove 順

を変更しないこと。

controller abstraction により
update 順序を変更してはならない。

---

# 13. 数学処理の変更禁止

以下は禁止：

- sqrt → squared distance 最適化
- atan2 ロジック変更
- clamp 数式変更
- friction 計算変更
- rotation smoothing 変更

物理挙動差異を発生させないこと。

---

# 14. draw 系について

draw 系には原則触らない。

特に：

- additive
- glow
- trail
- HUD
- overlay

の描画順を変更しないこと。

---

# 15. 差分形式で提示

AI-IDE が誤解しないように：

- どの vx/vy 制御を削除したか
- どこを applyControl() に置換したか
- HumanController / AIController をどこへ導入したか

を差分形式で提示すること。

---

# 16. 完了条件

- Player / Enemy が同一 physics を通過している
- Enemy AI が仮想入力を生成している
- vx/vy 直接制御が大幅削減されている
- ゲーム感覚が可能な限り維持されている
- drift 感覚が維持されている
- enemy steering が破綻していない
- collision / cleanup / draw 順が維持されている
- rollback 可能な比較モードが存在する
- Newtonian Symmetry が成立している