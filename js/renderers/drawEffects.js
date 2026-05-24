function drawEffects(ctx, player, entities, SpriteCache, layer = 'all') {
    if (layer === 'all' || layer === 'background') {
        entities.gems.forEach(g => {
            let sprite = SpriteCache.gem;
            if (g.kind === 'HEAL') sprite = SpriteCache.gemHeal;
            if (g.kind === 'BIG_EXP') sprite = SpriteCache.gemBigExp;
            const drawSize = sprite.width;
            ctx.drawImage(sprite, g.x - drawSize / 2, g.y - drawSize / 2);
        });

        // パーティクル・デブリの描画 (背景レイヤー)
        if (typeof EffectManager !== 'undefined') {
            EffectManager.draw(ctx, entities, 'background');
        }

        // 敵の弾描画 (スプライト使用)
        entities.enemyBullets.forEach(b => {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(Math.atan2(b.vy, b.vx));
            ctx.drawImage(SpriteCache.enemyBulletLaser, -SpriteCache.enemyBulletLaser.width / 2, -SpriteCache.enemyBulletLaser.height / 2);
            ctx.restore();
        });

        // 自機の弾描画 (スプライト使用)
        entities.bullets.forEach(b => {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(Math.atan2(b.vy, b.vx));
            ctx.drawImage(SpriteCache.playerBullet, -SpriteCache.playerBullet.width / 2, -SpriteCache.playerBullet.height / 2);
            ctx.restore();
        });

        // ミサイル描画 (スプライト使用)
        entities.missiles.forEach(m => {
            ctx.save();
            ctx.translate(m.x, m.y);
            ctx.rotate(m.angle);
            ctx.drawImage(SpriteCache.missile, -SpriteCache.missile.width / 2, -SpriteCache.missile.height / 2);
            ctx.restore();
        });

        // 自機のスラスター描画
        if (typeof GAME !== 'undefined' && !GAME.isPlayerDying) {
            drawRibbonTrail(player.leftTrailHistory, '#00d2ff', 7);
            drawRibbonTrail(player.rightTrailHistory, '#00d2ff', 7);
        }

        drawWindTrail(player.leftWindTrailHistory);
        drawWindTrail(player.rightWindTrailHistory);

        // 敵機のスラスター描画
        entities.enemies.forEach(e => {
            let color = '#0088ff';
            if (typeof CONFIG !== 'undefined') {
                color = CONFIG.COLOR_ENEMY_DOGFIGHTER;
                if (e.personality === 'RAMMER') color = CONFIG.COLOR_ENEMY_RAMMER;
                if (e.personality === 'SNIPER') color = CONFIG.COLOR_ENEMY_SNIPER;
            }
            drawRibbonTrail(e.trailHistory, color, 5);
        });
    }

    if (layer === 'all' || layer === 'foreground') {
        // 爆発の描画 (前面レイヤー)
        if (typeof EffectManager !== 'undefined') {
            EffectManager.draw(ctx, entities, 'foreground');
        }
    }
}
