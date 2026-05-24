function drawOverlay(ctx, GAME) {
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
