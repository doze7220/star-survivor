// ==========================================
// // js/utils/utils.js
// 関数が10個を超えてきて、かつ種類がバラバラになったら分ける
// あるいは巨大な関数が出来てしまったら個別にする
// ==========================================

// 角度の正規化（-PI ～ PI の間に収める）
function normalizeAngle(angle) {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
}

// 目標角度へ一定量だけ回転させる（AIや砲塔制御用）
function rotateTowards(current, target, maxStep) {
    const diff = normalizeAngle(target - current);
    if (Math.abs(diff) <= maxStep) return target;
    return current + Math.sign(diff) * maxStep;
}

function getCatapultSpec() {
    const catW = 150;
    const catH = CONFIG.PLAYER_SIZE_W * 2.5;
    // 母艦描画は ctx.rotate(-Math.PI/2) が掛かっているため
    // ローカル座標 (lx, ly) → ワールド座標 (ly, -lx)
    // ローカル root(80,0) → world(0,-80)、tip(230,0) → world(0,-230)
    return {
        rootX: 0,      // ワールドX：カタパルト根本
        rootY: -80,    // ワールドY：カタパルト根本
        tipX: 0,       // ワールドX：カタパルト先端
        tipY: -(80 + catW), // ワールドY：カタパルト先端 = -230
        width: catW,
        height: catH,
        halfH: catH / 2
    };
}

// 爆発の共通描画関数
function drawExplosion(ctx, exp) {
    const scale = exp.currentScale || 0; // updateで計算されるスケール
    if (scale <= 0) return;
    const currentRadius = exp.maxRadius * scale;

    ctx.save();

    // 最後の10%でフェードアウト
    const progress = 1 - (exp.timer / exp.maxTimer);
    if (progress > 0.9) {
        ctx.globalAlpha = Math.max(0, (1.0 - progress) / 0.1);
    } else {
        ctx.globalAlpha = 1.0;
    }

    // 振動オフセットを適用
    const drawX = exp.x + (exp.shakeX || 0);
    const drawY = exp.y + (exp.shakeY || 0);

    // 円1 (赤/深紅 - 最も大きいベース円)
    ctx.beginPath();
    ctx.arc(drawX, drawY, currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 30, 0, 0.7)';
    ctx.fill();

    // 円2 (白 - 中円)
    const midX = drawX + Math.cos(exp.angle) * currentRadius * exp.offsetMid;
    const midY = drawY + Math.sin(exp.angle) * currentRadius * exp.offsetMid;
    ctx.beginPath();
    ctx.arc(midX, midY, currentRadius * 0.75, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();

    // 円3 (黄色/オレンジ - 小円)
    const smallX = drawX + Math.cos(exp.angle) * currentRadius * exp.offsetSmall;
    const smallY = drawY + Math.sin(exp.angle) * currentRadius * exp.offsetSmall;
    ctx.beginPath();
    ctx.arc(smallX, smallY, currentRadius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 160, 0, 0.8)';
    ctx.fill();

    ctx.restore();
}

// 座標の文字列整形 (X: +00100 形式など)
function formatCoord(v) {
    const sign = v < 0 ? '-' : '+';
    return sign + Math.abs(Math.round(v)).toString().padStart(5, '0');
}

// --- 円形テキスト描画関数 ---
function drawCircularText(ctx, text, radius, startAngle, isBottom = false) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let totalAngle = 0;
    for (let i = 0; i < text.length; i++) {
        totalAngle += ctx.measureText(text[i]).width / radius;
    }

    // isBottomの時は開始角度をずらし、進行方向を逆（左から右）にする
    let currentAngle = isBottom ? startAngle + (totalAngle / 2) : startAngle - (totalAngle / 2);

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charWidth = ctx.measureText(char).width;
        const charAngle = charWidth / radius;

        // 文字の配置角度
        const angle = isBottom ? currentAngle - charAngle / 2 : currentAngle + charAngle / 2;

        ctx.save();
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        ctx.translate(x, y);

        if (isBottom) {
            ctx.rotate(angle - Math.PI / 2);
        } else {
            ctx.rotate(angle + Math.PI / 2);
        }

        ctx.fillText(char, 0, 0);
        ctx.restore();

        // 次の文字へ進む
        currentAngle = isBottom ? currentAngle - charAngle : currentAngle + charAngle;
    }
    ctx.restore();
}

