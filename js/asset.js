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
    gem: null,
    gemHeal: null,
    gemBigExp: null,
    debrisSmoke: null, // デブリの煙用キャッシュ
    enemyMothership: null,
    enemyMothershipFlash: null,
    playerBullet: null,
    enemyBulletLaser: null,
    missile: null,

    init: function () {
        this.player = this.createShip('#0f0', CONFIG.PLAYER_SIZE_W, CONFIG.PLAYER_SIZE_H);  // 緑の自機
        this.enemyRammer = this.createShip(CONFIG.COLOR_ENEMY_RAMMER, CONFIG.ENEMY_SIZE_W, CONFIG.ENEMY_SIZE_H);   // 濃いグレー
        this.enemySniper = this.createShip(CONFIG.COLOR_ENEMY_SNIPER, CONFIG.ENEMY_SIZE_W, CONFIG.ENEMY_SIZE_H);   // パープル
        this.enemyDogfighter = this.createShip(CONFIG.COLOR_ENEMY_DOGFIGHTER, CONFIG.ENEMY_SIZE_W, CONFIG.ENEMY_SIZE_H); // ブルー
        this.enemyFlash = this.createShip('#fff', CONFIG.ENEMY_SIZE_W, CONFIG.ENEMY_SIZE_H, true); // 白のフラッシュ用敵機
        this.bullet = this.createCircle('#ff0', CONFIG.BULLET_SIZE);     // 黄色の自機ショット
        this.enemyBullet = this.createCircle('#f00', CONFIG.BULLET_SIZE); // 赤色の敵機ショット
        this.particlePlayer = this.createCircle(CONFIG.COLOR_PARTICLE_PLAYER, CONFIG.PARTICLE_SIZE);
        this.gem = this.createDiamond('#0ff', CONFIG.GEM_SIZE);      // シアンの経験値ジェム
        this.gemHeal = this.createDiamond('#f80', CONFIG.GEM_SIZE);  // オレンジのHP回復アイテム
        this.gemBigExp = this.createBigExpGem(Math.round(CONFIG.GEM_SIZE * CONFIG.BIG_EXP_SIZE_MULT));
        this.debrisSmoke = this.createCircle(CONFIG.DEBRIS_SMOKE_COLOR, CONFIG.DEBRIS_SMOKE_SIZE); // デブリの煙
        this.enemyMothership = this.createEnemyMothership(false);
        this.enemyMothershipFlash = this.createEnemyMothership(true);
        this.alliedMothership = this.createAlliedMothership();
        
        this.playerBullet = this.createLaserBullet('#ff0', '#fff');
        this.enemyBulletLaser = this.createLaserBullet('#f00', '#fff');
        this.missile = this.createMissileSprite();
    },

    createLaserBullet: function(outerColor, innerColor) {
        // max width = CONFIG.BULLET_SIZE * 2.8 * 2, max height = CONFIG.BULLET_SIZE * 0.7 * 2
        // To be safe and give some padding, we multiply by a bit more or use exact bounds.
        const padding = 2;
        const rw = CONFIG.BULLET_SIZE * 2.8;
        const rh = CONFIG.BULLET_SIZE * 0.7;
        const w = Math.ceil(rw * 2) + padding * 2;
        const h = Math.ceil(rh * 2) + padding * 2;
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        
        const cx = w / 2;
        const cy = h / 2;
        
        ctx.fillStyle = outerColor;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = innerColor;
        ctx.beginPath();
        ctx.ellipse(cx, cy, CONFIG.BULLET_SIZE * 1.8, CONFIG.BULLET_SIZE * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        return c;
    },

    createMissileSprite: function() {
        // bounds: x from -6 to 6, y from -3.5 to 3.5
        const w = 20;
        const h = 20;
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        const cx = w / 2;
        const cy = h / 2;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = '#fff';
        // 四角部分 (■)
        ctx.fillRect(-6, -2.5, 5, 5);
        // 三角部分 (▲)
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-1, -3.5);
        ctx.lineTo(-1, 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        return c;
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
    },

    createEnemyMothership: function (isFlash = false) {
        const w = 400;
        const h = 200;
        const cx = 150;
        const cy = 100;

        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        
        ctx.save();
        ctx.translate(cx, cy);

        // センサーアンテナ
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-50, 60);
        ctx.lineTo(-30, 100);
        ctx.lineTo(20, 100);
        ctx.stroke();
        // アンテナ先端
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(20, 100, 4, 0, Math.PI * 2);
        ctx.fill();

        // 外周構造
        ctx.fillStyle = isFlash ? '#fff' : '#0a0a0a';
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-120, -70);
        ctx.lineTo(40, -70);
        ctx.lineTo(80, -40);
        ctx.lineTo(80, 40);
        ctx.lineTo(40, 70);
        ctx.lineTo(-120, 70);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 居住区の窓明かり
        if (!isFlash) {
            ctx.fillStyle = '#ff2222';
            ctx.globalAlpha = 0.8;
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(-100 + i * 25, -62, 8, 4);
                ctx.fillRect(-100 + i * 25, 58, 8, 4);
            }
            ctx.globalAlpha = 1.0;
        }

        // 補助モジュール
        ctx.fillStyle = isFlash ? '#fff' : '#111';
        ctx.fillRect(-80, -90, 60, 20);
        ctx.strokeRect(-80, -90, 60, 20);
        ctx.fillRect(-100, 70, 80, 25);
        ctx.strokeRect(-100, 70, 80, 25);

        // 中央コア
        ctx.fillStyle = '#1a0000';
        ctx.beginPath();
        ctx.arc(-20, 0, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f00';
        ctx.lineWidth = 3;
        ctx.stroke();

        // コアの発光
        if (!isFlash) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
            ctx.beginPath();
            ctx.arc(-20, 0, 38, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f00';
            ctx.beginPath();
            ctx.arc(-20, 0, 15, 0, Math.PI * 2);
            ctx.fill();
        }

        // 発着ドック (カタパルト)
        const catW = 150;
        const catH = 75; // CONFIG.PLAYER_SIZE_W * 2.5
        ctx.fillStyle = '#050505';
        ctx.fillRect(80, -catH / 2, catW, catH);
        ctx.strokeStyle = '#f00';
        ctx.lineWidth = 1;
        ctx.strokeRect(80, -catH / 2, catW, catH);

        if (!isFlash) {
            // カタパルト上の誘導ライン
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.moveTo(80, 0);
            ctx.lineTo(80 + catW, 0);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // ドックのゲート発光
            ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
            ctx.fillRect(80, -catH / 2, 10, catH);
        }

        // エンジン部
        ctx.fillStyle = '#000';
        ctx.fillRect(-140, -30, 20, 60);
        if (!isFlash) {
            ctx.fillStyle = 'rgba(255, 50, 0, 0.6)';
            ctx.beginPath();
            ctx.ellipse(-145, 0, 10, 25, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
        return c;
    },

    createAlliedMothership: function () {
        const w = 400;
        const h = 200;
        const cx = 150;
        const cy = 100;

        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        
        ctx.save();
        ctx.translate(cx, cy);

        // わずかな非対称性を持たせるため、片側にセンサーアンテナを追加
        ctx.strokeStyle = '#556677';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-50, 60);
        ctx.lineTo(-30, 100);
        ctx.lineTo(20, 100);
        ctx.stroke();
        // アンテナ先端
        ctx.fillStyle = '#556677'; // 平均的な色で固定
        ctx.beginPath();
        ctx.arc(20, 100, 4, 0, Math.PI * 2);
        ctx.fill();

        // 外周構造 (防御・損傷状態の可視化領域)
        ctx.fillStyle = '#1a1f24';
        ctx.strokeStyle = '#334455';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-120, -70);
        ctx.lineTo(40, -70);
        ctx.lineTo(80, -40);
        ctx.lineTo(80, 40);
        ctx.lineTo(40, 70);
        ctx.lineTo(-120, 70);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 居住区の窓明かり（中に人がいる気配）
        ctx.fillStyle = '#ffffaa';
        ctx.globalAlpha = 0.8;
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-100 + i * 25, -62, 8, 4);
            ctx.fillRect(-100 + i * 25, 58, 8, 4);
        }
        ctx.globalAlpha = 1.0;

        // 補助モジュール1 (上側)
        ctx.fillStyle = '#222d36';
        ctx.fillRect(-80, -90, 60, 20);
        ctx.strokeRect(-80, -90, 60, 20);
        // 補助モジュール2 (下側・少し形状を変えて非対称に)
        ctx.fillRect(-100, 70, 80, 25);
        ctx.strokeRect(-100, 70, 80, 25);

        // 中央コア (生命維持・システム中枢)
        ctx.fillStyle = '#0f141a';
        ctx.beginPath();
        ctx.arc(-20, 0, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // コアの発光 (平均的な脈動状態)
        ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(-20, 0, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0ff';
        ctx.beginPath();
        ctx.arc(-20, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        // 発着ドック (カタパルト) - 横幅を2.5倍に拡大
        const catW = 150;
        const catH = 75; // CONFIG.PLAYER_SIZE_W * 2.5
        ctx.fillStyle = '#111';
        ctx.fillRect(80, -catH / 2, catW, catH);
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(80, -catH / 2, catW, catH);

        // カタパルト上の誘導ライン (発光)
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(80, 0);
        ctx.lineTo(80 + catW, 0);
        ctx.stroke();
        ctx.setLineDash([]);

        // ドックのゲート発光
        ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
        ctx.fillRect(80, -catH / 2, 10, catH);

        // エンジン部 (後方)
        ctx.fillStyle = '#111';
        ctx.fillRect(-140, -30, 20, 60);
        // エンジン発光
        ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-145, 0, 10, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        // 機体名のペイント
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = 'bold 20px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.save();
        ctx.rotate(Math.PI / 2);
        ctx.fillText('A.GARAGE', 0, 90);
        ctx.restore();

        ctx.restore();
        return c;
    }
};
