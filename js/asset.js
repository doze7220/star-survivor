// ==========================================
// 2. Phase 1: 描画基盤 (SpriteCache)
// ==========================================
const SpriteCache = {
    player: null,
    enemyRammer: null,
    enemySniper: null,
    enemyDogfighter: null,
    enemyFlash: null,
    bullet: null,
    enemyBullet: null,
    particlePlayer: null,
    particleEnemy: null,
    gem: null,
    gemHeal: null,
    gemBigExp: null,
    debrisSmoke: null, // デブリの煙用キャッシュ

    init: function () {
        this.player = this.createShip('#0f0', CONFIG.PLAYER_SIZE_W, CONFIG.PLAYER_SIZE_H);  // 緑の自機
        this.enemyRammer = this.createShip(CONFIG.COLOR_ENEMY_RAMMER, CONFIG.ENEMY_SIZE_W, CONFIG.ENEMY_SIZE_H);   // 濃いグレー
        this.enemySniper = this.createShip(CONFIG.COLOR_ENEMY_SNIPER, CONFIG.ENEMY_SIZE_W, CONFIG.ENEMY_SIZE_H);   // パープル
        this.enemyDogfighter = this.createShip(CONFIG.COLOR_ENEMY_DOGFIGHTER, CONFIG.ENEMY_SIZE_W, CONFIG.ENEMY_SIZE_H); // ブルー
        this.enemyFlash = this.createShip('#fff', CONFIG.ENEMY_SIZE_W, CONFIG.ENEMY_SIZE_H, true); // 白のフラッシュ用敵機
        this.bullet = this.createCircle('#ff0', CONFIG.BULLET_SIZE);     // 黄色の自機ショット
        this.enemyBullet = this.createCircle('#f00', CONFIG.BULLET_SIZE); // 赤色の敵機ショット
        this.particlePlayer = this.createCircle(CONFIG.COLOR_PARTICLE_PLAYER, CONFIG.PARTICLE_SIZE);
        this.particleEnemy = this.createCircle(CONFIG.COLOR_PARTICLE_ENEMY, CONFIG.PARTICLE_SIZE);
        this.gem = this.createDiamond('#0ff', CONFIG.GEM_SIZE);      // シアンの経験値ジェム
        this.gemHeal = this.createDiamond('#f80', CONFIG.GEM_SIZE);  // オレンジのHP回復アイテム
        this.gemBigExp = this.createBigExpGem(Math.round(CONFIG.GEM_SIZE * CONFIG.BIG_EXP_SIZE_MULT));
        this.debrisSmoke = this.createCircle(CONFIG.DEBRIS_SMOKE_COLOR, CONFIG.DEBRIS_SMOKE_SIZE); // デブリの煙
    },

    createShip: function (color, w, h, isFlash = false) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        // ▲ 二等辺三角形の描画 (進行方向は右: x=w 側)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(w, h / 2);      // 先端
        ctx.lineTo(0, 0);          // 左上
        ctx.lineTo(0, h);          // 左下
        ctx.closePath();
        ctx.fill();
        // ● キャノピー (進行方向付近の黒い円)
        if (!isFlash) {
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(w - 10, h / 2, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        return c;
    },

    createCircle: function (color, r) {
        const c = document.createElement('canvas');
        c.width = r * 2; c.height = r * 2;
        const ctx = c.getContext('2d');
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(r, r, r, 0, Math.PI * 2);
        ctx.fill();
        return c;
    },

    createDiamond: function (color, size) {
        const c = document.createElement('canvas');
        c.width = size; c.height = size;
        const ctx = c.getContext('2d');
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(size / 2, 0);
        ctx.lineTo(size, size / 2);
        ctx.lineTo(size / 2, size);
        ctx.lineTo(0, size / 2);
        ctx.closePath();
        ctx.fill();
        return c;
    },

    createBigExpGem: function (size) {
        const c = document.createElement('canvas');
        c.width = size; c.height = size;
        const ctx = c.getContext('2d');
        const cx = size / 2;
        const cy = size / 2;
        const half = size / 2;

        ctx.save();
        ctx.translate(cx, cy);

        // 外周の白→紫縁取り
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.moveTo(0, -half);
        ctx.lineTo(half, 0);
        ctx.lineTo(0, half);
        ctx.lineTo(-half, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.strokeStyle = '#b46dff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 中心の黄色い十字星
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = Math.max(2, size * 0.08);
        ctx.beginPath();
        ctx.moveTo(-half * 0.22, 0);
        ctx.lineTo(half * 0.22, 0);
        ctx.moveTo(0, -half * 0.22);
        ctx.lineTo(0, half * 0.22);
        ctx.stroke();

        ctx.lineWidth = Math.max(1.5, size * 0.05);
        ctx.beginPath();
        ctx.moveTo(-half * 0.12, -half * 0.12);
        ctx.lineTo(half * 0.12, half * 0.12);
        ctx.moveTo(-half * 0.12, half * 0.12);
        ctx.lineTo(half * 0.12, -half * 0.12);
        ctx.stroke();

        ctx.restore();
        return c;
    }
};
