// changelog.js
const CHANGELOG = [
  {
    version: "v0.5.03",
    date: "2026-05-24",
    changes: [
      "巨大な単一ファイル（index.html）を構成要素ごとに物理的に分割",
      "CSSを style.css として分離",
      "JavaScript（ゲームロジック本体）を main.js として分離"
    ]
  },
  {
    version: "v0.5.02",
    date: "2026-05-24",
    changes: [
      "BugFix: drawCircularText関数が未定義だったエラーを修正"
    ]
  },
  {
    version: "v0.5.01",
    date: "2026-05-23",
    changes: [
      "マイクロHUDの円弧表示（レベル、経験値、速度、Gフォース）を実装",
      "敵機母艦からの発進ベクトルを正面（カタパルト進行方向）に修正",
      "敵機初期生成時のパラメータ（速度・旋回・攻撃力）適用漏れを修正",
      "Limit Burst (Lv.6) の各種特殊効果およびアップグレードUIのカラー適用を修正",
      "ミサイルが撃破済みの敵を追尾し続ける不具合を修正",
      "右下HUD(Stats Panel)の内容を最新の仕様(MISSILE等追加)に更新"
    ]
  },
  {
    version: "v0.5.00",
    date: "2026-05-23",
    changes: [
      "ミニマップ（レーダー内表示）の実装およびUI情報集約（HUD要素削除、Minimapオブジェクト導入）",
      "レーダーマイクロHUDの拡張（ターゲットHP％、Gフォース、各種アラート）",
      "LIMIT BURST（Lv6到達時）効果の実装（HEAT無効、スキャッター弾、マルチ弾頭、オートリペア）",
      "LIMIT BURST演出（アップグレード画面）の実装",
      "タクティカル・ブレーキ（Qキー）の実装と火花エフェクトの追加",
      "被弾処理の統合（damagePlayer関数の導入）"
    ]
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CHANGELOG;
}
