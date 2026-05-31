/**
 * Bullet クラス
 * 自機の通常弾エンティティ。
 * constructor: 初期状態を設定。
 * update(): 位置更新と寿命デクリメントのみ。
 * ※ draw() / collision / cleanup は main.js に残存。
 */
class Bullet {
    /**
     * @param {number} x         - 初期X座標
     * @param {number} y         - 初期Y座標
     * @param {number} vx        - X速度
     * @param {number} vy        - Y速度
     * @param {number} life      - 寿命（フレーム数）
     * @param {boolean} [isScatter=false] - Scatter Shot フラグ（Limit Burst 判定用）
     */
    constructor(x, y, vx, vy, life, isScatter = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.isScatter = isScatter;
    }

    /**
     * 毎フレーム呼び出し。位置更新と寿命デクリメントを行う。
     * 元コード (main.js L1397): b.x += b.vx; b.y += b.vy; b.life--;
     */
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
}
