const HUDManager = {
    update: function(playerStats, GAME) {
        // --- 画面右下 ステータスパネル更新 ---
        const shotsPerSec = (60 / playerStats.fireRate).toFixed(1);

        const statsHtml = `
                <div class="stat-category">
                    <div class="stat-category-title">// HULL</div>
                    <div class="stat-row">
                        <span class="stat-label">INTEGRITY</span>
                        <span class="stat-level">Lv${playerStats.upgrades.hull || 0}</span>
                        <span class="stat-value">${Math.floor(playerStats.hp)}/${playerStats.maxHp}</span>
                    </div>
                </div>
                <div class="stat-category">
                    <div class="stat-category-title">// VULCAN</div>
                    <div class="stat-row">
                        <span class="stat-label">DAMAGE</span>
                        <span class="stat-level">&nbsp;&nbsp;&nbsp;</span>
                        <span class="stat-value">10</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">RANGE</span>
                        <span class="stat-level">&nbsp;&nbsp;&nbsp;</span>
                        <span class="stat-value">1500m</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">PROJECTILES</span>
                        <span class="stat-level">Lv${playerStats.upgrades.bulletCount || 0}</span>
                        <span class="stat-value">${playerStats.bulletCount}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">FIRE RATE</span>
                        <span class="stat-level">Lv${playerStats.upgrades.fireRate || 0}</span>
                        <span class="stat-value">${shotsPerSec}/s</span>
                    </div>
                </div>
                <div class="stat-category">
                    <div class="stat-category-title">// MISSILE</div>
                    <div class="stat-row">
                        <span class="stat-label">DAMAGE</span>
                        <span class="stat-level">Lv${playerStats.upgrades.missile || 0}</span>
                        <span class="stat-value">${Math.floor(150 * (playerStats.missileDamageMult || 1.0))}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">SPEED</span>
                        <span class="stat-level">&nbsp;&nbsp;&nbsp;</span>
                        <span class="stat-value">${(5.3 * (playerStats.missileSpeedMult || 1.0)).toFixed(1)}km/s</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">RANGE</span>
                        <span class="stat-level">&nbsp;&nbsp;&nbsp;</span>
                        <span class="stat-value">${Math.floor(1590 + (playerStats.missileAddRange || 0))}m</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">LAUNCHERS</span>
                        <span class="stat-level">&nbsp;&nbsp;&nbsp;</span>
                        <span class="stat-value">${playerStats.missileCount}</span>
                    </div>
                </div>
                <div class="stat-category">
                    <div class="stat-category-title">// THRUSTER</div>
                    <div class="stat-row">
                        <span class="stat-label">MAX SPEED</span>
                        <span class="stat-level">&nbsp;&nbsp;&nbsp;</span>
                        <span class="stat-value">${(playerStats.maxSpeed).toFixed(1)}km/s</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">ACCELERATION</span>
                        <span class="stat-level">&nbsp;&nbsp;&nbsp;</span>
                        <span class="stat-value">${(playerStats.moveSpeed).toFixed(2)}G</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">BOOST CAP.</span>
                        <span class="stat-level">Lv${playerStats.upgrades.booster || 0}</span>
                        <span class="stat-value">${80 + (playerStats.upgrades.booster || 0) * 20}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">HANDLING</span>
                        <span class="stat-level">Lv${playerStats.upgrades.maneuver || 0}</span>
                        <span class="stat-value">${(playerStats.handling * 60).toFixed(1)}°/s</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">CTRL MODE</span>
                        <span class="stat-level">&nbsp;&nbsp;&nbsp;</span>
                        <span class="stat-value">${GAME.controlMode}</span>
                    </div>
                </div>
            `;
        const statsPanel = document.getElementById('stats-panel');
        if (statsPanel) {
            statsPanel.innerHTML = statsHtml;
        }

        // --- 画面左上 クレジット（BOUNTY）更新 ---
        if (GAME.displayCredits < GAME.credits) {
            GAME.displayCredits += 5;
            if (GAME.displayCredits > GAME.credits) GAME.displayCredits = GAME.credits;
        }
        const uiCredits = document.getElementById('ui-credits');
        if (uiCredits) {
            uiCredits.innerText = GAME.displayCredits;
        }
    },

    draw: function(ctx, player, GAME) {
        // ----------------------------------------
        // 自機追従マイクロHUDの描画 (Z-order最前面扱い - 発進シーケンス中以外のみ)
        // ----------------------------------------
        if (GAME.isPlayerDying || GAME.launchSequence) return;

        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.lineWidth = 4;

        // --- 右側：HPゲージ (内側 半径39、2時〜4時) ---
        const hpRadius = 39;
        ctx.beginPath();
        ctx.arc(0, 0, hpRadius, -Math.PI / 6, Math.PI / 6); // 背景 (2時〜4時)
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.stroke();

        const hpRatio = Math.max(0, playerStats.hp / playerStats.maxHp);
        if (hpRatio > 0) {
            ctx.beginPath();
            const startAngle = -Math.PI / 6;
            const endAngle = startAngle + (Math.PI / 3) * hpRatio;
            ctx.arc(0, 0, hpRadius, startAngle, endAngle, false);
            ctx.strokeStyle = hpRatio > 0.5 ? '#0f0' : hpRatio > 0.25 ? '#ff0' : '#f00';
            ctx.stroke();
        }

        // --- 右側：ヒートゲージ (外側 半径45、2時〜4時) ---
        const heatRadius = 45;
        ctx.beginPath();
        ctx.arc(0, 0, heatRadius, -Math.PI / 6, Math.PI / 6); // 背景 (2時〜4時)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.stroke();

        const heatRatio = Math.max(0, Math.min(1, playerStats.heat / CONFIG.HEAT_MAX));
        if (heatRatio > 0) {
            ctx.beginPath();
            const startAngle = -Math.PI / 6;
            const endAngle = startAngle + (Math.PI / 3) * heatRatio;
            ctx.arc(0, 0, heatRadius, startAngle, endAngle, false);
            if (player.isOverheated) {
                ctx.strokeStyle = '#808080';
            } else if (heatRatio > 0.8) {
                ctx.strokeStyle = '#f80';
            } else {
                ctx.strokeStyle = '#fff';
            }
            ctx.stroke();
        }

        // --- 左側中段：ブーストゲージ (内側 半径39、10時〜8時) ---
        const boostRadius = 39;
        ctx.beginPath();
        ctx.arc(0, 0, boostRadius, 5 * Math.PI / 6, 7 * Math.PI / 6); // 背景
        ctx.strokeStyle = 'rgba(255, 136, 0, 0.2)';
        ctx.stroke();

        const maxBoostGauge = 80 + (playerStats.upgrades.booster || 0) * 20;
        const boostRatio = (player.boostGauge !== undefined ? player.boostGauge : maxBoostGauge) / maxBoostGauge;
        if (boostRatio > 0) {
            ctx.beginPath();
            const startAngle = 7 * Math.PI / 6; // 8時から
            const endAngle = startAngle - (Math.PI / 3) * boostRatio; // 10時へ向かって
            ctx.arc(0, 0, boostRadius, startAngle, endAngle, true);
            ctx.strokeStyle = '#f80';
            ctx.stroke();
        }

        // --- 左側外段：EXPゲージ (外側 半径45、10時〜8時) ---
        const expRadius = 45;
        ctx.beginPath();
        ctx.arc(0, 0, expRadius, 5 * Math.PI / 6, 7 * Math.PI / 6); // 背景
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.stroke();

        const expRatio = Math.max(0, Math.min(1, playerStats.exp / playerStats.nextLevelExp));
        if (expRatio > 0) {
            ctx.beginPath();
            const startAngle = 7 * Math.PI / 6; // 8時から
            const endAngle = startAngle - (Math.PI / 3) * expRatio; // 10時へ向かって
            ctx.arc(0, 0, expRadius, startAngle, endAngle, true);
            ctx.strokeStyle = '#0ff';
            ctx.stroke();
        }

        ctx.restore();
    }
};
