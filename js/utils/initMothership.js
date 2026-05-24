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
