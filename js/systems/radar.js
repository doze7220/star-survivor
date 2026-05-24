const Radar = {
    draw: function(ctx, player, entities, CONFIG, GAME) {
        if (!GAME.isPlayerDying && !GAME.launchSequence && !player.isLandingSequence) {
            ctx.save();
            ctx.translate(GAME.width / 2, GAME.height / 2);

            // レーダーゲージ（真円）
            const radarRadius = CONFIG.RADAR_RADIUS;
            ctx.strokeStyle = 'rgba(255, 0, 0, 1.0)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, radarRadius, 0, Math.PI * 2);
            ctx.stroke();

            // ヒゲ（東西南北＋斜め45度）
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI / 4) * i;
                const cosA = Math.cos(a);
                const sinA = Math.sin(a);
                ctx.beginPath();
                // 5px外側に飛び出すヒゲ
                ctx.moveTo(cosA * radarRadius, sinA * radarRadius);
                ctx.lineTo(cosA * (radarRadius + 5), sinA * (radarRadius + 5));
                ctx.stroke();
            }

            // 砲塔方向を示す TARGET マーカー（▲とTARGETの文字）
            ctx.save();
            ctx.rotate(player.turretAngle);
            ctx.fillStyle = '#0f0'; // 自機と同じ色(緑)
            // ▲アイコンをレーダー内側に表示 (サイズ拡大)
            ctx.beginPath();
            ctx.moveTo(radarRadius - 15, 0); // 先端 (外側へ)
            ctx.lineTo(radarRadius - 35, -8); // 後ろ上 (幅を広げ、後ろに引く)
            ctx.lineTo(radarRadius - 35, 8);  // 後ろ下
            ctx.closePath();
            ctx.fill();

            // TARGET文字 (重なり防止のため、底辺からさらに内側へ離す)
            ctx.font = 'bold 10px Courier New';
            ctx.fillStyle = '#0f0'; // 文字も自機色(緑)に
            ctx.textAlign = 'center';

            // 底辺の中心 (radarRadius - 35, 0) からさらに離し、(radarRadius - 45, 0) に翻訳
            ctx.translate(radarRadius - 45, 0);

            let textAngle = player.turretAngle;
            while (textAngle < 0) textAngle += Math.PI * 2;
            textAngle = textAngle % (Math.PI * 2);

            // 画面下半分の角度では文字が裏返らないように180度反転
            // 重なりを防ぐため、常にレーダーの中心寄りに押し出すよう textBaseline を出し分け
            if (textAngle > Math.PI / 2 && textAngle < Math.PI * 1.5) {
                ctx.rotate(-Math.PI / 2);
                ctx.textBaseline = 'bottom';
                ctx.fillText('TARGET', 0, -2);
            } else {
                ctx.rotate(Math.PI / 2);
                ctx.textBaseline = 'top';
                ctx.fillText('TARGET', 0, 2);
            }
            ctx.restore();

            // --- 母艦（Anchor Garage）への方向マーカー ---
            const msDx = CONFIG.MOTHERSHIP_X - player.x;
            const msDy = CONFIG.MOTHERSHIP_Y - player.y;
            const msAngle = Math.atan2(msDy, msDx);
            const msDist = Math.hypot(msDx, msDy);

            // 母艦が画面内に十分入っているか判定（表示内ならレーダーを非表示にする）
            // 画面端からのマージンを考慮して判定（画面外へ少し出たらすぐレーダーがガイドするよう +200 程度余裕を持たせる）
            const isMsVisible = Math.abs(msDx) <= GAME.width / 2 + 200 && Math.abs(msDy) <= GAME.height / 2 + 200;

            if (!isMsVisible) {
                // 距離のフォーマット (1~999m、1.0km～で表記切り替え)
                const msDistRounded = Math.floor(msDist);
                let msDistStr = "";
                if (msDistRounded >= 1000) {
                    msDistStr = (msDist / 1000).toFixed(1) + "km";
                } else {
                    msDistStr = Math.max(1, msDistRounded) + "m";
                }

                ctx.save();
                ctx.rotate(msAngle);
                ctx.fillStyle = '#fff'; // 母艦のレーダーアイコンは白にする

                // ▲アイコンをレーダー内側に表示 (TARGETと同じサイズに拡大)
                ctx.beginPath();
                ctx.moveTo(radarRadius - 15, 0); // 先端
                ctx.lineTo(radarRadius - 35, -8); // 後ろ上
                ctx.lineTo(radarRadius - 35, 8);  // 後ろ下
                ctx.closePath();
                ctx.fill();

                // 三角の下側（レーダーの中心側）に A.GARAGE と距離を表示 (白にする)
                // テキストも三角の回転に合わせて一緒に回転する
                ctx.fillStyle = '#fff'; // テキスト・距離も白
                ctx.textAlign = 'center';

                // 底辺の中心から十分離し、(radarRadius - 45, 0) に翻訳
                ctx.translate(radarRadius - 45, 0);

                let msTextAngle = msAngle;
                while (msTextAngle < 0) msTextAngle += Math.PI * 2;
                msTextAngle = msTextAngle % (Math.PI * 2);

                // 画面下半分の角度では文字が裏返らないように180度反転
                // 重なりを防ぐため、常にレーダーの中心寄りに押し出すよう textBaseline とテキスト位置を調整
                if (msTextAngle > Math.PI / 2 && msTextAngle < Math.PI * 1.5) {
                    ctx.rotate(-Math.PI / 2);
                    ctx.textBaseline = 'bottom';
                    ctx.font = 'bold 10px Courier New';
                    ctx.fillText('A.GARAGE', 0, -18);
                    ctx.font = 'bold 16px Courier New';
                    ctx.fillText(msDistStr, 0, -2);
                } else {
                    ctx.rotate(Math.PI / 2);
                    ctx.textBaseline = 'top';
                    ctx.font = 'bold 10px Courier New';
                    ctx.fillText('A.GARAGE', 0, 18);
                    ctx.font = 'bold 16px Courier New';
                    ctx.fillText(msDistStr, 0, 2);
                }
                ctx.restore();
            }

            // 画面外エネミーの方向マーカーと距離表示
            entities.enemies.forEach(e => {
                const dx = e.x - player.x;
                const dy = e.y - player.y;
                const dist = Math.hypot(dx, dy);
                const halfW = GAME.width / 2;
                const halfH = GAME.height / 2;

                // 画面外にいる敵のみ表示
                if (Math.abs(dx) > halfW || Math.abs(dy) > halfH) {
                    const angle = Math.atan2(dy, dx);

                    ctx.save();
                    // 真円のすぐ外側（半径 + 15pxの位置）にマーカーを配置
                    const markerX = Math.cos(angle) * (radarRadius + 15);
                    const markerY = Math.sin(angle) * (radarRadius + 15);
                    ctx.translate(markerX, markerY);

                    // マーカー本体の描画（回転させる）
                    ctx.save();
                    ctx.rotate(angle + Math.PI / 2); // ▲の頂点が敵の方向を向くように回転

                    ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
                    ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)';

                    // 赤い▲
                    ctx.beginPath();
                    ctx.moveTo(0, -8);  // 少し小ぶりに調整
                    ctx.lineTo(-6, 4);
                    ctx.lineTo(6, 4);
                    ctx.closePath();
                    ctx.fill();

                    // 下部の線（天地を示す ＿）
                    ctx.beginPath();
                    ctx.moveTo(-8, 6);
                    ctx.lineTo(8, 6);
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.restore(); // マーカーの回転リセット

                    // 距離テキストの描画（回転させず水平を保つ）
                    let distText = "";
                    if (dist >= 999) {
                        distText = (dist / 1000).toFixed(1) + "km";
                    } else {
                        distText = Math.floor(dist) + "m";
                    }

                    // テキスト位置をさらに外側へ押し出す
                    const textOffset = 18;
                    const textX = Math.cos(angle) * textOffset;
                    const textY = Math.sin(angle) * textOffset;

                    ctx.fillStyle = 'rgba(255, 50, 50, 0.9)';
                    ctx.font = 'bold 12px Courier New';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(distText, textX, textY);

                    // 敵の残りHP表示
                    const hpRatio = Math.max(0, e.hp / e.maxHp);
                    const hpPercent = Math.floor(hpRatio * 100);
                    ctx.font = '10px Courier New';
                    ctx.fillStyle = hpRatio > 0.5 ? '#0f0' : hpRatio > 0.25 ? '#ff0' : '#f00';
                    ctx.fillText(`HP:${hpPercent}%`, textX, textY + 12);

                    ctx.restore(); // 位置リセット
                }
            });

            // 資源レーダー (画面外のEXP, BIG_EXP, HEAL を表示)
            entities.gems.forEach(g => {
                if (g.kind !== 'EXP' && g.kind !== 'BIG_EXP' && g.kind !== 'HEAL') return;

                const dx = g.x - player.x;
                const dy = g.y - player.y;
                const dist = Math.hypot(dx, dy);
                const halfW = GAME.width / 2;
                const halfH = GAME.height / 2;

                // 最大距離5000mのアイテムを表示（画面内にある場合も表示する）
                if (dist <= 5000) {
                    const angle = Math.atan2(dy, dx);

                    // 画面外境界（おおよそ 500px とみなす）からの距離超過分
                    // 画面内(overDist=0)の場合は alpha=1.0 となる
                    const overDist = Math.max(0, dist - Math.max(halfW, halfH));
                    // 200m(px)ごとに alpha が 0.1 下がる。最大透明度80% (alpha 0.2)
                    const alphaDrop = Math.floor(overDist / 200) * 0.1;
                    const alpha = Math.max(0.2, 1.0 - alphaDrop);

                    let color = '#0ff'; // EXP
                    if (g.kind === 'BIG_EXP') color = '#ff0';
                    if (g.kind === 'HEAL') color = '#0f0';

                    ctx.save();
                    ctx.rotate(angle);

                    // 母艦マーカー(幅20、長さ35)の半分サイズ(幅10、長さ17.5)の▲を描画
                    ctx.fillStyle = color;
                    ctx.globalAlpha = alpha;

                    ctx.beginPath();
                    ctx.moveTo(radarRadius - 10, 0); // 先端
                    ctx.lineTo(radarRadius - 27.5, -5); // 後ろ上
                    ctx.lineTo(radarRadius - 27.5, 5);  // 後ろ下
                    ctx.closePath();
                    ctx.fill();

                    ctx.restore();
                }
            });
            // --- v0.5.00 マイクロHUD拡張 ---
            // ※すでにレーダー中心に translate されているコンテキスト内で実行
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 12px Courier New';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;

            // 上部（内側）：レベル＆経験値 (12時方向)
            ctx.fillStyle = '#00ffff';
            const levelText = `Lv.${playerStats.level.toString().padStart(3, '0')}  Exp.${playerStats.exp}/${playerStats.nextLevelExp}`;
            drawCircularText(ctx, levelText, radarRadius - 7, -Math.PI / 2, false);

            // スピード＆Gフォースの計算
            const speedKms = ((Math.hypot(player.vx, player.vy) * 60) / 1000).toFixed(1);
            const prevVx = player.prevVx || 0;
            const prevVy = player.prevVy || 0;
            const gForce = (Math.hypot(player.vx - prevVx, player.vy - prevVy) * 1.5).toFixed(1);

            // 下部（内側）：1行にまとめる
            ctx.fillStyle = '#ffa500';
            const speedAccText = `SPD:${speedKms}km/s  ACC:${gForce}G`;
            drawCircularText(ctx, speedAccText, radarRadius - 6, Math.PI / 1.95, true);

            ctx.restore();

            // C. ダイナミック・コンテクスト・アラート
            // 優先度: WARNING > OVERHEAT > DOCK INBOUND
            let alertText = "";
            let alertColor = "";

            let isWarning = player.flashTimer > 0;
            if (!isWarning) {
                for (let i = 0; i < entities.enemies.length; i++) {
                    const e = entities.enemies[i];
                    if (Math.hypot(e.x - player.x, e.y - player.y) < 300) {
                        isWarning = true;
                        break;
                    }
                }
            }

            if (isWarning) {
                alertText = "WARNING";
                alertColor = "#f00";
            } else if (player.isOverheated) {
                alertText = "OVERHEAT";
                alertColor = "#f80";
            } else if (!GAME.launchSequence && !player.isLandingSequence) {
                const msDist = Math.hypot(CONFIG.MOTHERSHIP_X - player.x, CONFIG.MOTHERSHIP_Y - player.y);
                if (msDist < 500 && Math.hypot(player.vx, player.vy) < 2) {
                    alertText = "DOCK INBOUND";
                    alertColor = "#0f0";
                }
            }

            if (alertText) {
                const alpha = (Math.sin(Date.now() / 150) + 1) / 2 * 0.5 + 0.5;
                ctx.globalAlpha = alpha;
                ctx.font = 'bold 16px Courier New';
                ctx.fillStyle = alertColor;
                ctx.shadowColor = alertColor;
                ctx.shadowBlur = 8;
                ctx.fillText(alertText, 0, -50);
            }

            CommStateManager.draw(ctx, radarRadius);

            ctx.restore();
        }
    }
};
