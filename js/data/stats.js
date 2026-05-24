// ==========================================
// 成長システムのデータ構造
// ==========================================
const playerStats = {
    level: 1,
    exp: 0,
    nextLevelExp: CONFIG.LEVEL_UP_EXP_BASE,
    fireRate: CONFIG.BULLET_BASE_FIRE_RATE,   // 連射速度（フレーム間隔）
    bulletCount: 1, // 同時発射数
    moveSpeed: CONFIG.PLAYER_BASE_MOVE_SPEED, // 加速度係数
    handling: CONFIG.PLAYER_BASE_HANDLING,
    maxSpeed: CONFIG.PLAYER_BASE_MAX_SPEED,
    hp: CONFIG.PLAYER_BASE_HP,
    maxHp: CONFIG.PLAYER_BASE_HP,
    heat: 0, // 現在の熱量
    missileCount: 1, // ミサイル同時発射数
    missileDamageMult: 1.0, // ミサイル攻撃力倍率（初期1.0）
    missileSpeedMult: 1.0, // ミサイル速度倍率（初期1.0）
    missileAddRange: 0, // ミサイル追加射程
    autoRepairCooldown: 0, // オートリペアのクールダウンタイマー
    upgrades: {
        fireRate: 0,
        bulletCount: 0,
        missile: 0,
        hull: 0,
        booster: 0,
        maneuver: 0,
        heal: 0
    }
};

