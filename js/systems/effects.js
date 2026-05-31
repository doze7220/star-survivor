/**
 * EffectManager
 * 
 * パーティクルやデブリ、爆発エフェクトなどの状態更新と描画を担当するモジュール。
 * 衝突判定やダメージなどのゲームロジックは main.js で処理し、
 * ここでは視覚的な演出のみを管理する。
 */
const EffectManager = {
    /**
     * エフェクトの状態更新
     * @param {Object} entities 
     */
    update: function (entities) {
        // パーティクルの更新 (物理演算やダメージを伴わない純粋な視覚エフェクト)
        for (let i = entities.particles.length - 1; i >= 0; i--) {
            let p = entities.particles[i];
            p.update();
            if (p.life <= 0) entities.particles.splice(i, 1);
        }
    },

    /**
     * エフェクトの描画
     * レイヤー指定により描画順序（Zオーダー）を維持する
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} entities 
     * @param {string} layer 'background' (機体より下) または 'foreground' (機体より上)
     */
    draw: function (ctx, entities, layer = 'all') {
        if (layer === 'background' || layer === 'all') {
            // パーティクルの描画
            entities.particles.forEach(p => {
                ctx.save();
                ctx.translate(p.x, p.y);
                if (p.type === 'DEBRIS_SMOKE') {
                    // 半透明の煙（灰色の●で表現、拡大しながら薄れて消える）
                    const progress = 1.0 - (p.life / p.maxLife); // 0.0 〜 1.0
                    const scale = 1.0 + progress * 1.0; // 1倍から2倍へ拡大
                    ctx.globalAlpha = Math.max(0, p.life);
                    ctx.scale(scale, scale);
                    ctx.fillStyle = '#888'; // 灰色
                    ctx.beginPath();
                    ctx.arc(0, 0, p.baseSize / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.type === 'SMOKE') {
                    ctx.globalAlpha = Math.max(0, p.life);
                    const scale = Math.max(0.1, p.life);
                    ctx.scale(scale, scale);
                    ctx.fillStyle = p.color || '#fff';
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.globalAlpha = Math.max(0, p.life);
                    const scale = Math.max(0.1, p.life);
                    ctx.scale(scale, scale);
                    ctx.drawImage(SpriteCache.particlePlayer, -SpriteCache.particlePlayer.width / 2, -SpriteCache.particlePlayer.height / 2);
                }
                ctx.restore();
            });
            ctx.globalAlpha = 1.0;

            // デブリ（破片）の描画（最後の30%でフェードアウト）
            entities.debris.forEach(d => {
                ctx.fillStyle = d.color;
                ctx.globalAlpha = Math.min(1.0, d.life / 0.3);
                ctx.fillRect(d.x - d.size / 2, d.y - d.size / 2, d.size, d.size);
            });
            ctx.globalAlpha = 1.0;
        }

        if (layer === 'foreground' || layer === 'all') {
            // 爆発の描画 (共通関数を利用)
            entities.explosions.forEach(exp => {
                drawExplosion(ctx, exp);
            });
        }
    }
};
