// js/map.js

const MapManager = {
    draw(ctx, player, entities, CONFIG, GAME) {
        if (GAME.state !== 'PLAYING' || GAME.launchSequence || player.isLandingSequence) return;
        const size = CONFIG.MINIMAP_SIZE;
        const margin = CONFIG.MINIMAP_MARGIN;
        const x = GAME.width - size - margin;
        const y = margin;

        ctx.save();
        ctx.translate(x, y);

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.fillRect(0, 0, size, size);
        ctx.strokeRect(0, 0, size, size);

        ctx.beginPath();
        ctx.rect(0, 0, size, size);
        ctx.clip();

        // グリッド描画
        const scale = CONFIG.MINIMAP_SCALE;
        const gridInterval = CONFIG.MINIMAP_GRID_INTERVAL;
        const viewSizeM = size * scale;
        const halfViewM = viewSizeM / 2;
        const startXM = player.x - halfViewM;
        const startYM = player.y - halfViewM;

        ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();

        const firstGridX = Math.floor(startXM / gridInterval) * gridInterval;
        for (let gx = firstGridX; gx < startXM + viewSizeM; gx += gridInterval) {
            const screenX = (gx - startXM) / scale;
            ctx.moveTo(screenX, 0);
            ctx.lineTo(screenX, size);
        }
        const firstGridY = Math.floor(startYM / gridInterval) * gridInterval;
        for (let gy = firstGridY; gy < startYM + viewSizeM; gy += gridInterval) {
            const screenY = (gy - startYM) / scale;
            ctx.moveTo(0, screenY);
            ctx.lineTo(size, screenY);
        }
        ctx.stroke();

        // 要素の描画ヘルパー
        const drawDot = (ex, ey, color, radius, isOutlineWhite = true) => {
            const sx = (ex - startXM) / scale;
            const sy = (ey - startYM) / scale;
            if (sx >= -radius && sx <= size + radius && sy >= -radius && sy <= size + radius) {
                ctx.fillStyle = color;
                if (isOutlineWhite) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 1;
                }
                ctx.beginPath();
                ctx.arc(sx, sy, radius, 0, Math.PI * 2);
                ctx.fill();
                if (isOutlineWhite) ctx.stroke();
            }
        };

        // 資源 (gems)
        entities.gems.forEach(g => {
            let c = '#aaa';
            if (g.kind === 'EXP') c = '#0ff';
            if (g.kind === 'BIG_EXP') c = '#ff0';
            if (g.kind === 'HEAL') c = '#0f0';
            drawDot(g.x, g.y, c, 1.5, false);
        });

        // 敵
        entities.enemies.forEach(e => {
            drawDot(e.x, e.y, e.color || '#f00', 2.5);
        });

        // 母艦
        drawDot(CONFIG.MOTHERSHIP_X, CONFIG.MOTHERSHIP_Y, '#000', 4);

        // 敵母艦
        if (entities.enemyMothership && !entities.enemyMothership.isDead) {
            drawDot(entities.enemyMothership.x, entities.enemyMothership.y, '#000', 4);
        }

        // 自機
        drawDot(player.x, player.y, '#0f0', 2.5);

        // 自機座標表示 (v0.5.00要件)
        ctx.restore(); // clip解除とtranslate解除

        ctx.save();
        ctx.translate(x, y + size - 20); // コンテナ下部

        // 背景黒帯
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(5, 0, size - 10, 18);

        ctx.font = 'bold 10px Courier New';
        ctx.fillStyle = '#0ff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // formatCoord は utils.js に存在するグローバル関数を利用
        ctx.fillText(`X: ${formatCoord(player.x)} Y: ${formatCoord(player.y)}`, size / 2, 9);

        ctx.restore();
    }
};
