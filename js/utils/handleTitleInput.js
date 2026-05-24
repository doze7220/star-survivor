function handleTitleInput(e, GAME, player) {
    if (e.key.length === 1 || e.code === 'Space' || e.code === 'Enter') {
        if (GAME.titleLaunchTimer === 0) {
            GAME.titleLaunchTimer = 1; // 出撃決定演出開始
            GAME.fadeAlpha = 0;
        }
    }
}