// --- ベクターパスストリーム方式による滑らかなトレイル描画（先細り仕様） ---
function drawRibbonTrail(history, colorBase, maxLen) {
    if (!history || history.length < 2) return;

    ctx.save();

    // トレイルの先端（直近の座標）の状態を基準にする
    const latestPt = history[history.length - 1];
    // ブースト時は太さを2.5倍にし、SF的なエネルギー出力を表現
    const finalLineWidth = latestPt.boost ? maxLen * 2.5 : maxLen;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round'; // 結合部を滑らかに

    if (history.length === 2) {
        const ratio = 1.0;
        const segmentWidth = finalLineWidth * ratio;

        ctx.beginPath();
        ctx.strokeStyle = colorBase;
        ctx.lineWidth = segmentWidth;
        ctx.moveTo(history[0].x, history[0].y);
        ctx.lineTo(history[1].x, history[1].y);
        ctx.globalAlpha = (latestPt.active ? 0.7 : 0.25) * ratio;
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = segmentWidth * 0.35;
        ctx.moveTo(history[0].x, history[0].y);
        ctx.lineTo(history[1].x, history[1].y);
        ctx.globalAlpha = (latestPt.active ? 0.9 : 0.3) * ratio;
        ctx.stroke();
    } else {
        // 過去から現在に向かってセグメントごとに太さと透明度を変化させて描画 (quadraticCurveToによる平滑化)
        for (let i = 1; i < history.length - 1; i++) {
            const p0 = history[i - 1];
            const p1 = history[i];
            const p2 = history[i + 1];

            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            const ratio = i / (history.length - 2); // 0 (古い) 〜 1 (新しい)
            const segmentWidth = finalLineWidth * ratio; // 先端（古い点）ほど細くする

            const startMidX = (p0.x + p1.x) / 2;
            const startMidY = (p0.y + p1.y) / 2;

            // ─── 1. 外周の発光メインライン ───
            ctx.beginPath();
            ctx.strokeStyle = colorBase;
            ctx.lineWidth = segmentWidth;

            if (i === 1) {
                ctx.moveTo(p0.x, p0.y);
                ctx.lineTo(startMidX, startMidY);
            } else {
                ctx.moveTo(startMidX, startMidY);
            }
            ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
            if (i === history.length - 2) ctx.lineTo(p2.x, p2.y);

            ctx.globalAlpha = (latestPt.active ? 0.7 : 0.25) * ratio;
            ctx.stroke();

            // ─── 2. 内側の高輝度ホワイトコアライン（レーザーのようなSF感の演出） ───
            ctx.beginPath();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = segmentWidth * 0.35;

            if (i === 1) {
                ctx.moveTo(p0.x, p0.y);
                ctx.lineTo(startMidX, startMidY);
            } else {
                ctx.moveTo(startMidX, startMidY);
            }
            ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
            if (i === history.length - 2) ctx.lineTo(p2.x, p2.y);

            ctx.globalAlpha = (latestPt.active ? 0.9 : 0.3) * ratio;
            ctx.stroke();
        }
    }

    ctx.restore();
}

// 【主人公専用演出】ベクターパス方式による風トレイル（スリップストリーム）
const drawWindTrail = (history) => {
    if (history && history.length >= 2) {
        // 速度に基づくアルファ値の計算
        const latestSpeed = Math.hypot(player.vx, player.vy);
        const safeMaxSpeed = Math.max(playerStats.maxSpeed, CONFIG.WIND_TRAIL_MIN_SPEED + 0.1);
        const speedRatio = Math.max(0, Math.min(1.0, (latestSpeed - CONFIG.WIND_TRAIL_MIN_SPEED) / (safeMaxSpeed - CONFIG.WIND_TRAIL_MIN_SPEED)));

        if (speedRatio <= 0) return;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = `rgba(255, 255, 255, ${speedRatio * 0.25})`; // 白色、速度に応じたアルファ

        // トレイルの太さを曲線（Math.sin）で計算し、セグメントごとに描画する
        // 最大幅はメインバーニア(7)の半分(=3.5)
        const maxWidth = 3.5;

        for (let i = 0; i < history.length - 1; i++) {
            const p1 = history[i];
            const p2 = history[i + 1];

            // 全体の中での位置 (0.0 〜 1.0)
            const ratio = (i + 0.5) / (history.length - 1);

            // sinカーブで 0 -> 1 -> 0 になるよう太さを設定
            ctx.lineWidth = maxWidth * Math.sin(ratio * Math.PI);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);

            if (i === history.length - 2) {
                ctx.lineTo(p2.x, p2.y);
            } else {
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
            }
            ctx.stroke();
        }

        ctx.restore();
    }
};
