/**
 * Missile クラス
 * 自機のミサイルエンティティ。
 * constructor: 初期状態を設定。
 * update(entities): ホーミング + 物理演算 + 噴煙パーティクル生成を行う。
 * ※ draw() / collision (対Enemy / 対EnemyMothership) / Sub-Munition生成 / cleanup は main.js に残存。
 */
class Missile {
    /**
     * @param {number}      x             - 初期X座標
     * @param {number}      y             - 初期Y座標
     * @param {number}      vx            - X速度（初速）
     * @param {number}      vy            - Y速度（初速）
     * @param {number}      angle         - 初期角度（ラジアン）
     * @param {object|null} target        - ロックオン対象エンティティ（null 可）
     * @param {number}      life          - 寿命（フレーム数）
     * @param {number}      speed         - 最大速度
     * @param {number}      turnRate      - 毎フレームの最大旋回量（ラジアン）
     * @param {number}      [damageMult=1.0]     - 爆発ダメージ倍率
     * @param {boolean}     [isSubMunition=false] - Sub-Munition フラグ（Limit Burst 判定用）
     */
    constructor(x, y, vx, vy, angle, target, life, speed, turnRate, damageMult = 1.0, isSubMunition = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.angle = angle;
        this.target = target;
        this.life = life;
        this.speed = speed;
        this.turnRate = turnRate;
        this.damageMult = damageMult;
        this.isSubMunition = isSubMunition;
    }

    /**
     * 毎フレーム呼び出し。ホーミング・物理演算・噴煙生成を行う。
     * 元コード: main.js L1442–L1477
     *
     * 処理順序（変更禁止）:
     *   1. ターゲットロスト判定
     *   2. ホーミング角度補正（while ループで正規化）
     *   3. 加速度加算
     *   4. 速度クランプ
     *   5. 座標更新
     *   6. 噴煙パーティクル生成
     *
     * @param {object} entities - グローバル entities オブジェクト（particles 配列への参照）
     */
    update(entities) {
        // 1. ターゲットロスト判定
        if (this.target && this.target.hp <= 0) this.target = null;
        if (!this.target && this.life > 60) this.life = 60; // ターゲットロスト時は早めに自爆

        // 2. ホーミング角度補正
        if (this.target) {
            const tx = this.target.x - this.x;
            const ty = this.target.y - this.y;
            let targetAngle = Math.atan2(ty, tx);
            let diff = targetAngle - this.angle;
            // 角度差を -π〜+π の範囲に正規化（変更禁止）
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.angle += Math.sign(diff) * Math.min(Math.abs(diff), this.turnRate);
        }

        // 3. 加速度加算（推力 = 0.5）
        this.vx += Math.cos(this.angle) * 0.5;
        this.vy += Math.sin(this.angle) * 0.5;

        // 4. 速度クランプ（最大速度を超えたら正規化）
        const speed = Math.hypot(this.vx, this.vy);
        if (speed > this.speed) {
            this.vx = (this.vx / speed) * this.speed;
            this.vy = (this.vy / speed) * this.speed;
        }

        // 5. 座標更新
        this.x += this.vx;
        this.y += this.vy;

        // 6. 噴煙（スモーク）パーティクル生成
        if (Math.random() < 0.6) {
            entities.particles.push({
                x: this.x - Math.cos(this.angle) * 8, // ミサイル後方から
                y: this.y - Math.sin(this.angle) * 8,
                vx: this.vx * 0.1 + (Math.random() - 0.5) * 0.5,
                vy: this.vy * 0.1 + (Math.random() - 0.5) * 0.5,
                life: 1.0,
                decay: 0.05,
                size: 3 + Math.random() * 3,
                color: Math.random() < 0.5 ? '#fff' : '#ccc',
                type: 'SMOKE'
            });
        }
    }
}
