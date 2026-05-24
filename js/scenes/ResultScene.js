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
                    msg = "2分オーバーの長期戦、お疲れ様です！ 無傷なんてさすがですね！";
                } else {
                    msg = "お疲れ様です。今回は修理費ゼロ、完璧な仕事ですね！";
                }
            } else {
                if (operationTime >= 120 && damageTaken >= 150) {
                    msg = "残業お疲れ様ですが、残業手当はありません。でも修理費はいただきますよ？";
                } else {
                    msg = "帰還お疲れ様です。修理は任せてください。お疲れ様でした！";
                }
            }
        } else {
            if (operationTime <= 30 && netProfit < 0) {
                msg = "派手にやられちゃいましたね。今月は赤字ですよ？";
            } else {
                msg = "傭兵さん、生きててよかったです！ でも修理費で赤字かも……";
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

        const mouse = InputManager.getMouse();

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


}
