# 作業指示書：20260525_order5_physics_overhaul

## 役割
あなたは優秀なフロントエンドエンジニアです。  
リファクタリング（クラス化、状態管理の分離等）が完了したクリーンなソースコードに対し、以下の「物理シミュレーションとAIの完全統合（システム改修）」を行ってください。

---

# 目的

自機（プレイヤー）と敵機（AI）の物理挙動、入力処理、および衝突判定を可能な限り統一し、物理STGとしてのフェアネス（Newtonian Symmetry）を確立する。

ただし、本フェーズの目的は：

「ゲームとして公平に感じられる物理統一」

であり、

厳密リアル物理シミュレーションを目的としない。

【重要】本フェーズはリファクタリングではなく「仕様変更」である。

敵機に対する「座標や速度の直接的な操作（ズル）」を段階的に排除し、可能な限りプレイヤーと同じ入力制約の中で動作させるよう挙動を書き換えること。

---

# 最重要

本フェーズは：

- gameplay rewrite
- AI redesign
- physics engine rewrite

を目的としない。

現在のゲーム感覚：

- drift 感
- inertia
- enemy pressure
- combat tempo
- formation behavior

を維持したまま、

「入力経路」と
「物理法則」

を統一することを目的とする。

---

# 1. 現状の前提（重要）

- Ship / PlayerShip / EnemyShip は既に存在する
- updatePhysics() は既に存在する
- collision / cleanup / lifecycle は整理済み
- entity class 化は完了済み
- main.js は orchestration layer 化済み
- 敵AIは現在 steering math により直接 vx/vy を操作している
- プレイヤーは InputManager により直接入力処理されている

本フェーズでは：

「入力」
「AI判断」
「物理」

を分離する。

---

# 2. 実装方針（重要）

以下を変更しないこと：

- update 順序
- collision 順序
- cleanup 順序
- draw 順序
- AI personality
- engagement distance
- heat system
- recoil
- boost system
- missile homing
- launch / docking sequence

本フェーズは：

「AI の出力先を virtual input 化する」

ことのみを目的とする。

---

# 3. 禁止事項（重要）

以下は禁止：

- physics engine rewrite
- ECS 化
- event system 化
- deltaTime 化
- object pooling
- behavior tree 導入
- PID control
- damped steering
- smooth rotation
- lerp steering
- predictive AI rewrite
- architecture rewrite

現在のロジックを：

「仮想コントローラー入力」

へ変換することのみを目的とする。

---

# 4. Virtual Input Interface の導入

全機体（PlayerShip / EnemyShip 等）は、

仮想入力オブジェクト：

inputs

を介してのみ機動を行うよう改修する。

---

## ControllerInput 構造

```js
{
    thrustX: number,
    thrustY: number,
    yaw: number
}
```

各値は：

-1.0 ～ +1.0

の範囲を持つ。

---

# 5. Player Input の変換

InputManager の：

- keyboard
- mouse
- controlMode

を、

PlayerShip.inputs

へ変換する。

例：

- W/S → thrustY
- A/D → yaw

入力マッピングは変更しないこと。

---

# 6. Enemy AI の virtual controller 化

Enemy AI は：

直接：

- vx +=
- vy +=
- angle =
- rotation =

を行ってはならない。

代わりに：

EnemyShip.updateLogic()

内で：

inputs.thrustY
inputs.yaw

を生成すること。

---

# 7. AI steering 制限（超重要）

AI は：

「入力」

を生成するのであり、

rotation を直接制御してはならない。

禁止：

```js
angle = targetAngle;
rotation = targetAngle;
```

AI は：

- turn left
- turn right
- thrust

などの操縦入力のみを生成すること。

---

# 8. AI precision 制限（重要）

AIController の入力精度は、

可能な限りプレイヤー入力レンジへ近づけること。

超人的 precision steering を導入しないこと。

禁止例：

```js
yaw = angleDiff * 0.037421;
```

許可例：

```js
yaw = -1;
yaw = 0;
yaw = 1;
```

または、

プレイヤー入力に近い粗い連続値。

---

# 9. thrustX（RCS）の扱い

thrustX は：

将来の RCS / 補助スラスター拡張用として導入する。

現在 lateral thrust を持たない既存機体は：

