function drawHUD(ctx, GAME, playerStats, player, entities, CONFIG) {
    if (GAME.state === 'LEVEL_UP') {
        ctx.fillStyle = 'rgba(5, 5, 16, 0.75)';
        ctx.fillRect(0, 0, GAME.width, GAME.height);

        const cardW = 260;
        const cardH = 340;
        const gap = 40;
        const totalW = cardW * 3 + gap * 2;
        const startX = (GAME.width - totalW) / 2;
        const startY = GAME.height * 0.35;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('=== LEVEL UP ===', GAME.width / 2, GAME.height * 0.16);

        ctx.fillStyle = '#0ff';
        ctx.font = 'bold 16px Courier New';
        ctx.fillText('SELECT AN UPGRADE TO REINFORCE THE HULL', GAME.width / 2, GAME.height * 0.22);

        // 借金差し押さえの特別表示
        if (GAME.credits < 0) {
            ctx.fillStyle = '#f33';
            ctx.font = 'bold 22px Courier New';
            ctx.fillText('WARNING: DEBT OUTSTANDING. UPGRADE PROTOCOLS SEIZED.', GAME.width / 2, GAME.height * 0.28);
            if (Math.floor(Date.now() / 400) % 2 === 0) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px Courier New';
                ctx.fillText('PRESS ENTER OR SPACE TO ABORT PROTOCOL', GAME.width / 2, GAME.height * 0.85);
            }

            for (let i = 0; i < 3; i++) {
                const cardX = startX + i * (cardW + gap);
                ctx.save();

                ctx.fillStyle = 'rgba(60, 20, 20, 0.9)';
                ctx.strokeStyle = '#f33';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.rect(cardX, startY, cardW, cardH);
                ctx.fill();
                ctx.stroke();

                ctx.translate(cardX + cardW / 2, startY + cardH / 2);
                ctx.rotate(-Math.PI / 12);
                ctx.fillStyle = '#f33';
                ctx.strokeStyle = '#f33';
                ctx.lineWidth = 3;
                ctx.font = 'bold 26px Courier New';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.strokeRect(-110, -25, 220, 50);
                ctx.fillText('SEIZED BY', 0, -10);
                ctx.fillText('UNION', 0, 12);

                ctx.restore();
            }
        } else {
            for (let i = 0; i < 3; i++) {
                const card = GAME.levelUpCards[i];
                if (!card) continue;

                const isSelected = (GAME.levelUpState === 'CHOOSING' && GAME.levelUpSelectedIndex === i) ||
                    (GAME.levelUpState === 'DECIDED' && GAME.levelUpDecidedIndex === i);

                ctx.save();

                let x = startX + i * (cardW + gap);
                let y = startY;
                let scale = 1.0;

                if (GAME.levelUpState === 'DECIDED') {
                    if (isSelected) {
                        const progress = (45 - GAME.levelUpDecidedTimer) / 45;
                        const targetCenterX = GAME.width / 2 - cardW / 2;
                        const targetCenterY = GAME.height * 0.4 - cardH / 2;
                        x = x + (targetCenterX - x) * Math.min(progress * 1.5, 1.0);
                        y = y + (targetCenterY - y) * Math.min(progress * 1.5, 1.0);
                        scale = 1.0 + Math.min(progress * 2.0, 1.0) * 0.5;
                    } else {
                        y += GAME.levelUpNonSelectedY * GAME.levelUpNonSelectedY * 0.05;
                        ctx.globalAlpha = Math.max(0, 1.0 - (GAME.levelUpNonSelectedY / 20));
                    }
                } else {
                    if (isSelected) {
                        scale = 1.05;
                        y -= 5;
                    }
                }

                ctx.translate(x + cardW / 2, y + cardH / 2);
                ctx.scale(scale, scale);
                ctx.translate(-cardW / 2, -cardH / 2);

                const nextLvl = (playerStats.upgrades[card.id] || 0) + 1;
                const isLimitBurst = nextLvl === 6;

                let cardBgColor = isSelected ? 'rgba(0, 40, 50, 0.95)' : 'rgba(15, 20, 30, 0.85)';
                let cardStrokeColor = isSelected ? (Math.floor(Date.now() / 100) % 2 === 0 ? '#fff' : (card.categoryColor || '#0ff')) : (card.categoryColor || '#334455');
                let titleColor = isSelected ? '#0ff' : '#888';
                let descColor = isSelected ? '#fff' : '#aaa';

                if (isLimitBurst) {
                    cardBgColor = isSelected ? 'rgba(60, 10, 10, 0.95)' : 'rgba(30, 5, 5, 0.85)';
                    cardStrokeColor = isSelected ? (Math.floor(Date.now() / 80) % 2 === 0 ? '#ff0' : '#f00') : '#a00';
                    titleColor = isSelected ? '#ff0' : '#f88';
                    descColor = isSelected ? '#fff' : '#fbb';
                }

                ctx.fillStyle = cardBgColor;
                ctx.strokeStyle = cardStrokeColor;
                ctx.lineWidth = isSelected ? (isLimitBurst ? 4 : 3) : 1.5;
                ctx.beginPath();
                ctx.rect(0, 0, cardW, cardH);
                ctx.fill();
                ctx.stroke();

                if (isSelected) {
                    const grad = ctx.createRadialGradient(cardW / 2, cardH / 2, 10, cardW / 2, cardH / 2, cardW * 0.8);
                    if (isLimitBurst) {
                        grad.addColorStop(0, 'rgba(255, 50, 0, 0.15)');
                        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    } else {
                        grad.addColorStop(0, 'rgba(0, 255, 255, 0.08)');
                        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    }
                    ctx.fillStyle = grad;
                    ctx.fillRect(1, 1, cardW - 2, cardH - 2);
                }

                if (isLimitBurst) {
                    ctx.fillStyle = '#f00';
                    ctx.font = 'bold 14px Courier New';
                    ctx.textAlign = 'center';
                    // Blink effect for LIMIT BURST text
                    if (Math.floor(Date.now() / 150) % 2 === 0) {
                        ctx.fillText('>>> LIMIT BURST <<<', cardW / 2, 20);
                    }
                }

                ctx.fillStyle = titleColor;
                ctx.font = 'bold 20px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText(card.name, cardW / 2, 45);

                ctx.strokeStyle = cardStrokeColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(30, 60);
                ctx.lineTo(cardW - 30, 60);
                ctx.stroke();

                ctx.fillStyle = descColor;
                ctx.font = 'bold 13px Courier New';
                ctx.textAlign = 'center';

                // Wrap text manually or use existing logic (here we use simple multi-line if needed, but previously it was just single fillText)
                const descLines = card.description.split('\\n');
                for (let j = 0; j < descLines.length; j++) {
                    ctx.fillText(descLines[j], cardW / 2, 100 + j * 20);
                }

                ctx.restore();
            }

            if (GAME.levelUpState !== 'DECIDED' || GAME.levelUpDecidedTimer > 15) {
                const hoverOffset = Math.sin(GAME.levelUpCursorHoverTimer * 0.08) * 8;
                let curY = startY - 25 + hoverOffset;

                if (GAME.levelUpState === 'DECIDED') {
                    const progress = (45 - GAME.levelUpDecidedTimer) / 30;
                    const targetY = startY + 20;
                    curY = curY + (targetY - curY) * Math.min(progress, 1.0);
                }

                ctx.save();
                ctx.fillStyle = '#0ff';
                ctx.beginPath();
                ctx.moveTo(GAME.levelUpCursorX, curY + 12);
                ctx.lineTo(GAME.levelUpCursorX - 10, curY);
                ctx.lineTo(GAME.levelUpCursorX + 10, curY);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            entities.particles.forEach(p => {
                if (p.type === 'LEVEL_UP_HIT_PARTICLE') {
                    ctx.save();
                    ctx.globalAlpha = p.life;
                    ctx.fillStyle = '#0ff';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
        }
    } else {
        if (typeof Radar !== 'undefined') {
            Radar.draw(ctx, player, entities, CONFIG, GAME);
        }
        
        if (typeof MapManager !== 'undefined') {
            MapManager.draw(ctx, player, entities, CONFIG, GAME);
        }

        if (GAME.state === 'PLAYING' && !GAME.isPlayerDying) {
            ctx.save();
            ctx.translate(GAME.width / 2 - player.x, GAME.height / 2 - player.y);
            if (typeof HUDManager !== 'undefined') {
                HUDManager.draw(ctx, player, GAME);
            }
            ctx.restore();
        }
    }
}
