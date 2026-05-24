function initGameState(GAME) {
    GAME.isPlayerDying = false;
    GAME.isMissionClear = false;
    GAME.isResultTriggered = false;
    GAME.killCount = 0;
    GAME.damageTaken = 0;
    GAME.operationTime = 0;
    GAME.operationFrameCount = 0;
    GAME.quotaReminderTimer = 0;
    GAME.launchSequence = true;
    GAME.launchTimer = 0;
    GAME.landingBlockedTimer = 0;
}