thrustX を使用してはならない。

既存敵AIへ：

新規 strafing movement を導入しないこと。

---

# 10. applyPhysics() の責務

applyPhysics() は：

現在 main.js に存在する物理更新式を移植することのみを目的とする。

新規 physics engine を設計しないこと。

---

## applyPhysics() に含めるもの

- position update
- velocity update
- friction
- speed clamp
- rotation update

---

## applyPhysics() に含めないもの

- AI判断
- weapon fire
- heat gauge
- recoil logic
- state transition
- docking
- launch sequence
- collision response

---

# 11. applyPhysics() の物理仕様

## 旋回

inputs.yaw と handling に基づいて：

bodyAngle

を更新する。

AI による直接 angle 操作は禁止。

---

## 加速

inputs.thrustY に基づき：

bodyAngle 正面方向への thrust を加算する。

---

## 側面推力（RCS）

inputs.thrustX に基づき：

bodyAngle の直交方向へ thrust を加算する。

ただし：

既存機体は thrustX を使用しないこと。

---

## 環境物理

以下は全機体共通：

- friction
- inertia
- maxSpeed clamp

---

# 12. enemy vs enemy collision の制限（重要）

enemy vs enemy collision は：

完全 elastic collision を目的としない。

gameplay stability を優先すること。

必要なら：

- damping
- reduced impulse
- softened response

を許可する。

隊列崩壊や pinball 化を防ぐこと。

---

# 13. Symmetric Collision の実装

resolveCollision(entityA, entityB)

を導入する。

ただし：

現在の collision 順序は変更しないこと。

---

# 14. collision law の方針

目的は：

「同一 collision law」

であり、

「完全同値ダメージ」

ではない。

mass / armor / gameplay coefficient の違いは許可する。

---

# 15. recoil の統一

collision normal と relative velocity から：

impulse

を計算する。

ただし：

現在の gameplay feel を優先し、

完全 rigid body physics を目的としない。

---

# 16. AI persistent steering state の禁止

AIController は：

新規 steering state を導入しないこと。

禁止例：

- desiredAngle memory
- steering cache
- PID history
- smoothing buffer

現在フレームの情報のみを使用し、

既存 AI の思考周期を維持すること。

---

# 17. update 順序固定（超重要）

以下を変更しないこと：

- entity update 順
- collision 順
- cleanup 順
- remove 順
- score timing
- shake timing
- chain explosion timing

---

# 18. 数学処理の変更禁止

以下は禁止：

- sqrt → squared distance 最適化
- atan2 ロジック変更
- friction 計算変更
- clamp 数式変更
- rotation smoothing
- steering interpolation

---

# 19. draw 系について

draw 系には原則触らない。

特に：

- additive
- glow
- trail
- HUD
- overlay
- layer order

を変更しないこと。

---

# 20. 段階実装（重要）

## ✔ Step 1

Player のみ：

virtual input → applyPhysics()

へ移行。

Enemy は旧方式維持。

---

## ✔ Step 2

Enemy AI の出力を：

virtual input 化。

---

## ✔ Step 3

Enemy 内の：

- vx +=
- vy +=
- angle =

を段階的除去。

recoil / impulse は除外可能。

---

## ✔ Step 4

Player / Enemy が：

同一 applyPhysics()

を通過する状態へ統合。

---

# 21. 比較検証モード

以下フラグを導入すること：

```js
USE_PLAYER_VIRTUAL_INPUT
USE_ENEMY_VIRTUAL_INPUT
USE_UNIFIED_COLLISION
```

比較検証と rollback を可能にすること。

---

# 22. 差分形式で提示

以下を差分形式で提示すること：

- どの vx/vy 制御を削除したか
- どこを virtual input 化したか
- applyPhysics() をどこへ統合したか
- collision をどう統一したか

---

# 23. 完了条件

- Player / Enemy が同一 physics を通過している
- Enemy AI が virtual input を生成している
- direct velocity manipulation が大幅削減されている
- drift 感覚が維持されている
- enemy steering が破綻していない
- formation stability が維持されている
- collision 順序が維持されている
- gameplay feel が維持されている
- rollback 可能な比較モードが存在する
- Newtonian Symmetry が成立している