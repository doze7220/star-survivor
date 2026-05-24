// ==========================================
// アップグレードプール（全6種 + 回復）
// maxLevel: 6 = Lv.1-5は基礎強化、Lv.6はリミットバースト
// ==========================================
const upgradePool = [
    {
        id: 'fireRate', name: 'Rapid Fire', shortName: '[バルカン]\\n[連射]',
        description: '連射速度がアップする', burstDesc: 'ヒート蓄積完全無効化',
        maxLevel: 6, category: 'weapon', categoryColor: CONFIG.UPGRADE_CAT_WEAPON,
        apply: () => {
            playerStats.upgrades.fireRate++;
            if (playerStats.upgrades.fireRate <= 5) {
                playerStats.fireRate = Math.max(CONFIG.UPGRADE_FIRERATE_MIN, Math.floor(playerStats.fireRate * CONFIG.UPGRADE_FIRERATE_MULT));
            }
        }
    },
    {
        id: 'bulletCount', name: 'Multi-Shot', shortName: '[バルカン]\\n[弾数]',
        description: '同時発射弾数が増える', burstDesc: '着弾時スキャッター弾',
        maxLevel: 6, category: 'weapon', categoryColor: CONFIG.UPGRADE_CAT_WEAPON,
        apply: () => {
            playerStats.upgrades.bulletCount++;
            if (playerStats.upgrades.bulletCount <= 5) { playerStats.bulletCount++; }
        }
    },
    {
        id: 'missile', name: 'Missile System', shortName: '[ミサイル]\\n[強化]',
        description: 'ミサイルの性能向上', burstDesc: 'マルチ弾頭化',
        maxLevel: 6, category: 'weapon', categoryColor: CONFIG.UPGRADE_CAT_WEAPON,
        apply: () => {
            playerStats.upgrades.missile++;
            const lv = playerStats.upgrades.missile;
            
            let dmgMult = 1.0;
            let spdMult = 1.0;
            let addRange = 0;
            let count = 1;

            if (lv >= 1) { dmgMult += 0.5; spdMult += 0.5; }
            if (lv >= 2) { count += 1; }
            if (lv >= 3) { dmgMult += 0.5; spdMult += 0.5; addRange += 500; }
            if (lv >= 4) { count += 1; }
            if (lv >= 5) { dmgMult += 0.5; spdMult += 0.5; addRange += 500; }

            playerStats.missileDamageMult = dmgMult;
            playerStats.missileSpeedMult = spdMult;
            playerStats.missileAddRange = addRange;
            playerStats.missileCount = count;
        }
    },
    {
        id: 'hull', name: 'Hull Integrity', shortName: '[船体]\\n[装甲]',
        description: '最大HPが増加する', burstDesc: 'オートリペア発動',
        maxLevel: 6, category: 'hull', categoryColor: CONFIG.UPGRADE_CAT_HULL,
        apply: () => {
            playerStats.upgrades.hull++;
            if (playerStats.upgrades.hull <= 5) {
                playerStats.maxHp += CONFIG.HULL_HP_PER_LEVEL;
                playerStats.hp += CONFIG.HULL_HP_PER_LEVEL;
            }
        }
    },
    {
        id: 'booster', name: 'Booster System', shortName: '[ブースト]\\n[強化]',
        description: 'ブーストゲージ増加・CD短縮', burstDesc: 'ブースト中ヒート無効化',
        maxLevel: 6, category: 'mobility', categoryColor: CONFIG.UPGRADE_CAT_MOBILITY,
        apply: () => { playerStats.upgrades.booster++; }
    },
    {
        id: 'maneuver', name: 'Maneuverability', shortName: '[機動]\\n[旋回]',
        description: '旋回速度がアップする', burstDesc: 'タクティカル・ブレーキ',
        maxLevel: 6, category: 'mobility', categoryColor: CONFIG.UPGRADE_CAT_MOBILITY,
        apply: () => { playerStats.upgrades.maneuver++; }
    },
    {
        id: 'heal', name: 'Hull Repair', shortName: '[船体]\\n[修復]',
        description: 'HPを' + CONFIG.UPGRADE_HEAL_AMOUNT + '回復する', burstDesc: '',
        maxLevel: 9999, category: 'recovery', categoryColor: CONFIG.UPGRADE_CAT_RECOVERY,
        apply: () => {
            playerStats.upgrades.heal++;
            playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + CONFIG.UPGRADE_HEAL_AMOUNT);
        }
    }
];
