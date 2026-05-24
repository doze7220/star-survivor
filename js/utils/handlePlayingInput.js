function handlePlayingInput(e, GAME, player, entities) {
    if (e.code === 'KeyX' && !e.repeat && GAME.state === 'PLAYING' && !GAME.launchSequence && !player.isLandingSequence && !GAME.isPlayerDying) {
        GAME.controlMode = GAME.controlMode === 'MOUSE_AIM' ? 'SUBSPACE' : 'MOUSE_AIM';
        comm.play(GAME.controlMode === 'MOUSE_AIM' ? "マウスエイムモードです" : "サブスペースモードです");
    } else if (e.code === 'KeyC' && !e.repeat && GAME.state === 'PLAYING' && !GAME.launchSequence && !player.isLandingSequence && !GAME.isPlayerDying) {
        CommStateManager.handleInput(e);
    } else if (GAME.state === 'PLAYING' && !e.repeat) {
        if (e.code === 'Digit1' || e.code === 'Numpad1') {
            playerStats.hp = playerStats.maxHp;
            player.isOverheated = false;
            player.overheatTimer = 0;
            GAME.damageFlashTimer = 0;
            comm.play("完全チート修理します！");
        } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
            GAME.debugEnemyRespawnEnabled = !GAME.debugEnemyRespawnEnabled;
            comm.play(GAME.debugEnemyRespawnEnabled ? "敵リスポーンONです" : "敵リスポーンOFFです");
        } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
            clearAllEnemiesInstantly();
            comm.play("まじかるまじかる敵全滅☆えいっ！");
        } else if (e.code === 'Digit5' || e.code === 'Numpad5') {
            // EXPを足すだけではなく、即座にレベルアップとストック付与を行う
            playerStats.level++;
            playerStats.levelUpStock = (playerStats.levelUpStock || 0) + 1;
            playerStats.nextLevelExp = Math.floor(playerStats.nextLevelExp * CONFIG.LEVEL_UP_EXP_MULT);
            comm.play("リミット解除が可能です！");
        } else if (e.code === 'Digit6' || e.code === 'Numpad6') {
            if (entities.enemyMothership && !entities.enemyMothership.isDead) {
                entities.enemyMothership.hp = 0;
                comm.play("みらくるみらくる敵母艦☆消滅！");
            }
        } else if (e.code === 'Digit4' || e.code === 'Numpad4') {
            GAME.killCount = CONFIG.MISSION_QUOTA;
            GAME.isMissionClear = false;
            GAME.isResultTriggered = false;
            GAME.quotaReminderTimer = 0;
            player.isLandingSequence = false;
            player.landingPhase = 'NONE';
            player.landingTimer = 0;
            player.landingForClear = false;
            comm.play("ミッション・クリアしたことにしました！");
        }
    }
}
