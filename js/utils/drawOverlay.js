function drawOverlay(ctx, GAME) {
    if (GAME.state === 'TITLE') {
        const contentAlpha = Math.max(0, 1.0 - (GAME.fadeAlpha || 0));

        // 完全に不透明な専用背景を敷いて下層を隠す
        ctx.fillStyle = '#000510';
        ctx.fillRect(0, 0, GAME.width, GAME.height);

        // Title専用の星屑背景の描画
        if (GAME.titleStars) {
            GAME.titleStars.forEach(s => {
                ctx.save();
                ctx.globalAlpha = (s.isBlinking ? s.alpha : s.baseAlpha) * contentAlpha;
                ctx.fillStyle = s.color;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }

        // 遠景爆発の描画（古いパーティクル版）
        entities.particles.forEach(p => {
            if (p.type === 'TITLE_FLAVOR_EXP') {
                ctx.save();
                ctx.globalAlpha = p.life * 0.5 * contentAlpha;
                ctx.strokeStyle = '#f80';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                const lines = 8;
                const r = p.size * (1 - p.life * 0.5);
                for (let i = 0; i < lines; i++) {
                    const a = (Math.PI * 2 / lines) * i;
                    ctx.moveTo(p.x + Math.cos(a) * (r * 0.3), p.y + Math.sin(a) * (r * 0.3));
                    ctx.lineTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r);
                }
                ctx.stroke();
                ctx.restore();
            }
        });

        // 新しいFlavor爆発の描画
        ctx.save();
        ctx.globalAlpha = contentAlpha;
        entities.explosions.forEach(exp => {
            if (exp.isFlavor) {
                drawExplosion(ctx, exp);
            }
        });
        ctx.restore();

        // ─── メインロゴ (タイポグラフィ強化版) ───
        {
            const logoY = GAME.height * 0.25;
            const mainFont = 'bold 54px Courier New';
            const vFont = 'bold 70px Courier New';

            ctx.font = vFont;
            const vW = ctx.measureText('V').width;
            ctx.font = mainFont;
            const anguarW = ctx.measureText('ANGUAR').width;
            const dW = ctx.measureText('D').width;
            const rifterW = ctx.measureText('RIFTER').width;

            const totalW = vW + anguarW + dW + rifterW;
            let curX = GAME.width / 2 - totalW / 2;

            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            // V
            ctx.save();
            ctx.globalAlpha = contentAlpha;
            ctx.font = vFont;
            ctx.fillStyle = '#0ff';
            ctx.shadowColor = '#0ff';
            ctx.shadowBlur = 22;
            ctx.fillText('V', curX, logoY);
            ctx.restore();
            curX += vW;

            // ANGUAR
            ctx.save();
            ctx.globalAlpha = contentAlpha;
            ctx.font = mainFont;
            ctx.fillStyle = '#0ff';
            ctx.shadowColor = '#0ff';
            ctx.shadowBlur = 18;
            ctx.fillText('ANGUAR', curX, logoY);
            ctx.restore();
            curX += anguarW;

            // D (色収差)
            const aberOffset = 5;
            ctx.font = mainFont;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.save();
            ctx.globalAlpha = 0.55 * contentAlpha;
            ctx.fillStyle = '#ff00ff';
            ctx.shadowBlur = 0;
            ctx.fillText('D', curX - aberOffset, logoY - aberOffset);
            ctx.restore();
            ctx.save();
            ctx.globalAlpha = 0.55 * contentAlpha;
            ctx.fillStyle = '#ff0044';
            ctx.shadowBlur = 0;
            ctx.fillText('D', curX + aberOffset, logoY + aberOffset);
            ctx.restore();
            ctx.save();
            ctx.globalAlpha = contentAlpha;
            ctx.fillStyle = '#0ff';
            ctx.shadowColor = '#0ff';
            ctx.shadowBlur = 18;
            ctx.fillText('D', curX, logoY);
            ctx.restore();
            curX += dW;

            // RIFTER
            ctx.save();
            ctx.globalAlpha = contentAlpha;
            ctx.font = mainFont;
            ctx.fillStyle = '#0ff';
            ctx.shadowColor = '#0ff';
            ctx.shadowBlur = 18;
            ctx.fillText('RIFTER', curX, logoY);
            ctx.restore();
        }

        // サブタイトル
        ctx.save();
        ctx.globalAlpha = contentAlpha;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('- STELLAR WAR SURVIVOR -', GAME.width / 2, GAME.height * 0.32);

        // アルファ表記
        ctx.fillStyle = '#888';
        ctx.font = 'bold 14px Courier New';
        ctx.fillText('[ ALPHA VERSION ]', GAME.width / 2, GAME.height * 0.38);

        // 右下バージョン
        ctx.fillStyle = '#666';
        ctx.font = 'bold 12px Courier New';
        ctx.textAlign = 'right';
        ctx.fillText('v0.3.3 Alpha', GAME.width - 20, GAME.height - 20);

        // 出撃決定テキスト
        ctx.textAlign = 'center';
        if (GAME.titleLaunchTimer > 0) {
            if (Math.floor(Date.now() / 50) % 2 === 0) {
                ctx.fillStyle = '#fff';
            } else {
                ctx.fillStyle = '#0ff';
            }
            ctx.font = 'bold 24px Courier New';
            ctx.fillText('>>> SORTIE INITIATED <<<', GAME.width / 2, GAME.height * 0.52);
        } else {
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
                ctx.font = 'bold 20px Courier New';
                ctx.fillText('PRESS ANY BUTTON TO SORTIE', GAME.width / 2, GAME.height * 0.52);
            }
        }
        ctx.restore();

        // ----------------------------------------
        // タイトル画面フェードアウト処理 (自機以外を暗転)
        // ----------------------------------------
        if (GAME.fadeAlpha > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${GAME.fadeAlpha})`;
            ctx.fillRect(0, 0, GAME.width, GAME.height);
        }

        // タイトル画面の自機リボントレイル描画
        if (GAME.titleLeftTrailHistory && GAME.titleLeftTrailHistory.length > 0) {
            drawRibbonTrail(GAME.titleLeftTrailHistory, '#00d2ff', 7);
            drawRibbonTrail(GAME.titleRightTrailHistory, '#00d2ff', 7);
        }

        // 待機中の自機描画
        ctx.save();
        ctx.translate(GAME.width / 2, GAME.titleShipY);
        ctx.rotate(-Math.PI / 2); // 上向き
        ctx.drawImage(SpriteCache.player, -SpriteCache.player.width / 2, -SpriteCache.player.height / 2);
        ctx.restore();
        
        return;
    }

    if (GAME.state === 'RESULT') {
        const p = GAME.resultParams;
        if (!p) return;

        const cx = GAME.width / 2;
        const shakeX = GAME.resultShakeTimer > 0 ? (Math.random() - 0.5) * 8 : 0;
        const shakeY = GAME.resultShakeTimer > 0 ? (Math.random() - 0.5) * 8 : 0;

        // ダークブルー背景（下層を完全に隠す）
        ctx.fillStyle = 'rgba(0, 20, 40, 1.0)';
        ctx.fillRect(0, 0, GAME.width, GAME.height);

        ctx.save();
        ctx.translate(shakeX, shakeY);

        // ─── ヘッダー ───
        const headerY = GAME.height * 0.10;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 28px Courier New';
        if (p.isClear) {
            ctx.fillStyle = '#0ff';
            ctx.shadowColor = '#0ff';
            ctx.shadowBlur = 15;
            ctx.fillText('[ MISSION ACCOMPLISHED ]', cx, headerY);
        } else {
            ctx.fillStyle = '#ff0044';
            ctx.shadowColor = '#ff0044';
            ctx.shadowBlur = 15;
            ctx.fillText('[ MISSION FAILED ]', cx, headerY);
        }
        ctx.shadowBlur = 0;

        // 区切り線
        ctx.strokeStyle = p.isClear ? 'rgba(0,255,255,0.4)' : 'rgba(255,0,68,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 320, headerY + 25);
        ctx.lineTo(cx + 320, headerY + 25);
        ctx.stroke();

        // ─── 明細行 ───
        const lineStartY = GAME.height * 0.18;
        const lineH = 40;
        const labelX = cx - 30;
        const valueX = cx + 30;

        const fmtC = (v) => {
            const sign = v >= 0 ? '+' : '';
            return sign + v.toLocaleString() + ' C';
        };
        const fmtTime = (secs) => {
            const m = Math.floor(secs / 60).toString().padStart(2, '0');
            const s = (secs % 60).toString().padStart(2, '0');
            return m + ':' + s;
        };

        const lines = [
            { label: 'OPERATION TIME', value: fmtTime(p.operationTime), color: '#fff' },
            { label: 'BASE REWARD', value: fmtC(p.baseReward), color: '#0ff' },
            { label: `KILL BOUNTY  x${p.score}`, value: fmtC(p.bounty), color: '#0ff' },
            { label: 'TIME BONUS', value: fmtC(p.timeBonus), color: '#0ff' },
            { label: 'REPAIR COST', value: fmtC(-p.repairCost), color: '#ff0044' },
            { label: 'EMERGENCY RECOVERY FEE', value: fmtC(-p.emergencyFee), color: '#ff0044' },
        ];

        ctx.font = 'bold 17px Courier New';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < lines.length; i++) {
            if (i >= GAME.resultShowIndex) break;
            const ln = lines[i];
            const ly = lineStartY + i * lineH;
            ctx.textAlign = 'right';
            ctx.fillStyle = '#778899';
            ctx.fillText(ln.label + ' :', labelX, ly);
            ctx.textAlign = 'left';
            ctx.fillStyle = ln.color;
            ctx.fillText(ln.value, valueX, ly);
        }

        // ─── NET PROFIT ───
        if (GAME.resultShowIndex >= 6) {
            const netBaseY = lineStartY + lines.length * lineH + 10;

            ctx.strokeStyle = p.netProfit >= 0 ? 'rgba(0,255,255,0.4)' : 'rgba(255,0,68,0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - 320, netBaseY - 8);
            ctx.lineTo(cx + 320, netBaseY - 8);
            ctx.stroke();

            ctx.font = 'bold 14px Courier New';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#778899';
            ctx.fillText('NET PROFIT :', labelX, netBaseY + 20);
            ctx.textAlign = 'left';
            ctx.font = 'bold 34px Courier New';
            const profitColor = p.netProfit >= 0 ? '#0ff' : '#ff0044';
            ctx.fillStyle = profitColor;
            ctx.shadowColor = profitColor;
            ctx.shadowBlur = 12;
            ctx.fillText(fmtC(p.netProfit), valueX, netBaseY + 20);
            ctx.shadowBlur = 0;
        }

        // ─── シエロ通信（タイプライター） ───
        if (GAME.resultShowIndex >= 6 && GAME.resultSieloText) {
            const sieloY = GAME.height * 0.68;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 15px Courier New';
            ctx.fillStyle = '#00cc44';
            const shown = GAME.resultSieloText.substring(0, GAME.resultSieloShowCharCount);
            ctx.fillText('[ NAVI : シエロ ]  ' + shown, cx, sieloY);
        }

        // ─── スタンプ ───
        if (GAME.resultStampTimer > 0) {
            const stampY = lineStartY + lines.length * lineH * 0.55;
            ctx.save();
            ctx.translate(cx, stampY);
            ctx.rotate(-15 * Math.PI / 180);
            ctx.scale(GAME.resultStampScale, GAME.resultStampScale);

            const stampText = p.netProfit >= 0 ? '[ SETTLED ]' : '[ DEBT EXECUTED ]';
            const stampColor = p.netProfit >= 0 ? '#0ff' : '#ff0044';
            ctx.font = 'bold 44px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 0.82;
            ctx.strokeStyle = stampColor;
            ctx.lineWidth = 3 / Math.max(GAME.resultStampScale, 0.5);
            const tw = ctx.measureText(stampText).width;
            ctx.strokeRect(-tw / 2 - 12, -34, tw + 24, 68);
            ctx.fillStyle = stampColor;
            ctx.fillText(stampText, 0, 0);
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }

        // ─── 選択ボタン ───
        if (GAME.resultShowIndex >= 6) {
            const btnY1 = GAME.height * 0.77;
            const btnY2 = GAME.height * 0.84;
            const blink = Math.floor(Date.now() / 500) % 2 === 0;

            ctx.font = 'bold 18px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (GAME.resultSelection === 0) {
                ctx.fillStyle = blink ? '#fff' : '#0ff';
                ctx.fillText('[ > ]  RETURN TO GARAGE', cx, btnY1);
            } else {
                ctx.fillStyle = '#444';
                ctx.fillText('       RETURN TO GARAGE', cx, btnY1);
            }

            if (GAME.resultSelection === 1) {
                ctx.fillStyle = blink ? '#fff' : '#0ff';
                ctx.fillText('[ > ]  RETRY MISSION', cx, btnY2);
            } else {
                ctx.fillStyle = '#444';
                ctx.fillText('       RETRY MISSION', cx, btnY2);
            }

            // 操作ヒント
            ctx.font = 'bold 12px Courier New';
            ctx.fillStyle = 'rgba(100,150,180,0.6)';
            ctx.fillText('W/S or ↑↓ : SELECT    ENTER or SPACE : CONFIRM', cx, GAME.height * 0.91);
        }

        ctx.restore(); // shake 終了
        return;
    }

    // ----------------------------------------
    // 被弾時の画面全体赤フラッシュ演出
    // ----------------------------------------
    if (GAME.damageFlashTimer > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${(GAME.damageFlashTimer / CONFIG.FLASH_DURATION) * 0.4})`;
        ctx.fillRect(0, 0, GAME.width, GAME.height);
        GAME.damageFlashTimer--;
    }

    // ----------------------------------------
    // 発進シーケンスの Canvas ベクターカウントダウン描画
    // ----------------------------------------
    if (GAME.launchSequence && GAME.launchTimer <= 240) {
        let currentText = "";
        let frameInCycle = 0;

        if (GAME.launchTimer <= 60) {
            currentText = "3";
            frameInCycle = GAME.launchTimer;
        } else if (GAME.launchTimer <= 120) {
            currentText = "2";
            frameInCycle = GAME.launchTimer - 60;
        } else if (GAME.launchTimer <= 180) {
            currentText = "1";
            frameInCycle = GAME.launchTimer - 120;
        } else if (GAME.launchTimer <= 240) {
            currentText = "GO!";
            frameInCycle = GAME.launchTimer - 180;
        }

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let opacity = 1.0;
        let fontSize = 150;

        if (frameInCycle <= 48) {
            const p = frameInCycle / 48;
            fontSize = 200 - 50 * p; // スケールダウンしながら出現
            opacity = p;
        } else {
            const p = (frameInCycle - 48) / 12;
            fontSize = 150;
            opacity = 1.0 - p; // 急速にフェードアウト
        }

        // ネオンシアンのグローエフェクト
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 30;
        ctx.fillStyle = `rgba(0, 255, 255, ${opacity})`;
        ctx.font = `bold ${fontSize}px Courier New`;
        ctx.fillText(currentText, GAME.width / 2, GAME.height / 2);

        ctx.restore();
    }

    // ----------------------------------------
    // 画面全体のフェード処理
    // ----------------------------------------
    if (GAME.fadeAlpha > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${GAME.fadeAlpha})`;
        ctx.fillRect(0, 0, GAME.width, GAME.height);
    }
}
