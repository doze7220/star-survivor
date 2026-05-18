# 🚀 STAR SURVIVER (スター・サバイバー)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Language: HTML5 / Vanilla JS](https://img.shields.io/badge/Language-HTML5%20%2F%20Vanilla%20JS-orange.svg)](#)
[![Style: Retro Arcade](https://img.shields.io/badge/Style-Retro%20Arcade-blueviolet.svg)](#)

『**STAR SURVIVER**』は、レトロアーケードの魂を宿した、見下ろし型宇宙空間慣性シューティングゲームです。  
往年の名作『SubSpace』『ボスコニアン』『タイムパトロール』の操作感を土台にしつつ、『Vampire Survivors』ライクな成長要素を重ねた、シングルHTML完結の軽量なWebアプリケーションゲームです。

---

## 🌌 ゲームコンセプト & 設計思想

### 1. 究極の浮遊感：Drift Physics (慣性移動物理)
キー入力による推進力と、毎フレーム `0.98` の摩擦係数による「滑る」ような極上のドリフト操作感を実現。宇宙空間ならではのリアルな慣性戦闘を楽しめます。

### 2. SpriteCache による描画の基礎固め
起動時にオフスクリーンキャンバスへ主要スプライトをプリレンダリングし、Canvas API の毎フレーム負荷を抑えます。アルファ段階では、キャッシュできるものと毎フレーム描くものを意図的に分け、まず操作感を優先します。

### 3. 三者択一のローグライト成長システム
敵を撃破して得られる経験値（EXP）を回収し、レベルアップ時にゲームが一時停止。プレイヤーはランダムに提示される3つの強化プランから1つを選択し、戦闘中の押し引きを強めていきます。

---

## 🛠️ 技術スタック

* **コア**: HTML5 / JavaScript (Vanilla JS - 外部ライブラリ一切不使用)
* **グラフィック**: Canvas API (プログラム描画のみ。画像アセットは一切不使用)
* **構成**: ポータビリティと開発効率を極限まで高めた **単一HTMLファイル完結構成**

---

## 📈 開発ロードマップ (Implementation Phases)

実装は以下の5つのフェーズに分けて、段階的かつ堅牢にビルドされます。

1. **Phase 1: 描画基盤** - キャンバス初期化、SpriteCacheによる主要アセット生成、高精度ゲームループの構築。
2. **Phase 2: 物理と操作** - 摩擦係数 `0.98` の慣性移動と、キャノピー付き機体の回転ロジックの実装。
3. **Phase 3: 戦闘と帰還** - 基本射撃、敵AI、ヒート管理、母艦への着艦判定をまとめて成立させる。
4. **Phase 4: 背景と演出** - 3層（0.2, 0.5, 0.8）の多重スクロール背景星野（Parallax Starfield）と、慣性を継承してフェードアウトするスラスターパーティクルの実装。
5. **Phase 5: 成長要素** - 経験値ジェムの吸い寄せ・回収、レベルアップ時の時間停止UI、およびステータス強化システムの完全統合。

---

## 📂 ディレクトリ構造

```text
star-survivor/
├── documents/
│   ├── spec_star_suvivor_alpha_focus.md   # アルファ焦点仕様（正規の判定基準）
│   └── spec_star_suvivor_alpha1_prompt.md  # アルファ版実装プロンプト（仕様書）
└── README.md                                # 本書（プロジェクト概要）
```

---

## 🎮 今後の予定
アルファ版は `documents/spec_star_suvivor_alpha_focus.md` を基準に、まず「慣性バトルが楽しいか」と「母艦へ帰れるか」を検証します。必要な詳細実装は `documents/spec_star_suvivor_alpha1_prompt.md` を参照します。
