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


}
