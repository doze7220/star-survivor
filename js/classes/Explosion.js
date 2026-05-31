/**
 * Explosion クラス
 * 爆発エンティティ。
 * constructor: 初期プロパティを設定。
 * update(): タイマーデクリメント・scale/shake計算・currentRadius算出のみ。
 *
 * 【update() で行わないこと】
 *   - damage 処理（対Player / 対Enemy）
 *   - collision 判定
 *   - chain explosion
 *   - score 加算
 *   - shake 発生（画面揺れ）
 *   - particle spawn
 *   - entity remove (splice / filter)
 *   - cleanup (timer <= 0 の削除判定)
 *   - ゲームオーバー遷移 (SceneManager.result.init)
 *
 * ※ draw() は実装しない（drawEffects.js / EffectManager.draw() を変更しない）。
 */
class Explosion {
    /**
     * @param {number}  x                - X座標
     * @param {number}  y                - Y座標
     * @param {number}  maxRadius        - 爆発の最大半径
     * @param {number}  timer            - 残りフレーム数（= duration）
     * @param {number}  maxTimer         - 最大フレーム数（= duration）
     * @param {Set}     damagedEntities  - 重複ダメージ防止用 Set
     * @param {boolean} isPlayerExplosion - 自機の爆発かどうか
     * @param {boolean} isFlavor         - 演出用爆発かどうか
     * @param {boolean} isMissileFlare   - ミサイルフレアかどうか
     * @param {number}  damageMultiplier - ダメージ倍率
     * @param {number}  angle            - フレア内の円配置用ランダム角度
     * @param {number}  offsetMid        - 中円のランダムオフセット
     * @param {number}  offsetSmall      - 小円のランダムオフセット
     */
    constructor(x, y, maxRadius, timer, maxTimer, damagedEntities, isPlayerExplosion, isFlavor, isMissileFlare, damageMultiplier, angle, offsetMid, offsetSmall) {
        this.x = x;
        this.y = y;
        this.maxRadius = maxRadius;
        this.timer = timer;
        this.maxTimer = maxTimer;
        this.damagedEntities = damagedEntities;
        this.isPlayerExplosion = isPlayerExplosion;
        this.isFlavor = isFlavor;
        this.isMissileFlare = isMissileFlare;
        this.damageMultiplier = damageMultiplier;
        this.angle = angle;
        this.offsetMid = offsetMid;
        this.offsetSmall = offsetSmall;

        // 描画用プロパティ（毎フレーム update() で算出）
        this.shakeX = 0;
        this.shakeY = 0;
        this.currentScale = 1.0;
        this.currentRadius = 0;
    }

    /**
     * 毎フレーム呼び出し。タイマーデクリメント・scale/shake計算・currentRadius算出のみ。
     * splice / filter は行わない（cleanup は main.js に任せる）。
     * damage 処理・collision 判定も行わない。
     *
     * 元コード (main.js L1327–L1350):
     *   exp.timer--;
     *   const progress = 1 - (exp.timer / exp.maxTimer);
     *   // scale 計算（アニメ風の爆発推移: 10%急拡大→80%維持→10%急縮小）
     *   // shakeX / shakeY / currentScale 保存
     *   const currentRadius = exp.maxRadius * scale;
     */
    update() {
        this.timer--;

        const progress = 1 - (this.timer / this.maxTimer);

        // --- アニメ風の爆発推移計算 ---
        // 最初の10%で急拡大、中間80%は最大サイズを維持して震える、最後の10%で急縮小
        let scale = 1.0;
        let isShaking = false;
        if (progress < 0.1) {
            scale = Math.sin((progress / 0.1) * (Math.PI / 2)); // Ease-out
        } else if (progress > 0.9) {
            scale = Math.sin(((1.0 - progress) / 0.1) * (Math.PI / 2)); // Ease-in
        } else {
            isShaking = true;
            // 維持中は小刻みに震える
            scale = 1.0 + (Math.random() - 0.5) * 0.15;
        }

        // 描画用の揺れオフセットもここで計算しておく（描画時に利用する）
        this.shakeX = isShaking ? (Math.random() - 0.5) * 10 : 0;
        this.shakeY = isShaking ? (Math.random() - 0.5) * 10 : 0;
        this.currentScale = scale; // 描画側で使うために保存

        this.currentRadius = this.maxRadius * scale;
    }
}
