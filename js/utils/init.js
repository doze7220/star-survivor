function initEntities(entities) {
    entities.enemies = [];
    entities.bullets = [];
    entities.enemyBullets = [];
    entities.particles = [];
    entities.gems = [];
    entities.missiles = [];
    entities.debris = [];
    entities.explosions = [];
}

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

function initMothership(entities, CONFIG) {
    entities.enemyMothership = {
        x: CONFIG.SPAWN_X,
        y: CONFIG.SPAWN_Y,
        hp: 1000,
        maxHp: 1000,
        radius: 120, // 当たり判定用（大まか）
        isDead: false,
        launchTimer: 180, // 最初から3秒後に発進開始
        flashTimer: 0
    };
}

function initPlayer(player, playerStats) {
    player.x = 0;
    player.y = -90;
    player.vx = 0;
    player.vy = 0;
    player.bodyAngle = -Math.PI / 2;
    player.turretAngle = -Math.PI / 2;
    player.isLandingSequence = false;
    player.landingPhase = 'NONE';
    player.landingTimer = 0;
    player.leftTrailHistory = [];
    player.rightTrailHistory = [];
    player._hpWarningPlayed = false;

    playerStats.hp = playerStats.maxHp;
    playerStats.heat = 0;
    player.isOverheated = false;
    player.overheatTimer = 0;
}

function initUI() {
    const credits = document.getElementById('credits-panel');
    if (credits) credits.style.display = 'none';
    const cielo = document.getElementById('cielo-comm');
    if (cielo) cielo.style.display = 'none';
}
