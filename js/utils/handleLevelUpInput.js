function handleLevelUpInput(e, GAME, player) {
    if (GAME.credits < 0) {
        if (e.code === 'Space' || e.code === 'Enter') {
            GAME.state = 'PLAYING'; // そのまま戻るのみ
        }
        return;
    }

    if (GAME.levelUpState === 'CHOOSING') {
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
            GAME.levelUpSelectedIndex = (GAME.levelUpSelectedIndex + 2) % 3; // 左循環
        }
        if (e.code === 'KeyD' || e.code === 'ArrowRight') {
            GAME.levelUpSelectedIndex = (GAME.levelUpSelectedIndex + 1) % 3; // 右循環
        }
        if (e.code === 'Space' || e.code === 'Enter') {
            GAME.levelUpState = 'DECIDED';
            GAME.levelUpDecidedIndex = GAME.levelUpSelectedIndex;
            GAME.levelUpDecidedTimer = 45; // 0.75秒
            GAME.levelUpNonSelectedY = 0;
        }
    }
}
