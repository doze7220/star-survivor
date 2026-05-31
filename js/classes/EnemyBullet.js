/**
 * EnemyBullet クラス
 * 敵機の弾エンティティ。
 * constructor: 初期状態を設定。
 * update(): 位置更新と寿命デクリメントのみ。
 * ※ draw() / collision (対Player / 対Missile) / cleanup は main.js に残存。
 */
class EnemyBullet {
    /**
     * @param {number} x      - 初期X座標
     * @param {number} y      - 初期Y座標
     * @param {number} vx     - X速度
     * @param {number} vy     - Y速度
     * @param {number} life   - 寿命（フレーム数）
     * @param {number} damage - ダメージ量
     */
    constructor(x, y, vx, vy, life, damage) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.damage = damage;
    }

    /**
     * 毎フレーム呼び出し。位置更新と寿命デクリメントを行う。
     * 元コード (main.js L1404): b.x += b.vx; b.y += b.vy; b.life--;
     */
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
}
