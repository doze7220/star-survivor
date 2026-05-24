// js/scenes/ResultScene.js

class ResultScene {
    init(isClear) {
        GAME.state = 'RESULT';
        GAME.isResultTriggered = true;

        const score = GAME.killCount;
        const damageTaken = Math.floor(GAME.damageTaken);
        const operationTime = GAME.operationTime;

        // 経費精算計算
        const baseReward = isClear ? 5000 : 0;
        const bounty = score * 100;
        const timeBonus = isClear ? Math.max(0, 180 - operationTime) * 10 : 0; // 180秒以内なら秒あたり10C

        const revenue = baseReward + bounty + timeBonus;

        const repairCost = damageTaken * 1;
        const emergencyFee = !isClear ? Math.floor(revenue * 0.3) : 0; // 撃墜・途中撤退時は総収入の30%

        const expenses = repairCost + emergencyFee;
        const netProfit = revenue - expenses;

        // 累積クレジットへの反映
        GAME.credits += netProfit;

        // シエロの通信傍受テキスト確定
        let msg = "";
        if (isClear) {
            if (damageTaken === 0) {
                if (operationTime >= 120) {
                    msg = "2分オーバーの長期戦、お疲れ様です！ 無傷なんてさすがですねー！";
                } else {
                    msg = "お疲れ様ですー。今回は修理費ゼロ、完璧な仕事ですね！";
                }
            } else {
                if (operationTime >= 120 && damageTaken >= 150) {
                    msg = "あちゃー、欲張って残業するからですよー。はい、回収費と修理費、ドーンと引かせていただきますねー。";
                } else {
                    msg = "あー、帰還お疲れ様です。結構機体がボロボロですねぇ……。修理費、引かせていただきますねー。";
                }
            }
        } else {
            if (operationTime <= 30 && netProfit < 0) {
                msg = "あちゃー、派手にやられましたね。今月は赤字ですよ？ 死ぬ気で働いて返してくださいねー。";
            } else {
                msg = "傭兵さん、生きててよかったです！ でも修理費で赤字かも……次は気をつけてくださいね！";
            }
        }

        GAME.resultParams = {
            isClear: isClear,
            score: score,
            damageTaken: damageTaken,
            operationTime: operationTime,
            baseReward: baseReward,
            bounty: bounty,
            timeBonus: timeBonus,
            revenue: revenue,
            repairCost: repairCost,
            emergencyFee: emergencyFee,
            expenses: expenses,
            netProfit: netProfit
        };

        GAME.resultTimer = 0;
        GAME.resultShowIndex = 0;
        GAME.resultStampScale = 3.0;
        GAME.resultStampTimer = 0;
        GAME.resultShakeTimer = 0;

        GAME.resultSieloText = msg;
        GAME.resultSieloShowCharCount = 0;
        GAME.resultSieloTimer = 0;
        GAME.resultSelection = 0;
        GAME.resultSelectionBlink = 0;


        const creditsElem = document.getElementById('credits-panel');
        if (creditsElem) creditsElem.style.display = 'none';
        const cieloElem = document.getElementById('cielo-comm');
        if (cieloElem) cieloElem.style.display = 'none';
    }

    update() {
        GAME.resultTimer++;

        const targetIndex = Math.min(7, Math.floor(GAME.resultTimer / 30));
        if (GAME.resultShowIndex < targetIndex) {
            GAME.resultShowIndex = targetIndex;
        }

        if (GAME.resultShowIndex >= 6 && GAME.resultSieloShowCharCount < GAME.resultSieloText.length) {
            GAME.resultSieloTimer++;
            if (GAME.resultSieloTimer % 2 === 0) {
                GAME.resultSieloShowCharCount++;
            }
        }

        if (GAME.resultSieloShowCharCount >= GAME.resultSieloText.length && GAME.resultShowIndex >= 6) {
            if (GAME.resultStampTimer === 0) {
                GAME.resultStampTimer = 1;
            }
        }

        if (GAME.resultStampTimer > 0 && GAME.resultStampTimer < 12) {
            GAME.resultStampTimer++;
            const progress = GAME.resultStampTimer / 12;
            GAME.resultStampScale = 3.0 - progress * 2.0;

            if (GAME.resultStampTimer === 12) {
                GAME.resultShakeTimer = 15;
            }
        }

        if (GAME.resultShakeTimer > 0) {
            GAME.resultShakeTimer--;
        }

        GAME.resultSelectionBlink++;

        const btnW = 280;
        const btnH = 45;
        const btnX = GAME.width / 2 - btnW / 2;
        const btnY1 = GAME.height * 0.76;
        const btnY2 = GAME.height * 0.83;

        if (mouse.x >= btnX && mouse.x <= btnX + btnW) {
            if (mouse.y >= btnY1 && mouse.y <= btnY1 + btnH) {
                GAME.resultSelection = 0;
                if (mouse.leftDown) {
                    mouse.leftDown = false;
                    GAME.state = 'TITLE';
                    GAME.titleLaunchTimer = 0;
                    GAME.fadeAlpha = 0;
                    GAME.titleLeftTrailHistory = [];
                    GAME.titleRightTrailHistory = [];
                    player.leftTrailHistory = [];
                    player.rightTrailHistory = [];
                    player.leftWindTrailHistory = [];
                    player.rightWindTrailHistory = [];
                }
            } else if (mouse.y >= btnY2 && mouse.y <= btnY2 + btnH) {
                GAME.resultSelection = 1;
                if (mouse.leftDown) {
                    mouse.leftDown = false;
                    resetGame();
                    GAME.state = 'PLAYING';
                }
            }
        }
    }

    draw(ctx) {
        const p = GAME.resultParams;
        if (!p) return;

        const cx = GAME.width / 2;
        const shakeX = GAME.resultShakeTimer > 0 ? (Math.random() - 0.5) * 8 : 0;
        const shakeY = GAME.resultShakeTimer > 0 ? (Math.random() - 0.5) * 8 : 0;

        // ダークブルー背景
        ctx.fillStyle = 'rgba(0, 20, 40, 0.92)';
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
    }
}
