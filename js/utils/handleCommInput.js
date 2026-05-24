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
