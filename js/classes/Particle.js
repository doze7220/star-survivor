/**
 * Particle クラス
 * 視覚エフェクト専用のパーティクルエンティティ。
 * constructor: 初期プロパティをそのままオブジェクトリテラルから移植。
 * update(): 位置・寿命の更新のみ。splice/filter は行わない。
 * ※ draw() は実装しない（drawEffects.js / EffectManager.draw() を変更しない）。
 * ※ cleanup は従来通り呼び出し元の cleanup phase に残す。
 *
 * 対応タイプ一覧:
 *   SPARK          - タクティカルブレーキ時の火花
 *   SMOKE          - ミサイル噴煙
 *   DEBRIS_SMOKE   - 有害デブリ後部煙（maxLife / baseSize を持つ）
 *   CROSS          - Auto Repair 演出
 *   LEVEL_UP_HIT_PARTICLE - レベルアップ決定演出（固定 decay 0.025）
 */
class Particle {
    /**
     * @param {number}  x         - X座標
     * @param {number}  y         - Y座標
     * @param {number}  vx        - X速度
     * @param {number}  vy        - Y速度
     * @param {number}  life      - 寿命（0〜1.0 の正規化値）
     * @param {number}  [decay]   - 寿命減衰量（省略時は CONFIG.PARTICLE_DECAY を使用）
     * @param {number}  [size]    - サイズ（SMOKE / SPARK / CROSS 用）
     * @param {string}  [color]   - 色文字列
     * @param {string}  [type]    - パーティクルタイプ識別子
     * @param {number}  [maxLife] - 初期寿命の最大値（DEBRIS_SMOKE の拡大計算用）
     * @param {number}  [baseSize]- 基本サイズ（DEBRIS_SMOKE の拡大計算用）
     */
    constructor(x, y, vx, vy, life, decay, size, color, type, maxLife, baseSize) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        // decay が undefined / null のときは update() で CONFIG.PARTICLE_DECAY にフォールバック
        this.decay = decay;
        this.size = size;
        this.color = color;
        this.type = type;
        // DEBRIS_SMOKE 専用プロパティ
        this.maxLife = maxLife;
        this.baseSize = baseSize;
    }

    /**
     * 毎フレーム呼び出し。位置更新と寿命減衰のみ。
     * splice / filter は行わない（cleanup は呼び出し元に任せる）。
     *
     * 元コード:
     *   EffectManager.update (effects.js L17–L19):
     *     p.x += p.vx; p.y += p.vy; p.life -= p.decay || CONFIG.PARTICLE_DECAY;
     *
     *   updateLevelUpScreen (main.js) LEVEL_UP_HIT_PARTICLE 専用ループ:
     *     p.x += p.vx; p.y += p.vy; p.life -= 0.025;
     */
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay || CONFIG.PARTICLE_DECAY;
    }
}
