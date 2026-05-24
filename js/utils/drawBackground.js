function drawBackground(ctx, stars, GAME) {
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, GAME.width, GAME.height);

    ctx.fillStyle = '#fff';
    const titleFadeAlpha = GAME.state === 'TITLE' ? Math.max(0, 1.0 - (GAME.fadeAlpha || 0)) : 1.0;
    stars.forEach(s => {
        ctx.globalAlpha = s.layer.rate * titleFadeAlpha;
        ctx.fillRect(s.x, s.y, s.layer.size, s.layer.size);
    });
    ctx.globalAlpha = 1.0;
}
