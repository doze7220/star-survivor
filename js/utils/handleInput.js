function handleCommInput(e, GAME, player) {
    // 通信モード中であっても、KeyX（視点切替）やKeyC（通信終了など）は最優先で処理される仕様だったため捕捉する
    if (e.code === 'KeyX' && !e.repeat && GAME.state === 'PLAYING' && !GAME.launchSequence && !player.isLandingSequence && !GAME.isPlayerDying) {
        GAME.controlMode = GAME.controlMode === 'MOUSE_AIM' ? 'SUBSPACE' : 'MOUSE_AIM';
        comm.play(GAME.controlMode === 'MOUSE_AIM' ? "マウスエイムモードです" : "サブスペースモードです");
        return;
    }
    if (e.code === 'KeyC' && !e.repeat && GAME.state === 'PLAYING' && !GAME.launchSequence && !player.isLandingSequence && !GAME.isPlayerDying) {
        CommStateManager.handleInput(e);
        return;
    }
    
    // それ以外のキーは通信用ハンドラへ委譲
    if (GAME.commState && GAME.commState !== 'INACTIVE') {
        CommStateManager.handleActiveInput(e);
    }
}

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

function handleTitleInput(e, GAME, player) {
    if (e.key.length === 1 || e.code === 'Space' || e.code === 'Enter') {
        if (GAME.titleLaunchTimer === 0) {
            GAME.titleLaunchTimer = 1; // 出撃決定演出開始
            GAME.fadeAlpha = 0;
        }
    }
}
