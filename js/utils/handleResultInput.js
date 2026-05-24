function handleResultInput(e, GAME, player) {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        GAME.resultSelection = 0; // RETURN TO GARAGE
    }
    if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        GAME.resultSelection = 1; // RETRY MISSION
    }
    if (e.code === 'Space' || e.code === 'Enter') {
        if (GAME.resultSelection === 0) {
            GAME.state = 'TITLE';
            GAME.titleLaunchTimer = 0;
            GAME.fadeAlpha = 0;
            GAME.titleLeftTrailHistory = [];
            GAME.titleRightTrailHistory = [];
            player.leftTrailHistory = [];
            player.rightTrailHistory = [];
            player.leftWindTrailHistory = [];
            player.rightWindTrailHistory = [];
        } else {
            resetGame();
            GAME.state = 'PLAYING';
            player.leftTrailHistory = [];
            player.rightTrailHistory = [];
            player.leftWindTrailHistory = [];
            player.rightWindTrailHistory = [];
        }
    }
}
