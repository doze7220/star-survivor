/**
 * Debris クラス
 * 破片エンティティ。
 * constructor: 初期プロパティを設定。
 * update(): 位置更新と寿命減衰のみ。
 *
 * 【update() で行わないこと】
 *   - particle 生成（煙軌跡は main.js のデブリループ内に残存）
 *   - damage 処理 / score 加算
 *   - explosion 生成
 *   - shake 発生
 *   - splice / filter（cleanup は main.js に残存）
 *
 * ※ draw() は実装しない（drawEffects.js / EffectManager.draw() を変更しない）。
 */
class Debris {
    /**
     * @param {number}  x       - X座標
     * @param {number}  y       - Y座標
     * @param {number}  vx      - X速度
     * @param {number}  vy      - Y速度
     * @param {string}  color   - 破片の色
     * @param {number}  size    - 破片のサイズ（px）
     * @param {number}  life    - 寿命（1.0 を基準とした正規化値）
     * @param {number}  decay   - 寿命減衰量（フレームあたり）
     * @param {boolean} harmful - true = 有害デブリ（衝突判定あり）/ false = 演出のみ
     */
    constructor(x, y, vx, vy, color, size, life, decay, harmful) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.decay = decay;
        this.harmful = harmful;
    }

    /**
     * 毎フレーム呼び出し。位置更新と寿命減衰のみ。
     * splice / filter は行わない（cleanup は main.js に任せる）。
     * particle 生成・damage 処理も行わない。
     *
     * 元コード (main.js):
     *   d.x += d.vx; d.y += d.vy;
     *   d.life -= d.decay;
     */
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
}
