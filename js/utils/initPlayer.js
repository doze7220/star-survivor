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
