// js/scenes/TitleScene.js

class TitleScene {
    update() {
        // 背景の星をゆっくり上から下へスクロール
        stars.forEach(s => {
            s.y += s.layer.rate * 0.5;
            if (s.y > GAME.height) {
                s.y = 0;
                s.x = Math.random() * GAME.width;
            }
        });

        // 遠景爆発の更新（古いパーティクルの削除、flavor爆発の更新）
        for (let i = entities.particles.length - 1; i >= 0; i--) {
            let p = entities.particles[i];
            if (p.type === 'TITLE_FLAVOR_EXP') {
                p.life -= 0.02;
                if (p.life <= 0) entities.particles.splice(i, 1);
            }
        }

        // タイトル中のFlavor爆発の更新処理
        for (let i = entities.explosions.length - 1; i >= 0; i--) {
            let exp = entities.explosions[i];
            if (exp.isFlavor) {
                exp.timer--;
                if (exp.timer <= 0) {
                    entities.explosions.splice(i, 1);
                    continue;
                }
                const progress = 1 - (exp.timer / exp.maxTimer);
                if (progress < 0.2) exp.currentScale = progress / 0.2;
                else exp.currentScale = 1.0;
                if (progress >= 0.2 && progress < 0.9) {
                    exp.shakeX = (Math.random() - 0.5) * 4;
                    exp.shakeY = (Math.random() - 0.5) * 4;
                } else {
                    exp.shakeX = 0; exp.shakeY = 0;
                }
            }
        }

        // ランダムに遠景爆発フレーバーを発生
        if (Math.random() < 0.015) {
            const ex = Math.random() * GAME.width;
            const ey = Math.random() * GAME.height;
            const sizeMult = 0.5 + Math.random() * 1.5;
            const durMult = 0.5 + Math.random() * 1.5;
            spawnExplosion(ex, ey, false, true, sizeMult, durMult);
        }

        // タイトルプレイヤー機のトレイル履歴の更新
        if (!GAME.titleLeftTrailHistory) GAME.titleLeftTrailHistory = [];
        if (!GAME.titleRightTrailHistory) GAME.titleRightTrailHistory = [];

        // タイトル開始時の初期座標飛び出しを防ぐ
        if (GAME.titleShipY === 0) {
            GAME.titleShipY = GAME.height * 0.7;
        }

        // 既存の履歴ポイントを後方（下）へ流す
        const trailFlowSpeed = GAME.titleLaunchTimer > 0 ? 8 + GAME.titleShipVy : 3;
        GAME.titleLeftTrailHistory.forEach(pt => pt.y += trailFlowSpeed);
        GAME.titleRightTrailHistory.forEach(pt => pt.y += trailFlowSpeed);

        const isTitleThrusting = true;
        const isTitleBoosting = GAME.titleLaunchTimer > 0;

        const backX = GAME.width / 2;
        const backY = GAME.titleShipY + (CONFIG.PLAYER_SIZE_W || 30) / 2;
        const offsetDist = 5;

        const leftNozzleX = backX - offsetDist;
        const leftNozzleY = backY;
        const rightNozzleX = backX + offsetDist;
        const rightNozzleY = backY;

        GAME.titleLeftTrailHistory.push({ x: leftNozzleX, y: leftNozzleY, active: isTitleThrusting, boost: isTitleBoosting });
        GAME.titleRightTrailHistory.push({ x: rightNozzleX, y: rightNozzleY, active: isTitleThrusting, boost: isTitleBoosting });

        const maxTitleTrailLen = 25;
        if (GAME.titleLeftTrailHistory.length > maxTitleTrailLen) GAME.titleLeftTrailHistory.shift();
        if (GAME.titleRightTrailHistory.length > maxTitleTrailLen) GAME.titleRightTrailHistory.shift();

        // 出撃決定演出の更新
        if (GAME.titleLaunchTimer > 0) {
            GAME.titleLaunchTimer++;
            GAME.titleSortieTextTimer = (GAME.titleSortieTextTimer || 0) + 1;

            if (GAME.titleLaunchTimer < 105) {
                // 自機の上昇 (Ease-In) 105フレームまで継続
                GAME.titleShipVy += 0.8; // 加速
                GAME.titleShipY -= GAME.titleShipVy;
            }

            // 45フレームかけて黒へフェードアウト
            if (GAME.titleLaunchTimer <= 45) {
                GAME.fadeAlpha = GAME.titleLaunchTimer / 45;
            } else {
                GAME.fadeAlpha = 1.0; // 暗転したまま待機
            }

            // 45フレーム（フェードアウト）＋60フレーム（1秒待機）＝ 105フレーム
            if (GAME.titleLaunchTimer >= 105) {
                // 出撃演出完了、PLAYINGに遷移！
                resetGame();
                GAME.state = 'PLAYING';
                GAME.launchSequence = true;
                GAME.launchTimer = 0;
                GAME.fadeAlpha = 1.0; // プレイ画面へのフェードイン開始値

                // タイトルで残った履歴もリセット
                GAME.titleLeftTrailHistory = [];
                GAME.titleRightTrailHistory = [];
                player.leftTrailHistory = [];
                player.rightTrailHistory = [];
                player.leftWindTrailHistory = [];
                player.rightWindTrailHistory = [];
            }
        } else {
            // 通常待機状態での自機座標
            GAME.titleShipY = GAME.height * 0.7; // 画面下部70%の位置
            GAME.titleShipVy = 0;
            GAME.fadeAlpha = 0;
        }
    }

    draw(ctx) {
        const contentAlpha = Math.max(0, 1.0 - (GAME.fadeAlpha || 0));

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
    }
}
