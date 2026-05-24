/**
 * VANGUARDRIFTER - v0.5.00 Implementation
 */

// ==========================================
// 3 Cielo 通信システム
// ==========================================
const Cielo = {
    element: null,
    timerId: null,
    currentMsg: null,
    init: function () {
        this.element = document.getElementById('cielo-comm');
        this.play("ミッションは敵撃破10機！いってらっしゃい傭兵さん！");
    },
    play: function (msg, type = "normal") { // ← 第2引数 type を追加（デフォルトは "normal"）
        if (this.currentMsg === msg) return;

        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }

        // ▼ ここに type による色分け処理を追加 ▼
        if (type === "system") {
            this.element.style.color = "#ff3333"; // システムメッセージ時は赤文字にする
        } else {
            this.element.style.color = "#0f0";    // 通常時は元の緑色
        }

        this.currentMsg = msg;
        this.element.innerHTML = `[ NAVI : シエロ ]<br>＝ ${msg} ＝`;
        this.element.style.opacity = 1;

        const duration = msg.length * 1000;
        this.timerId = setTimeout(() => {
            this.element.style.opacity = 0;
            this.currentMsg = null;
            this.timerId = null;
        }, duration);
    }
};

// ==========================================
// 4. ゲーム状態・エンティティ定義
// ==========================================
const GAME = {
    state: 'TITLE', // 最初は 'TITLE'
    controlMode: 'SUBSPACE', // MOUSE_AIM, SUBSPACE
    debugEnemyRespawnEnabled: true,
    width: window.innerWidth,
    height: window.innerHeight,
    mouseX: 0,
    mouseY: 0,
    isMouseDown: false, // 左クリック状態
    isPlayerDying: false,
    credits: 0,
    displayCredits: 0,
    killCount: 0,
    isMissionClear: false,
    damageFlashTimer: 0, // 画面の赤フラッシュ用タイマー
    isResultTriggered: false, // リザルト画面のトリガー用フラグ
    quotaReminderTimer: 0, // ノルマ達成通知用タイマー
    launchSequence: false, // タイトルから出撃する時に true にする
    launchTimer: 0,       // 発進カウントダウン用タイマー
    landingBlockedTimer: 0, // 着艦不可警告の連続再生防止タイマー

    // --- 新規追加パラメータ（20260518_alpha4） ---
    damageTaken: 0, // 累積被弾ダメージ
    operationTime: 0, // プレイ時間（秒数・カウント）
    operationFrameCount: 0, // プレイ時間のフレーム数

    // タイトル画面演出用
    titleShipY: 0,
    titleShipVy: 0,
    titleLaunchTimer: 0,
    fadeAlpha: 0,
    titleSortieTextTimer: 0,
    titleLeftTrailHistory: [],
    titleRightTrailHistory: [],

    // レベルアップ画面用
    levelUpSelectedIndex: 0,
    levelUpCursorX: 0,
    levelUpCursorHoverTimer: 0,
    levelUpState: 'CHOOSING', // 'CHOOSING' or 'DECIDED'
    levelUpDecidedTimer: 0,
    levelUpDecidedIndex: 0,
    levelUpCards: [],
    levelUpNonSelectedY: 0,

    // リザルト画面用
    resultTimer: 0,
    resultShowIndex: 0, // 現在表示中の明細行
    resultSelection: 0, // 0: RETURN TO GARAGE, 1: RETRY MISSION
    resultSelectionBlink: 0,
    resultStampScale: 3,
    resultStampTimer: 0,
    resultShakeTimer: 0,
    resultSieloText: "",
    resultSieloShowCharCount: 0,
    resultSieloTimer: 0,
    resultParams: null
};

// keys and mouse are now managed by InputManager

// ゲーム初期化関数
function resetGame() {
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

    entities.enemies = [];
    entities.bullets = [];
    entities.enemyBullets = [];
    entities.particles = [];
    entities.gems = [];
    entities.missiles = [];
    entities.debris = [];
    entities.explosions = [];

    // 敵母艦の初期化
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


    const credits = document.getElementById('credits-panel');
    if (credits) credits.style.display = 'none';
    const cielo = document.getElementById('cielo-comm');
    if (cielo) cielo.style.display = 'none';

    Cielo.play("ミッションは敵撃破10機！いってらっしゃい傭兵さん！");
}

// シーン管理オブジェクト
const SceneManager = {
    title: new TitleScene(),
    result: new ResultScene()
};

function initResultScreen(isClear) {
    GAME.state = 'RESULT';
    GAME.isResultTriggered = true;

    const score = GAME.killCount;
    const damageTaken = Math.floor(GAME.damageTaken);
    const operationTime = GAME.operationTime;

    // 経費精算計算
    const baseReward = isClear ? 5000 : 0;
    const bounty = score * 100;
    const timeBonus = isClear ? Math.max(0, 180 - operationTime) * 10 : 0; // 180秒以内なら秒あたり10C

    const revenue = baseReward + bounty + timeBonus;

    const repairCost = damageTaken * 1;
    const emergencyFee = !isClear ? Math.floor(revenue * 0.3) : 0; // 撃墜・途中撤退時は総収入の30%

    const expenses = repairCost + emergencyFee;
    const netProfit = revenue - expenses;

    // 累積クレジットへの反映
    GAME.credits += netProfit;

    // シエロの通信傍受テキスト確定
    let msg = "";
    if (isClear) {
        if (damageTaken === 0) {
            if (operationTime >= 120) {
                msg = "2分オーバーの長期戦、お疲れ様です！ 無傷なんてさすがですねー！";
            } else {
                msg = "お疲れ様ですー。今回は修理費ゼロ、完璧な仕事ですね！";
            }
        } else {
            if (operationTime >= 120 && damageTaken >= 150) {
                msg = "あちゃー、欲張って残業するからですよー。はい、回収費と修理費、ドーンと引かせていただきますねー。";
            } else {
                msg = "あー、帰還お疲れ様です。結構機体がボロボロですねぇ……。修理費、引かせていただきますねー。";
            }
        }
    } else {
        if (operationTime <= 30 && netProfit < 0) {
            msg = "あちゃー、派手にやられましたね。今月は赤字ですよ？ 死ぬ気で働いて返してくださいねー。";
        } else {
            msg = "傭兵さん、生きててよかったです！ でも修理費で赤字かも……次は気をつけてくださいね！";
        }
    }

    GAME.resultParams = {
        isClear: isClear,
        score: score,
        damageTaken: damageTaken,
        operationTime: operationTime,
        baseReward: baseReward,
        bounty: bounty,
        timeBonus: timeBonus,
        revenue: revenue,
        repairCost: repairCost,
        emergencyFee: emergencyFee,
        expenses: expenses,
        netProfit: netProfit
    };

    GAME.resultTimer = 0;
    GAME.resultShowIndex = 0;
    GAME.resultStampScale = 3.0;
    GAME.resultStampTimer = 0;
    GAME.resultShakeTimer = 0;

    GAME.resultSieloText = msg;
    GAME.resultSieloShowCharCount = 0;
    GAME.resultSieloTimer = 0;
    GAME.resultSelection = 0;
    GAME.resultSelectionBlink = 0;


    const creditsElem = document.getElementById('credits-panel');
    if (creditsElem) creditsElem.style.display = 'none';
    const cieloElem = document.getElementById('cielo-comm');
    if (cieloElem) cieloElem.style.display = 'none';
    const statsElem = document.getElementById('stats-panel');
    if (statsElem) statsElem.style.display = 'none';
    const countdownElem = document.getElementById('countdown-overlay');
    if (countdownElem) countdownElem.style.display = 'none';
}

// 入力イベント
window.addEventListener('keydown', e => {
    // タイトル画面中のキー入力
    if (GAME.state === 'TITLE') {
        if (e.key.length === 1 || e.code === 'Space' || e.code === 'Enter') {
            if (GAME.titleLaunchTimer === 0) {
                GAME.titleLaunchTimer = 1; // 出撃決定演出開始
                GAME.fadeAlpha = 0;
            }
        }
        return;
    }

    // リザルト画面中のキー入力
    if (GAME.state === 'RESULT') {
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
        return;
    }

    // レベルアップ画面中のキー入力
    if (GAME.state === 'LEVEL_UP') {
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
        return;
    }

    if (e.code === 'KeyX' && !e.repeat && GAME.state === 'PLAYING' && !GAME.launchSequence && !player.isLandingSequence && !GAME.isPlayerDying) {
        GAME.controlMode = GAME.controlMode === 'MOUSE_AIM' ? 'SUBSPACE' : 'MOUSE_AIM';
        Cielo.play(GAME.controlMode === 'MOUSE_AIM' ? "マウスエイムモードですー" : "サブスペースモードですー");
    } else if (e.code === 'KeyC' && !e.repeat && GAME.state === 'PLAYING' && !GAME.launchSequence && !player.isLandingSequence && !GAME.isPlayerDying) {
        CommStateManager.handleInput(e);
    } else if (GAME.commState && GAME.commState !== 'INACTIVE') {
        CommStateManager.handleActiveInput(e);
    } else if (GAME.state === 'PLAYING' && !e.repeat) {
        if (e.code === 'Digit1' || e.code === 'Numpad1') {
            playerStats.hp = playerStats.maxHp;
            player.isOverheated = false;
            player.overheatTimer = 0;
            GAME.damageFlashTimer = 0;
            Cielo.play("HP全快ですー");
        } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
            GAME.debugEnemyRespawnEnabled = !GAME.debugEnemyRespawnEnabled;
            Cielo.play(GAME.debugEnemyRespawnEnabled ? "敵リスポーンONですー" : "敵リスポーンOFFですー");
        } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
            clearAllEnemiesInstantly();
            Cielo.play("敵を全滅させましたー");
        } else if (e.code === 'Digit5' || e.code === 'Numpad5') {
            // EXPを足すだけではなく、即座にレベルアップとストック付与を行う
            playerStats.level++;
            playerStats.levelUpStock = (playerStats.levelUpStock || 0) + 1;
            playerStats.nextLevelExp = Math.floor(playerStats.nextLevelExp * CONFIG.LEVEL_UP_EXP_MULT);
            Cielo.play("リミット解除が可能です！");
        } else if (e.code === 'Digit6' || e.code === 'Numpad6') {
            if (entities.enemyMothership && !entities.enemyMothership.isDead) {
                entities.enemyMothership.hp = 0;
                Cielo.play("敵母艦を強制破壊しましたー");
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
            Cielo.play("ミッション強制クリアですー");
        }
    }
});
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    GAME.width = canvas.width;
    GAME.height = canvas.height;
});

// ==========================================
// 5 Ship / PlayerShip / EnemyShip クラス定義
// ==========================================

/**
 * 基底クラス: Ship
 * 自機（PlayerShip）と敵機（EnemyShip）の共通プロパティを集約する。
 * ロジック（メソッド）はこのフェーズでは一切含めない。
 */
class Ship {
    constructor({ x = 0, y = 0, vx = 0, vy = 0, hp = 0, maxHp = 0 } = {}) {
        // 位置・速度
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        // 耐久値
        this.hp = hp;
        this.maxHp = maxHp;
        // ダメージフラッシュ
        this.flashTimer = 0;
        // ヒートゲージ
        this.heat = 0;
        this.isOverheated = false;
        this.overheatTimer = 0;
        // 軌跡履歴
        this.trailHistory = [];
    }
}

/**
 * 派生クラス: PlayerShip
 * 自機特有のプロパティをコンストラクタで初期化する。
 * ※ hp/maxHp/heat は playerStats オブジェクトで管理されるため、
 *   Ship基底クラスのデフォルト値(0)のまま。
 */
class PlayerShip extends Ship {
    constructor() {
        super({ x: 0, y: -90, vx: 0, vy: 0 });
        // 機体・砲塔の向き
        this.bodyAngle = -Math.PI / 2;
        this.turretAngle = -Math.PI / 2;
        // 射撃関連
        this.missileCooldown = 0;
        this.fireTimer = 0;
        // 着艦シーケンス
        this.isLandingSequence = false;
        this.landingPhase = 'NONE';
        this.landingTimer = 0;
        this.landingForClear = false;
        // トレイル履歴
        this.leftTrailHistory = [];
        this.rightTrailHistory = [];
        this.leftWindTrailHistory = [];
        this.rightWindTrailHistory = [];
        // ブーストゲージ
        this.boostGauge = 80;
        this.boostActiveTimer = 0;
        this.boostCooldownTimer = 0;
        // その他
        this.needsResupplyVisual = false;
        this.prevVx = 0;
        this.prevVy = 0;
        this._hpWarningPlayed = false;
    }
}

/**
 * 派生クラス: EnemyShip
 * 敵機特有のプロパティをコンストラクタで初期化する。
 * 引数としてスポーン時のパラメータを受け取る。
 */
class EnemyShip extends Ship {
    constructor({
        x, y, vx = 0, vy = 0,
        hp, maxHp,
        personality, spdMult, turnMult, attackMult,
        fireTimer = 0, nextShootInterval = CONFIG.ENEMY_FIRE_RATE,
        isLaunching = true, launchTimer = 60
    }) {
        super({ x, y, vx, vy, hp, maxHp });
        // 性格パラメータ
        this.personality = personality;
        this.spdMult = spdMult;
        this.turnMult = turnMult;
        this.attackMult = attackMult;
        // 射撃関連
        this.fireTimer = fireTimer;
        this.nextShootInterval = nextShootInterval;
        // エイムオフセット
        this.aimOffset = 0;
        this.aimOffsetTimer = 0;
        // ドッグファイト/すれ違い用
        this.offsetX = 0;
        this.offsetY = 0;
        this.dogfightTimer = 0;
        // 機体角度（敵固有: e.angle でアクセスされるため bodyAngle とは別名）
        this.angle = 0;
        // 射出シークエンス
        this.isLaunching = isLaunching;
        this.launchTimer = launchTimer;
    }
}

const player = new PlayerShip();



const entities = {
    enemies: [],
    bullets: [],
    enemyBullets: [],
    particles: [], // スラスターの軌跡や爆発用
    gems: [],      // 経験値ジェム
    missiles: [],  // プレイヤーのミサイル
    debris: [],    // 破片
    explosions: [], // 爆発
};

// Phase 3: 多重スクロール星背景 (Parallax Starfield)
const stars = [];
CONFIG.STAR_LAYERS.forEach(layer => {
    for (let i = 0; i < layer.count; i++) {
        stars.push({ x: Math.random() * GAME.width, y: Math.random() * GAME.height, layer: layer });
    }
});

// パーティクル（破片）生成関数 (通常被弾用・当たり判定なし)
function spawnDebris(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * CONFIG.DEBRIS_SPEED_MULT + 1.0;
        entities.debris.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: color,
            size: 2 + Math.random() * 2, // 2〜4pxの小さな破片
            life: 1.0,
            decay: 1.0 / 30, // 0.5秒で素早く消滅
            harmful: false // 被弾時の破片はダメージなし
        });
    }
}

// 有害な破片の生成関数（爆破時に元の機体の慣性を引き継いで飛ぶ・当たり判定あり）
function spawnDeathDebris(x, y, color, baseVx, baseVy) {
    // 数は設定値（DEBRIS_COUNT_MIN〜DEBRIS_COUNT_MAX）のランダム
    const count = CONFIG.DEBRIS_COUNT_MIN + Math.floor(Math.random() * (CONFIG.DEBRIS_COUNT_MAX - CONFIG.DEBRIS_COUNT_MIN + 1));
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.0 + Math.random() * CONFIG.DEBRIS_SPEED_MULT;

        // デブリのサイズは自機サイズ（CONFIG.PLAYER_SIZE_W = 30）の 1/2 〜 1/3
        // すなわち、10px 〜 15px
        const size = CONFIG.PLAYER_SIZE_W / 3 + Math.random() * (CONFIG.PLAYER_SIZE_W / 2 - CONFIG.PLAYER_SIZE_W / 3);

        entities.debris.push({
            x: x, y: y,
            vx: baseVx * 0.5 + Math.cos(angle) * speed, // 慣性を50%引き継ぎつつ飛び散る
            vy: baseVy * 0.5 + Math.sin(angle) * speed,
            color: color,
            size: size,
            life: 1.0,
            decay: 1.0 / CONFIG.DEBRIS_LIFE, // 5秒で消滅
            harmful: true // 敵味方問わずダメージあり
        });
    }
}

// 爆発エフェクトの生成関数（敵味方にダメージを与える爆風、またはタイトル用演出）
function spawnExplosion(x, y, isPlayer = false, isFlavor = false, sizeMultiplier = 1.0, durationMultiplier = 1.0, isMissileFlare = false, damageMultiplier = 1.0) {
    let maxRadius = CONFIG.EXPLOSION_RADIUS * sizeMultiplier;
    if (isFlavor) maxRadius *= 0.4;

    let duration = Math.floor(CONFIG.EXPLOSION_DURATION * durationMultiplier);

    // フレア内の円配置用ランダムベクトルとオフセット（中心からズレる割合）
    const angle = Math.random() * Math.PI * 2;
    // 中円は半径が 0.75 なので、最大ズレ量は 0.25
    const offsetMid = Math.random() * 0.25;
    // 小円は半径が 0.5 なので、最大ズレ量は 0.5
    const offsetSmall = Math.random() * 0.5;

    entities.explosions.push({
        x: x,
        y: y,
        maxRadius: maxRadius,
        timer: duration,
        maxTimer: duration,
        damagedEntities: new Set(), // 重複ダメージ防止用
        isPlayerExplosion: isPlayer,
        isFlavor: isFlavor,
        isMissileFlare: isMissileFlare,
        damageMultiplier: damageMultiplier,
        angle: angle,
        offsetMid: offsetMid,
        offsetSmall: offsetSmall
    });
}

function spawnEnemyDropItems(x, y, baseVx = 0, baseVy = 0) {
    const spawnItem = (kind, sprite, exp, heal, sizeMult = 1) => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 4;
        entities.gems.push({
            x: x,
            y: y,
            vx: baseVx * 0.35 + Math.cos(angle) * speed,
            vy: baseVy * 0.35 + Math.sin(angle) * speed,
            kind: kind,
            exp: exp,
            heal: heal,
            locked: false,
            speed: CONFIG.GEM_MAGNET_BASE_SPEED,
            sprite: sprite,
            sizeMult: sizeMult
        });
    };

    spawnItem('EXP', SpriteCache.gem, CONFIG.GEM_BASE_EXP, 0, 1.0);

    if (Math.random() < CONFIG.HEAL_ITEM_DROP_CHANCE) {
        spawnItem('HEAL', SpriteCache.gemHeal, 0, CONFIG.HEAL_ITEM_AMOUNT, 1.0);
    }

    if (Math.random() < CONFIG.BIG_EXP_DROP_CHANCE) {
        spawnItem('BIG_EXP', SpriteCache.gemBigExp, CONFIG.GEM_BASE_EXP * CONFIG.BIG_EXP_MULT, 0, CONFIG.BIG_EXP_SIZE_MULT);
    }
}

function clearAllEnemiesInstantly() {
    for (let i = entities.enemies.length - 1; i >= 0; i--) {
        const e = entities.enemies[i];
        spawnExplosion(e.x, e.y);
        spawnDeathDebris(e.x, e.y, getEnemyColor(e), e.vx, e.vy);
        entities.enemies.splice(i, 1);
    }
    entities.enemyBullets.length = 0;
    GAME.killCount = Math.max(GAME.killCount, CONFIG.MISSION_QUOTA);
    GAME.quotaReminderTimer = 0;
}

function getEnemyColor(e) {
    if (e.personality === 'RAMMER') return CONFIG.COLOR_ENEMY_RAMMER;
    if (e.personality === 'SNIPER') return CONFIG.COLOR_ENEMY_SNIPER;
    return CONFIG.COLOR_ENEMY_DOGFIGHTER;
}

// 敵機の爆破・撃破プロセス
function killEnemy(e, i) {
    let enemyColor = getEnemyColor(e);
    spawnExplosion(e.x, e.y);
    spawnDeathDebris(e.x, e.y, enemyColor, e.vx, e.vy);
    spawnEnemyDropItems(e.x, e.y, e.vx, e.vy);

    GAME.credits += 100;
    GAME.killCount++;

    // 撃破時通信
    if (GAME.killCount === 5) {
        Cielo.play("敵5機撃破！あと半分ですよ！");
    } else if (GAME.killCount === CONFIG.MISSION_QUOTA) {
        Cielo.play("ノルマ達成ですー、無理せず帰ってきてくださいね");
    }

    entities.enemies.splice(i, 1);
}

// ==========================================
// プレイヤーダメージ一元処理 & Limit Burst (Auto Repair)
// ==========================================
function damagePlayer(amount) {
    if (GAME.isPlayerDying || playerStats.hp <= 0) return;

    playerStats.hp -= amount;
    GAME.damageTaken += amount;
    GAME.damageFlashTimer = CONFIG.FLASH_DURATION;

    // Limit Burst: Auto Repair (hull >= 6)
    if (playerStats.hp <= 0 && (playerStats.upgrades.hull || 0) >= 6) {
        if ((playerStats.autoRepairCooldown || 0) <= 0) {
            playerStats.hp = playerStats.maxHp * 0.5;
            playerStats.autoRepairCooldown = 10800; // 3 minutes at 60 FPS
            Cielo.play("オートリペア発動！致命傷を回避しました！", "system");
            // エフェクト生成
            for (let i = 0; i < 30; i++) {
                entities.particles.push({
                    x: player.x + (Math.random() - 0.5) * 60,
                    y: player.y + (Math.random() - 0.5) * 60,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3,
                    life: 1.0, decay: 0.02, size: 6 + Math.random() * 6, color: '#0f0', type: 'CROSS'
                });
            }
            return; // 死亡回避
        }
    }
}

// 自機の爆破・死亡プロセス開始
function triggerPlayerDeath() {
    if (GAME.isPlayerDying) return;
    GAME.isPlayerDying = true;
    player.vx = 0;
    player.vy = 0;

    Cielo.play("傭兵さん！傭兵さーーん！");

    // 自機の爆発
    spawnExplosion(player.x, player.y, true);

    // 自機の慣性を引き継いだ緑色の有害破片を撒き散らす
    spawnDeathDebris(player.x, player.y, '#0f0', player.vx, player.vy);
}

// ==========================================
// 3. ゲームループとロジック
// ==========================================
function update() {
    // プレイ中のフェードイン処理
    if (GAME.state === 'PLAYING') {
        if (GAME.fadeAlpha > 0) {
            GAME.fadeAlpha -= 1.0 / 45; // 0.75秒でフェードイン
            if (GAME.fadeAlpha < 0) GAME.fadeAlpha = 0;
        }
    }

    if (GAME.state === 'TITLE') {
        SceneManager.title.update();
        return;
    }
    if (GAME.state === 'LEVEL_UP') {
        updateLevelUpScreen();
        return;
    }
    if (GAME.state === 'RESULT') {
        SceneManager.result.update();
        return;
    }
    if (GAME.state !== 'PLAYING') return;

    // 経過時間カウントアップ
    if (!GAME.launchSequence && !player.isLandingSequence && !GAME.isPlayerDying) {
        GAME.operationFrameCount++;
        if (GAME.operationFrameCount % 60 === 0) {
            GAME.operationTime++;
        }
    }

    // 加速度（ACC）計算のため、現在の速度を前のフレームの速度として保存
    player.prevVx = player.vx;
    player.prevVy = player.vy;

    // --- Launch Sequence Countdown Update ---
    if (GAME.launchSequence) {
        GAME.launchTimer = (GAME.launchTimer || 0) + 1;

        if (GAME.launchTimer === 1) {
            Cielo.play("カタパルト接続完了！出撃システム起動！");
        }

        if (GAME.launchTimer > 240) {
            // Launch sequence complete!
            GAME.launchSequence = false;
        } else if (GAME.launchTimer > 180) {
            // GO! boost behavior:
            player.vx = 0;
            player.vy = -12; // Out of dock boost!
            player.bodyAngle = -Math.PI / 2;
            player.turretAngle = -Math.PI / 2;
        }
    }

    // HUD and credits visibility sync
    document.getElementById('credits-panel').style.display = GAME.launchSequence ? 'none' : 'block';
    document.getElementById('stats-panel').style.display = GAME.launchSequence ? 'none' : 'block';
    document.getElementById('cielo-comm').style.display = 'block';

    // --- Phase 2: 物理と操作 (Drift Physics) ---
    const canControl = !GAME.isPlayerDying && !player.isLandingSequence && !GAME.launchSequence;
    if (canControl) {
        //playerStats.handling = CONFIG.PLAYER_BASE_HANDLING + (playerStats.upgrades.handling - 1) * 0.015;
        playerStats.handling = CONFIG.PLAYER_BASE_HANDLING + (playerStats.upgrades.maneuver || 0) * 0.015;

    }

    // --- ブーストゲージ (SHIFT) ---
    if (!GAME.isPlayerDying && !player.isLandingSequence) {
        if (playerStats.autoRepairCooldown > 0) {
            playerStats.autoRepairCooldown--;
        }

        if (player.boostGauge === undefined) {
            player.boostGauge = 80;
            player.boostActiveTimer = 0;
            player.boostCooldownTimer = 0;
        }

        const isHoldingShift = (InputManager.isPressed('ShiftLeft') || InputManager.isPressed('ShiftRight')) && !player.isOverheated;
        const canBoost = player.boostGauge > 0 && player.boostCooldownTimer <= 0;
        const isBoosting = isHoldingShift && canBoost;

        if (isBoosting) {
            if (player.boostActiveTimer === 0) {
                playerStats.heat = Math.min(CONFIG.HEAT_MAX, playerStats.heat + 20); // 使用直後に+20
                Cielo.play("ブースト全開ですね！");
            } else if (player.boostActiveTimer % 5 === 0) {
                playerStats.heat = Math.min(CONFIG.HEAT_MAX, playerStats.heat + 1); // 以後+1/5F
            }

            player.boostGauge--;
            player.boostActiveTimer++;

            if (player.boostGauge <= 0) {
                // 使い続けた場合のクールダウンは6秒 (360F)
                player.boostCooldownTimer = 360;
                player.boostActiveTimer = 0;
            }
        } else {
            if (player.boostActiveTimer > 0) {
                // 途中で離した場合のクールダウンは3秒 (180F)
                player.boostCooldownTimer = 180;
                player.boostActiveTimer = 0;
            }

            if (player.boostCooldownTimer > 0) {
                player.boostCooldownTimer--;
            } else if (player.boostGauge < 80) {
                // クールダウン終了後に回復 (1/F)
                player.boostGauge++;
            }
        }
    }

    if (canControl) {
        const turnLeft = InputManager.isPressed('KeyA') || InputManager.isPressed('ArrowLeft');
        const turnRight = InputManager.isPressed('KeyD') || InputManager.isPressed('ArrowRight');
        const hasManualTurn = turnLeft || turnRight;

        if (turnLeft) {
            player.bodyAngle -= playerStats.handling;
        }
        if (turnRight) {
            player.bodyAngle += playerStats.handling;
        }

        if (GAME.controlMode === 'SUBSPACE') {
            player.turretAngle = player.bodyAngle;
        } else {
            const mouse = InputManager.getMouse();
            const mouseAngle = Math.atan2(mouse.y - GAME.height / 2, mouse.x - GAME.width / 2);
            player.turretAngle = mouseAngle;
        }

        let thrust = 0;
        let moveForward = InputManager.isPressed('KeyW') || InputManager.isPressed('ArrowUp');

        // ブースト押下時に前進が押されてない場合は、押されているものとみなして前進ベクトルを追加
        if (player.boostActiveTimer > 0 && !moveForward) {
            moveForward = true;
        }

        if (moveForward) thrust += playerStats.moveSpeed;

        // ブースト時の速度と加速度の拡張係数
        let boostSpeedMult = 1.0;
        let boostAccelMult = 1.0;

        if (player.boostActiveTimer > 0) {
            boostSpeedMult = 3.0;
            if (player.boostActiveTimer <= 12) {
                boostAccelMult = 20.0; // 発動直後0.2秒は加速度20倍
            } else {
                boostAccelMult = 10.0; // その後は加速度10倍
            }
        }

        const currentMaxSpeed = playerStats.maxSpeed * boostSpeedMult;

        if (thrust !== 0) {
            // 現在の機体の向き（bodyAngle）へ推力ベクトルを加算（Subspace Continuum風）
            const accel = thrust * boostAccelMult * 0.12;
            player.vx += Math.cos(player.bodyAngle) * accel;
            player.vy += Math.sin(player.bodyAngle) * accel;
        }

        // 後退（Sキー）時はブレーキおよび微速後退として処理
        if (InputManager.isPressed('KeyS') || InputManager.isPressed('ArrowDown')) {
            player.vx *= 0.95; // 強いブレーキ効果
            player.vy *= 0.95;
            const reverseAccel = playerStats.moveSpeed * 0.3;
            player.vx -= Math.cos(player.bodyAngle) * reverseAccel;
            player.vy -= Math.sin(player.bodyAngle) * reverseAccel;
        }

        // タクティカル・ブレーキ (Limit Burst: maneuver >= 6)
        if (InputManager.isPressed('KeyQ') && (playerStats.upgrades.maneuver || 0) >= 6) {
            player.vx *= 0.7; // 急激な減衰
            player.vy *= 0.7;
            // ブレーキ時に火花を散らす
            if (Math.hypot(player.vx, player.vy) > 1.0 && Math.random() < 0.5) {
                entities.particles.push({
                    x: player.x + (Math.random() - 0.5) * 20,
                    y: player.y + (Math.random() - 0.5) * 20,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 1.0, decay: 0.05, size: 2 + Math.random() * 2, color: '#f80', type: 'SPARK'
                });
            }
        }

        // Friction (摩擦係数) - 氷を滑るような感覚を維持
        player.vx *= CONFIG.FRICTION;
        player.vy *= CONFIG.FRICTION;

        // Math.hypot を用いた速度クランプ（最高速度の超過を防ぐ）
        const speed = Math.hypot(player.vx, player.vy);
        if (speed > currentMaxSpeed) {
            player.vx = (player.vx / speed) * currentMaxSpeed;
            player.vy = (player.vy / speed) * currentMaxSpeed;
        }

        player.x += player.vx;
        player.y += player.vy;
    } else if (GAME.launchSequence) {
        // 発進カウントダウン中（GO! のみ移動する）
        player.x += player.vx;
        player.y += player.vy;
    } else if (player.isLandingSequence) {
        const cat = getCatapultSpec();
        const targetDown = Math.PI / 2;  // +Y方向（先端→根本）
        const targetUp = -Math.PI / 2;   // -Y方向（発進方向）
        const approachSpeed = 0.08;
        const towSpeed = 0.025;
        const rotateSpeed = 0.04;

        player.vx = 0;
        player.vy = 0;

        if (player.landingPhase === 'TIP_LAND') {
            player.x += (cat.tipX - player.x) * approachSpeed;
            player.y += (cat.tipY - player.y) * approachSpeed;
            player.bodyAngle = rotateTowards(player.bodyAngle, targetDown, 0.08);
            player.turretAngle = player.bodyAngle;

            if (Math.abs(player.x - cat.tipX) < 0.6 && Math.abs(player.y - cat.tipY) < 0.6 && Math.abs(normalizeAngle(player.bodyAngle - targetDown)) < 0.04) {
                player.x = cat.tipX;
                player.y = cat.tipY;
                player.bodyAngle = targetDown;
                player.turretAngle = targetDown;
                player.leftTrailHistory = [];
                player.rightTrailHistory = [];
                if (player.landingForClear) {
                    Cielo.play("カタパルトロック。着艦完了です");
                } else {
                    Cielo.play("着艦シーケンス開始します");
                }
                player.landingPhase = 'TOW_TO_ROOT';
            }
        } else if (player.landingPhase === 'TOW_TO_ROOT') {
            player.x += (cat.rootX - player.x) * towSpeed;
            player.y += (cat.rootY - player.y) * towSpeed;
            player.bodyAngle = targetDown;
            player.turretAngle = targetDown;

            if (Math.abs(player.x - cat.rootX) < 0.6 && Math.abs(player.y - cat.rootY) < 0.6) {
                player.x = cat.rootX;
                player.y = cat.rootY;
                player.landingPhase = 'ROTATE_UP';
            }
        } else if (player.landingPhase === 'ROTATE_UP') {
            player.x = cat.rootX;
            player.y = cat.rootY;
            player.bodyAngle = rotateTowards(player.bodyAngle, targetUp, rotateSpeed);
            player.turretAngle = rotateTowards(player.turretAngle, targetUp, rotateSpeed);

            if (Math.abs(normalizeAngle(player.bodyAngle - targetUp)) < 0.04 && Math.abs(normalizeAngle(player.turretAngle - targetUp)) < 0.04) {
                player.bodyAngle = targetUp;
                player.turretAngle = targetUp;
                if (player.landingForClear) {
                    Cielo.play("おかえりなさい。お疲れ様でした！");
                    player.landingPhase = 'WAIT_CLEAR';
                    player.landingTimer = 180;
                } else {
                    // 補給着艦：HPが最大か否かでメッセージ分岐
                    if (playerStats.hp >= playerStats.maxHp) {
                        Cielo.play("あれ？何しに戻ってきたんですか？ さあ、お仕事が待ってますよ！");
                        player.needsResupplyVisual = false;
                        player.landingTimer = 60; // 1秒で追い出し
                    } else {
                        Cielo.play("お疲れ様でした。補給は任せてください");
                        playerStats.hp = playerStats.maxHp;
                        player.needsResupplyVisual = true;
                        player.landingTimer = 120; // 修理があるときは2秒
                    }
                    player.landingPhase = 'RESUPPLY';
                }
            }
        } else if (player.landingPhase === 'RESUPPLY') {
            player.x = cat.rootX;
            player.y = cat.rootY;
            player.bodyAngle = targetUp;
            player.turretAngle = targetUp;
            player.landingTimer--;
            if (player.landingTimer <= 0) {
                if ((playerStats.levelUpStock || 0) > 0) {
                    // 補給完了後、ストックがあれば全画面レベルアップへ移行
                    playerStats.levelUpStock--;
                    Cielo.play("溜まったエネルギーを機体に適応させます！");

                    GAME.levelUpCards = [];
                    let available = [...upgradePool].filter(u => {
                        const currentLvl = playerStats.upgrades[u.id] || 0;
                        return currentLvl < u.maxLevel;
                    });
                    for (let i = 0; i < 3 && available.length > 0; i++) {
                        const idx = Math.floor(Math.random() * available.length);
                        GAME.levelUpCards.push(available.splice(idx, 1)[0]);
                    }

                    GAME.state = 'LEVEL_UP';
                    GAME.levelUpState = 'CHOOSING';
                    GAME.levelUpSelectedIndex = 0;
                    GAME.levelUpCursorX = (GAME.width - (260 * 3 + 40 * 2)) / 2 + 130;
                    GAME.levelUpDecidedIndex = -1;
                    GAME.levelUpDecidedTimer = 0;
                    GAME.levelUpCursorHoverTimer = 0;
                    GAME.levelUpNonSelectedY = 0;
                } else {
                    // 補給完了＆ストックなし→再発艦カウントダウン開始
                    player.isLandingSequence = false;
                    player.landingPhase = 'NONE';
                    player.vx = 0;
                    player.vy = 0;
                    GAME.launchSequence = true;
                    GAME.launchTimer = 0;
                }
            }
        } else if (player.landingPhase === 'WAIT_CLEAR') {
            player.x = cat.rootX;
            player.y = cat.rootY;
            player.bodyAngle = targetUp;
            player.turretAngle = targetUp;
            player.landingTimer--;
            if (player.landingTimer <= 0 && !GAME.isResultTriggered) {
                SceneManager.result.init(true);
            }
        }
    }

    // 最も近い敵を探索（自動エイム用）
    let nearestEnemy = null;
    let minDist = Infinity;
    for (let e of entities.enemies) {
        let d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d < minDist) {
            minDist = d;
            nearestEnemy = e;
        }
    }

    // (Old particle emitter removed - now handled fully by ribbon trail)

    // --- ヒートゲージ＆自動エイム射撃ロジック ---
    // ヒート管理のため、射撃は「右クリック or スペースキー」を押している間のみ作動（死亡・着艦演出時は撃てない）
    const mouse = InputManager.getMouse();
    const isFiringInput = !GAME.isPlayerDying && !player.isLandingSequence && (InputManager.isPressed('Space') || mouse.rightDown);

    if (player.isOverheated) {
        player.overheatTimer--;
        playerStats.heat -= (CONFIG.HEAT_MAX / CONFIG.HEAT_OVERHEAT_PENALTY); // ペナルティ時間で0まで冷却
        if (player.overheatTimer <= 0) {
            playerStats.heat = 0;
            player.isOverheated = false;
        }
    } else {
        if (!isFiringInput) {
            // 射撃していない時は自然冷却
            playerStats.heat = Math.max(0, playerStats.heat - CONFIG.HEAT_COOL_RATE);
        }
    }

    if (isFiringInput && !player.isOverheated) {
        player.fireTimer++;
        if (player.fireTimer >= playerStats.fireRate) {
            player.fireTimer = 0;
            if ((playerStats.upgrades.fireRate || 0) < 6) {
                playerStats.heat += CONFIG.HEAT_PER_SHOT;
            }

            if (playerStats.heat >= CONFIG.HEAT_MAX) {
                playerStats.heat = CONFIG.HEAT_MAX;
                player.isOverheated = true;
                player.overheatTimer = CONFIG.HEAT_OVERHEAT_PENALTY;
            }

            const fireAngle = GAME.controlMode === 'SUBSPACE' ? player.bodyAngle : player.turretAngle;
            for (let i = 0; i < playerStats.bulletCount; i++) {
                const spread = (i - (playerStats.bulletCount - 1) / 2) * CONFIG.BULLET_SPREAD_ANGLE;
                entities.bullets.push({
                    x: player.x + Math.cos(fireAngle) * (CONFIG.PLAYER_SIZE_W / 2),
                    y: player.y + Math.sin(fireAngle) * (CONFIG.PLAYER_SIZE_W / 2),
                    vx: Math.cos(fireAngle + spread) * CONFIG.BULLET_SPEED + player.vx * 0.5,
                    vy: Math.sin(fireAngle + spread) * CONFIG.BULLET_SPEED + player.vy * 0.5,
                    life: CONFIG.BULLET_LIFE
                });
            }
        }
    } else if (!isFiringInput) {
        // 撃っていない間は次弾が即座に出るようにタイマーをリセットしておく
        player.fireTimer = playerStats.fireRate;
    }

    // --- ミサイル発射 (E) ---
    if (!GAME.isPlayerDying && !player.isLandingSequence && (!GAME.commState || GAME.commState === 'INACTIVE') && InputManager.isPressed('KeyE') && player.missileCooldown <= 0 && !player.isOverheated) {
        player.missileCooldown = CONFIG.MISSILE_COOLDOWN;

        // ロックオン処理 (前方90度)
        let target = null;
        let minDistToM = Infinity;
        const fireAngle = GAME.controlMode === 'SUBSPACE' ? player.bodyAngle : player.turretAngle;
        entities.enemies.forEach(e => {
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            const dist = Math.hypot(dx, dy);
            const angleToEnemy = Math.atan2(dy, dx);
            // 角度差を計算
            let diff = normalizeAngle(angleToEnemy - fireAngle);
            diff = Math.abs(diff);

            if (diff < Math.PI / 4 && dist < 1200) {
                if (dist < minDistToM) {
                    minDistToM = dist;
                    target = e;
                }
            }
        });

        entities.missiles.push({
            x: player.x,
            y: player.y,
            vx: player.vx + Math.cos(fireAngle) * 5,
            vy: player.vy + Math.sin(fireAngle) * 5,
            angle: fireAngle,
            target: target,
            life: 300,
            speed: CONFIG.MISSILE_SPEED,
            turnRate: CONFIG.MISSILE_TURN_RATE
        });
        Cielo.play("ミサイル、いってらっしゃーい！");
    }
    if (player.missileCooldown > 0) player.missileCooldown--;

    // --- Phase 3: 多重スクロール背景座標更新 ---
    if (!GAME.isPlayerDying && GAME.state === 'PLAYING') {
        stars.forEach(s => {
            s.x -= player.vx * s.layer.rate;
            s.y -= player.vy * s.layer.rate;
            if (s.x < 0) s.x += GAME.width;
            if (s.x > GAME.width) s.x -= GAME.width;
            if (s.y < 0) s.y += GAME.height;
            if (s.y > GAME.height) s.y -= GAME.height;
        });
    }

    // --- エンティティの更新 ---
    for (let i = entities.particles.length - 1; i >= 0; i--) {
        let p = entities.particles[i];
        p.x += p.vx; p.y += p.vy;
        p.life -= p.decay || CONFIG.PARTICLE_DECAY;
        if (p.life <= 0) entities.particles.splice(i, 1);
    }

    // デブリ（破片）の更新と衝突判定
    for (let i = entities.debris.length - 1; i >= 0; i--) {
        let d = entities.debris[i];
        d.x += d.vx; d.y += d.vy;
        d.life -= d.decay;

        // 有害な破片が移動する際に後ろに煙パーティクル（軌跡）をはき出す
        if (d.harmful && d.life > 0.1 && Math.random() < 0.25) {
            entities.particles.push({
                x: d.x,
                y: d.y,
                // 進行方向と逆向きにゆっくり放出する
                vx: -d.vx * 0.15 + (Math.random() - 0.5) * 0.4,
                vy: -d.vy * 0.15 + (Math.random() - 0.5) * 0.4,
                life: 0.6,
                maxLife: 0.6, // 拡大フェードアウトの基準用
                decay: CONFIG.DEBRIS_SMOKE_DECAY,
                type: 'DEBRIS_SMOKE',
                baseSize: d.size * 1.5 // デブリサイズの1.5倍
            });
        }

        // 有害な爆発破片の当たり判定
        if (d.harmful && d.life > 0.1) {
            // 自機への当たり判定
            if (!GAME.isPlayerDying) {
                const dx = player.x - d.x;
                const dy = player.y - d.y;
                const dist = Math.hypot(dx, dy);
                const minDist = d.size / 2 + CONFIG.COLLISION_ENEMY_PLAYER / 2; // 自機半径とデブリ半径の合計
                if (dist < minDist) {
                    // 重なり解消 (デブリ側を大きく押し戻し、自機は少しだけ押し戻す)
                    const overlap = minDist - dist;
                    const nx = dx / (dist || 1);
                    const ny = dy / (dist || 1);

                    d.x -= nx * overlap * 0.8;
                    d.y -= ny * overlap * 0.8;
                    player.x += nx * overlap * 0.2;
                    player.y += ny * overlap * 0.2;

                    // 相対速度による跳ね返り
                    const rvx = player.vx - d.vx;
                    const rvy = player.vy - d.vy;
                    const velAlongNormal = rvx * nx + rvy * ny;

                    if (velAlongNormal < 0) {
                        const crashSpeed = Math.hypot(rvx, rvy);
                        const restitution = CONFIG.COLLISION_RECOIL_RESTITUTION;

                        // 反動を適用 (デブリは大きく跳ね返り、自機はわずかに衝撃を受ける)
                        const dImpulse = (1 + restitution) * crashSpeed * 0.8 + 2.0;
                        const pImpulse = (1 + restitution) * crashSpeed * 0.2 + 0.5;

                        d.vx -= dImpulse * nx;
                        d.vy -= dImpulse * ny;
                        player.vx += pImpulse * nx;
                        player.vy += pImpulse * ny;

                        // 相対速度比例のダメージを適用
                        const damage = CONFIG.COLLISION_DAMAGE_BASE + crashSpeed * CONFIG.COLLISION_DAMAGE_VEL_MULT;
                        damagePlayer(damage);

                        // 被弾演出
                        GAME.damageFlashTimer = CONFIG.FLASH_DURATION;
                        spawnDebris((player.x + d.x) / 2, (player.y + d.y) / 2, '#0f0', 2);

                        // デブリは衝突により耐久力が削られ、少し寿命が減る
                        d.life -= 0.35;
                    }
                }
            }

            // 敵機への当たり判定
            let hitEnemy = false;
            for (let j = entities.enemies.length - 1; j >= 0; j--) {
                let e = entities.enemies[j];
                const dx = e.x - d.x;
                const dy = e.y - d.y;
                const dist = Math.hypot(dx, dy);
                const minDist = d.size / 2 + CONFIG.ENEMY_SIZE_W / 2;
                if (dist < minDist) {
                    // 重なり解消
                    const overlap = minDist - dist;
                    const nx = dx / (dist || 1);
                    const ny = dy / (dist || 1);

                    d.x -= nx * overlap * 0.8;
                    d.y -= ny * overlap * 0.8;
                    e.x += nx * overlap * 0.2;
                    e.y += ny * overlap * 0.2;

                    // 相対速度による跳ね返り
                    const rvx = e.vx - d.vx;
                    const rvy = e.vy - d.vy;
                    const velAlongNormal = rvx * nx + rvy * ny;

                    if (velAlongNormal < 0) {
                        const crashSpeed = Math.hypot(rvx, rvy);
                        const restitution = CONFIG.COLLISION_RECOIL_RESTITUTION;

                        const dImpulse = (1 + restitution) * crashSpeed * 0.8 + 2.0;
                        const eImpulse = (1 + restitution) * crashSpeed * 0.2 + 0.5;

                        d.vx -= dImpulse * nx;
                        d.vy -= dImpulse * ny;
                        e.vx += eImpulse * nx;
                        e.vy += eImpulse * ny;

                        // ダメージ適用
                        const damage = CONFIG.COLLISION_DAMAGE_BASE + crashSpeed * CONFIG.COLLISION_DAMAGE_VEL_MULT;
                        e.hp -= damage;

                        // 被弾演出
                        e.flashTimer = CONFIG.FLASH_DURATION;
                        let enemyColor = getEnemyColor(e);
                        spawnDebris((e.x + d.x) / 2, (e.y + d.y) / 2, enemyColor, 2);

                        // デブリ寿命消費
                        d.life -= 0.35;
                        hitEnemy = true;
                        break;
                    }
                }
            }

            if (d.life <= 0) {
                entities.debris.splice(i, 1);
                continue;
            }
        }

        if (d.life <= 0) entities.debris.splice(i, 1);
    }

    // 爆発（爆風）の更新と当たり判定
    for (let i = entities.explosions.length - 1; i >= 0; i--) {
        let exp = entities.explosions[i];
        exp.timer--;

        const progress = 1 - (exp.timer / exp.maxTimer);

        // --- アニメ風の爆発推移計算 ---
        // 最初の10%で急拡大、中間80%は最大サイズを維持して震える、最後の10%で急縮小
        let scale = 1.0;
        let isShaking = false;
        if (progress < 0.1) {
            scale = Math.sin((progress / 0.1) * (Math.PI / 2)); // Ease-out
        } else if (progress > 0.9) {
            scale = Math.sin(((1.0 - progress) / 0.1) * (Math.PI / 2)); // Ease-in
        } else {
            isShaking = true;
            // 維持中は小刻みに震える
            scale = 1.0 + (Math.random() - 0.5) * 0.15;
        }

        // 描画用の揺れオフセットもここで計算しておく（描画時に利用する）
        exp.shakeX = isShaking ? (Math.random() - 0.5) * 10 : 0;
        exp.shakeY = isShaking ? (Math.random() - 0.5) * 10 : 0;
        exp.currentScale = scale; // 描画側で使うために保存

        const currentRadius = exp.maxRadius * scale;

        // 爆発ダメージ判定 (最初の膨張フェーズのみダメージ判定を発生させる)
        if (progress > 0.02 && progress < 0.15) {
            // 自機への爆風判定（ミサイルのフレアは自機にダメージを与えない）
            if (!exp.isMissileFlare && !GAME.isPlayerDying && !exp.damagedEntities.has('player')) {
                const distToPlayer = Math.hypot(player.x - exp.x, player.y - exp.y);
                if (distToPlayer < currentRadius + CONFIG.PLAYER_SIZE_W / 2) {
                    const damage = CONFIG.EXPLOSION_DAMAGE * (exp.damageMultiplier || 1.0);
                    damagePlayer(damage);
                    spawnDebris(player.x, player.y, '#0f0', 3);
                    exp.damagedEntities.add('player');
                }
            }

            // 敵機への爆風判定
            for (let j = entities.enemies.length - 1; j >= 0; j--) {
                let e = entities.enemies[j];
                if (!exp.damagedEntities.has(e)) {
                    const distToEnemy = Math.hypot(e.x - exp.x, e.y - exp.y);
                    if (distToEnemy < currentRadius + CONFIG.ENEMY_SIZE_W / 2) {
                        const baseDmg = exp.isMissileFlare ? CONFIG.MISSILE_FLARE_DAMAGE : CONFIG.EXPLOSION_DAMAGE;
                        e.hp -= baseDmg * (exp.damageMultiplier || 1.0);
                        e.flashTimer = CONFIG.FLASH_DURATION;

                        let enemyColor = getEnemyColor(e);
                        spawnDebris(e.x, e.y, enemyColor, 3);
                        exp.damagedEntities.add(e);

                        if (e.hp <= 0) {
                            // 連鎖誘発爆発！
                            spawnExplosion(e.x, e.y);
                            spawnDeathDebris(e.x, e.y, enemyColor, e.vx, e.vy);
                            spawnEnemyDropItems(e.x, e.y, e.vx, e.vy);
                            entities.enemies.splice(j, 1);
                        }
                    }
                }
            }
        }

        if (exp.timer <= 0) {
            // 自機の爆発が完全に消えたらゲームオーバーへ移行
            if (exp.isPlayerExplosion) {
                SceneManager.result.init(false);
            }
            entities.explosions.splice(i, 1);
        }
    }

    // 自機の弾の更新
    for (let i = entities.bullets.length - 1; i >= 0; i--) {
        let b = entities.bullets[i];
        b.x += b.vx; b.y += b.vy; b.life--;
        if (b.life <= 0) entities.bullets.splice(i, 1);
    }

    // 敵の弾の更新と自機への衝突判定
    for (let i = entities.enemyBullets.length - 1; i >= 0; i--) {
        let b = entities.enemyBullets[i];
        b.x += b.vx; b.y += b.vy; b.life--;

        if (Math.hypot(b.x - player.x, b.y - player.y) < CONFIG.COLLISION_ENEMY_PLAYER) {
            damagePlayer(b.damage || CONFIG.ENEMY_BULLET_DAMAGE);
            entities.enemyBullets.splice(i, 1);

            // 被弾演出（赤フラッシュ＆破片）
            GAME.damageFlashTimer = CONFIG.FLASH_DURATION;
            spawnDebris(player.x, player.y, '#0f0', 3 + Math.floor(Math.random() * 2));

            if (playerStats.hp <= 0) {
                triggerPlayerDeath();
            }
            continue;
        }

        // ミサイル撃墜判定
        let hitMissile = false;
        for (let j = entities.missiles.length - 1; j >= 0; j--) {
            let m = entities.missiles[j];
            if (Math.hypot(b.x - m.x, b.y - m.y) < 10) { // ミサイルの当たり判定
                spawnExplosion(m.x, m.y, false, false, 0.5, 1.0, true);
                entities.missiles.splice(j, 1);
                hitMissile = true;
                break;
            }
        }
        if (hitMissile) {
            entities.enemyBullets.splice(i, 1);
            continue;
        }

        if (b.life <= 0) entities.enemyBullets.splice(i, 1);
    }

    // --- ミサイル (Missiles) ---
    for (let i = entities.missiles.length - 1; i >= 0; i--) {
        let m = entities.missiles[i];
        if (m.target && m.target.hp <= 0) m.target = null;
        if (!m.target && m.life > 60) m.life = 60; // ターゲットロスト時は早めに自爆

        if (m.target) {
            const tx = m.target.x - m.x;
            const ty = m.target.y - m.y;
            let targetAngle = Math.atan2(ty, tx);
            let diff = targetAngle - m.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            m.angle += Math.sign(diff) * Math.min(Math.abs(diff), m.turnRate);
        }
        m.vx += Math.cos(m.angle) * 0.5;
        m.vy += Math.sin(m.angle) * 0.5;
        const speed = Math.hypot(m.vx, m.vy);
        if (speed > m.speed) {
            m.vx = (m.vx / speed) * m.speed;
            m.vy = (m.vy / speed) * m.speed;
        }
        m.x += m.vx;
        m.y += m.vy;

        // 噴煙（スモーク）の生成
        if (Math.random() < 0.6) {
            entities.particles.push({
                x: m.x - Math.cos(m.angle) * 8, // ミサイル後方から
                y: m.y - Math.sin(m.angle) * 8,
                vx: m.vx * 0.1 + (Math.random() - 0.5) * 0.5,
                vy: m.vy * 0.1 + (Math.random() - 0.5) * 0.5,
                life: 1.0,
                decay: 0.05,
                size: 3 + Math.random() * 3,
                color: Math.random() < 0.5 ? '#fff' : '#ccc',
                type: 'SMOKE'
            });
        }

        // 敵との当たり判定
        let hit = false;
        for (let j = entities.enemies.length - 1; j >= 0; j--) {
            let e = entities.enemies[j];
            if (Math.hypot(e.x - m.x, e.y - m.y) < CONFIG.ENEMY_SIZE_W) {
                e.hp -= 30; // 命中時の直接ダメージ
                e.flashTimer = CONFIG.FLASH_DURATION;
                spawnDebris(e.x, e.y, '#fff', 3);
                hit = true;
                if (e.hp <= 0) {
                    killEnemy(e, j);
                }
                break;
            }
        }
        m.life--;
        if (hit || m.life <= 0) {
            spawnExplosion(m.x, m.y, false, false, 0.5, 1.0, true);

            // Limit Burst: Multi-Missile (missileCount >= 6)
            if ((playerStats.upgrades.missile || 0) >= 6 && !m.isSubMunition) {
                for (let k = 0; k < 3; k++) {
                    let target = null;
                    if (entities.enemies.length > 0) {
                        target = entities.enemies[Math.floor(Math.random() * entities.enemies.length)];
                    } else if (entities.enemyMothership && !entities.enemyMothership.isDead) {
                        target = entities.enemyMothership;
                    }
                    entities.missiles.push({
                        x: m.x, y: m.y,
                        vx: (Math.random() - 0.5) * 10,
                        vy: (Math.random() - 0.5) * 10,
                        angle: Math.random() * Math.PI * 2,
                        speed: CONFIG.MISSILE_SPEED * 1.2,
                        turnRate: CONFIG.MISSILE_TURN_RATE * 1.5,
                        life: CONFIG.MISSILE_LIFE * 0.4,
                        target: target,
                        isSubMunition: true
                    });
                }
            }

            entities.missiles.splice(i, 1);
        }
    }

    // --- Phase 4: 敵AIと衝突判定 ---
    // 敵のスポーン制御 (母艦からの射出システム)
    if (entities.enemyMothership && !entities.enemyMothership.isDead) {
        let em = entities.enemyMothership;
        if (GAME.debugEnemyRespawnEnabled && entities.enemies.length < CONFIG.ENEMY_MAX_COUNT && player.y <= CONFIG.SPAWN_TRIGGER_Y) {
            em.launchTimer--;
            if (em.launchTimer <= 0) {
                em.launchTimer = 180; // 3秒クールダウン

                // 最初のスポーン時の通信
                if (GAME.killCount === 0 && entities.enemies.length === 0) {
                    const dx = em.x - player.x;
                    const dy = em.y - player.y;
                    let clockAngle = Math.atan2(dy, dx) - player.bodyAngle;
                    while (clockAngle < -Math.PI) clockAngle += Math.PI * 2;
                    while (clockAngle > Math.PI) clockAngle -= Math.PI * 2;
                    let oclock = Math.round((clockAngle + Math.PI / 2) / (Math.PI / 6));
                    if (oclock <= 0) oclock += 12;
                    Cielo.play(`${oclock}時にターゲット発見ですー！`);
                }

                // 性格の決定（CONFIGの設定確率に基づく）
                const totalChance = CONFIG.ENEMY_CHANCE_RAMMER + CONFIG.ENEMY_CHANCE_SNIPER + CONFIG.ENEMY_CHANCE_DOGFIGHTER;
                const rand = Math.random() * totalChance;
                let personality = 'DOGFIGHTER';
                let spdMult = 1.0;
                let turnMult = 1.0;
                let attackMult = 1.0;

                if (rand < CONFIG.ENEMY_CHANCE_RAMMER) {
                    personality = 'RAMMER';
                    spdMult = 0.90;
                    turnMult = 1.00;
                    attackMult = 0.50;
                } else if (rand < CONFIG.ENEMY_CHANCE_RAMMER + CONFIG.ENEMY_CHANCE_SNIPER) {
                    personality = 'SNIPER';
                    spdMult = 0.75;
                    turnMult = 0.75;
                    attackMult = 1.10;
                } else {
                    personality = 'DOGFIGHTER';
                    spdMult = 0.80;
                    turnMult = 0.90;
                    attackMult = 0.90;
                }

                const enemyMaxHp = CONFIG.ENEMY_BASE_HP + playerStats.level * CONFIG.ENEMY_HP_LEVEL_MULT;

                // カタパルト位置 (母艦中心から少しズレた位置)
                const spawnX = em.x;
                const spawnY = em.y + 80;

                entities.enemies.push(new EnemyShip({
                    x: spawnX,
                    y: spawnY,
                    hp: enemyMaxHp,
                    maxHp: enemyMaxHp,
                    fireTimer: Math.floor(Math.random() * CONFIG.ENEMY_FIRE_RATE), // 射撃タイミングをばらけさせる
                    nextShootInterval: CONFIG.ENEMY_FIRE_RATE * (0.75 + Math.random() * 0.5), // 射撃間隔の揺らぎ初期値
                    personality: personality,
                    spdMult: spdMult,
                    turnMult: turnMult,
                    attackMult: attackMult,
                    isLaunching: true,
                    launchTimer: 60 // 1秒間かけて射出 (自機は240フレームだが敵は短めに)
                }));
            }
        }
    }

    // --- 敵同士の衝突物理判定 (Enemy-Enemy Collision) ---
    for (let i = 0; i < entities.enemies.length; i++) {
        let e1 = entities.enemies[i];
        if (e1.isLaunching) continue;
        for (let j = i + 1; j < entities.enemies.length; j++) {
            let e2 = entities.enemies[j];
            if (e2.isLaunching) continue;
            const dx = e2.x - e1.x;
            const dy = e2.y - e1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = CONFIG.ENEMY_SIZE_W; // 30px
            if (dist < minDist) {
                // 重なり解消
                const overlap = minDist - dist;
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);
                e1.x -= nx * overlap * 0.5;
                e1.y -= ny * overlap * 0.5;
                e2.x += nx * overlap * 0.5;
                e2.y += ny * overlap * 0.5;

                // 相対速度による跳ね返り計算
                const rvx = e2.vx - e1.vx;
                const rvy = e2.vy - e1.vy;
                const velAlongNormal = rvx * nx + rvy * ny;

                if (velAlongNormal < 0) {
                    const crashSpeed = Math.hypot(rvx, rvy);
                    const impulse = (1 + CONFIG.COLLISION_RECOIL_RESTITUTION) * crashSpeed * 0.5 + 1.2;

                    e1.vx -= impulse * nx;
                    e1.vy -= impulse * ny;
                    e2.vx += impulse * nx;
                    e2.vy += impulse * ny;

                    // 相対速度に基づくダメージ適用
                    const damage = CONFIG.COLLISION_DAMAGE_BASE + crashSpeed * CONFIG.COLLISION_DAMAGE_VEL_MULT;
                    e1.hp -= damage;
                    e2.hp -= damage;

                    e1.flashTimer = CONFIG.FLASH_DURATION;
                    e2.flashTimer = CONFIG.FLASH_DURATION;

                    // 接触火花デブリ
                    spawnDebris((e1.x + e2.x) / 2, (e1.y + e2.y) / 2, getEnemyColor(e1), 2);
                    spawnDebris((e1.x + e2.x) / 2, (e1.y + e2.y) / 2, getEnemyColor(e2), 2);
                }
            }
        }
    }

    for (let i = entities.enemies.length - 1; i >= 0; i--) {
        let e = entities.enemies[i];
        const edx = player.x - e.x;
        const edy = player.y - e.y;
        const distToPlayer = Math.hypot(edx, edy);

        // --- 射出シークエンスの処理 ---
        if (e.isLaunching) {
            e.launchTimer--;
            if (e.launchTimer > 30) {
                // 最初はドック内で待機 (停止状態)
                e.vx = 0;
                e.vy = 0;
                e.angle = Math.PI / 2; // 下向き固定
            } else if (e.launchTimer > 0) {
                // カタパルトから射出開始 (下方向へ加速)
                e.vx = 0;
                e.vy += 0.5;
                e.angle = Math.PI / 2;
                e.x += e.vx;
                e.y += e.vy;
            } else {
                // 射出完了、AIに移行
                e.isLaunching = false;
                e.vy = 8; // 初速ボーナス
            }
            continue; // 射出中は通常のAIロジックをスキップ
        }

        // --- 1. 性格別ターゲット座標の設定 ---
        let targetX = player.x;
        let targetY = player.y;

        if (e.personality === 'RAMMER') {
            // とにかくプレイヤーに直行・体当たり
            targetX = player.x;
            targetY = player.y;
        } else if (e.personality === 'SNIPER') {
            // 一定の遠距離（約350px）を維持する
            const keepDist = 350;
            if (distToPlayer < keepDist - 50) {
                // 近すぎるので離れる方向へ加速
                targetX = e.x - (edx / distToPlayer) * 200;
                targetY = e.y - (edy / distToPlayer) * 200;
            } else if (distToPlayer > keepDist + 50) {
                // 遠すぎるので近づく
                targetX = player.x;
                targetY = player.y;
            } else {
                // 距離がちょうどいい時はプレイヤーの周りを周回移動（横滑り）
                targetX = player.x + (edy / distToPlayer) * keepDist;
                targetY = player.y - (edx / distToPlayer) * keepDist;
            }
        } else if (e.personality === 'DOGFIGHTER') {
            // すれ違いドッグファイト
            // ターゲット位置をプレイヤーから一定オフセットさせ、定期的に更新する
            if (!e.dogfightTimer || e.dogfightTimer <= 0 || distToPlayer < 100) {
                const offsetAngle = Math.random() * Math.PI * 2;
                const offsetDist = 120 + Math.random() * 120; // プレイヤーの周囲120〜240px
                e.offsetX = Math.cos(offsetAngle) * offsetDist;
                e.offsetY = Math.sin(offsetAngle) * offsetDist;
                e.dogfightTimer = 100 + Math.floor(Math.random() * 60); // 定期的に次の通過ポイントを設定
            }
            e.dogfightTimer--;

            targetX = player.x + e.offsetX;
            targetY = player.y + e.offsetY;
        }

        // --- 2. 進行方向の障害物（他の敵・プレイヤー・有害デブリ・爆発）の回避 (Obstacle Avoidance) ---
        let avoidX = 0;
        let avoidY = 0;
        const eSpeed = Math.hypot(e.vx, e.vy);

        const maxSpd = playerStats.maxSpeed * (e.spdMult || 1.0);
        const blend = 0.04 * (e.turnMult || 1.0);
        const accel = maxSpd * blend; // 障害物回避時の加速度として利用

        if (eSpeed > 0.2) {
            const dirX = e.vx / eSpeed;
            const dirY = e.vy / eSpeed;
            const lookAheadDist = CONFIG.ENEMY_SIZE_W * 2.8; // 約84px先を予測
            const predictX = e.x + dirX * lookAheadDist;
            const predictY = e.y + dirY * lookAheadDist;

            let mostThreatening = null;
            let minThreatDist = lookAheadDist;

            // プレイヤーを障害物として検知 (自爆型RAMMERはプレイヤーを避けない)
            if (!GAME.isPlayerDying && e.personality !== 'RAMMER') {
                const distToPlayer = Math.hypot(player.x - predictX, player.y - predictY);
                if (distToPlayer < CONFIG.ENEMY_SIZE_W * 1.5) {
                    mostThreatening = player;
                    minThreatDist = distToPlayer;
                }
            }

            // 他の敵機を障害物として検知
            entities.enemies.forEach(other => {
                if (other === e) return;
                const distToOther = Math.hypot(other.x - predictX, other.y - predictY);
                if (distToOther < CONFIG.ENEMY_SIZE_W * 1.3) {
                    if (distToOther < minThreatDist) {
                        mostThreatening = other;
                        minThreatDist = distToOther;
                    }
                }
            });

            // 有害デブリを障害物として検知
            entities.debris.forEach(d => {
                if (!d.harmful) return; // 無害な被弾火花は避けない
                const distToDebris = Math.hypot(d.x - predictX, d.y - predictY);
                if (distToDebris < d.size / 2 + CONFIG.ENEMY_SIZE_W * 1.3) {
                    if (distToDebris < minThreatDist) {
                        mostThreatening = d;
                        minThreatDist = distToDebris;
                    }
                }
            });

            // 爆発を危険オブジェとして検知
            entities.explosions.forEach(exp => {
                const distToExplosion = Math.hypot(exp.x - predictX, exp.y - predictY);
                // 爆発の現在半径を取得（事前にupdate計算済みのcurrentScaleを利用）
                const currentRadius = exp.maxRadius * (exp.currentScale || 1.0);

                if (distToExplosion < currentRadius + CONFIG.ENEMY_SIZE_W * 1.5) {
                    // 爆発は他より脅威度が高い（距離を小さく見積もり、優先的に回避させる）
                    const effectiveDist = distToExplosion * 0.4;
                    if (effectiveDist < minThreatDist) {
                        mostThreatening = exp;
                        minThreatDist = effectiveDist;
                    }
                }
            });

            // 回避ステアリング力の計算
            if (mostThreatening) {
                const relX = mostThreatening.x - e.x;
                const relY = mostThreatening.y - e.y;
                const crossProduct = dirX * relY - dirY * relX;

                // 左右に避ける直交ベクトルを生成 (外積の符号と逆向きに操舵)
                const steerSide = crossProduct > 0 ? -1 : 1;
                const steerX = -dirY * steerSide;
                const steerY = dirX * steerSide;

                // 障害物に近づくほど強い回避力を適用
                const avoidForce = (1.0 - minThreatDist / lookAheadDist) * accel * 2.5;
                avoidX = steerX * avoidForce;
                avoidY = steerY * avoidForce;
            }
        }

        // --- 3. 移動角度と慣性移動 (サブスペース慣性ドリフト推進) ---
        const moveAngle = Math.atan2(targetY - e.y, targetX - e.x);

        // 障害物回避（avoidX, avoidY）のステアリング力を加味した理想の進行ベクトルを計算
        const targetVx = Math.cos(moveAngle) * maxSpd + avoidX;
        const targetVy = Math.sin(moveAngle) * maxSpd + avoidY;

        // 目標への進行角度
        const driveAngle = Math.atan2(targetVy, targetVx);

        // 加速度係数（プレイヤー機の挙動スケールに合わせる）
        const accelForce = maxSpd * 0.05;

        // ベクトルへの直接加算による慣性駆動
        e.vx += Math.cos(driveAngle) * accelForce;
        e.vy += Math.sin(driveAngle) * accelForce;

        // Friction (宇宙空間の自然減衰)
        e.vx *= CONFIG.FRICTION;
        e.vy *= CONFIG.FRICTION;

        // 速度クランプ処理
        const enemySpeed = Math.hypot(e.vx, e.vy);
        if (enemySpeed > maxSpd) {
            e.vx = (e.vx / enemySpeed) * maxSpd;
            e.vy = (e.vy / enemySpeed) * maxSpd;
        }

        // 座標更新
        e.x += e.vx;
        e.y += e.vy;

        // --- 3. 機体の向き（エイム）と揺らぎの適用 ---
        // 照準角度に数秒ごとに変わる微小な揺らぎ（aimOffset）を加え、射撃が単一線上に重ならないようにする
        if (!e.aimOffsetTimer || e.aimOffsetTimer <= 0) {
            e.aimOffset = (Math.random() - 0.5) * 0.35; // 約±10度以内の揺らぎ
            e.aimOffsetTimer = 30 + Math.floor(Math.random() * 45);
        }
        e.aimOffsetTimer--;

        e.angle = Math.atan2(edy, edx) + e.aimOffset;

        // 敵のスラスターパーティクル (プレイヤーより控えめに発生)
        if (Math.random() < 0.3) {
            const emitX = e.x - Math.cos(e.angle) * (CONFIG.ENEMY_SIZE_W / 2);
            const emitY = e.y - Math.sin(e.angle) * (CONFIG.ENEMY_SIZE_W / 2);
            entities.particles.push({
                x: emitX, y: emitY,
                vx: e.vx * CONFIG.PARTICLE_VEL_MULT - Math.cos(e.angle) * CONFIG.PARTICLE_SPEED + (Math.random() - 0.5) * CONFIG.PARTICLE_SPREAD,
                vy: e.vy * CONFIG.PARTICLE_VEL_MULT - Math.sin(e.angle) * CONFIG.PARTICLE_SPEED + (Math.random() - 0.5) * CONFIG.PARTICLE_SPREAD,
                life: 0.8,
                type: 'ENEMY_THRUSTER'
            });
        }

        // --- 4. 射撃処理とヒートゲージ管理（揺らぎを持たせる） ---
        if (e.isOverheated) {
            e.overheatTimer--;
            e.heat -= (CONFIG.HEAT_MAX / CONFIG.HEAT_OVERHEAT_PENALTY);
            if (e.overheatTimer <= 0) {
                e.heat = 0;
                e.isOverheated = false;
            }
        } else {
            // プレイヤーが生きており、かつ射程内にいる場合のみ射撃
            if (!GAME.isPlayerDying && distToPlayer < 800) {
                e.fireTimer++;
                // 揺らいだ射撃間隔(nextShootInterval)に達したか判定
                if (e.fireTimer >= e.nextShootInterval) {
                    e.fireTimer = 0;
                    e.heat += CONFIG.HEAT_PER_SHOT;

                    // 次回の射撃間隔をランダムに揺らす（ENEMY_FIRE_RATEの75%〜125%）
                    e.nextShootInterval = CONFIG.ENEMY_FIRE_RATE * (0.75 + Math.random() * 0.5);

                    if (e.heat >= CONFIG.HEAT_MAX) {
                        e.heat = CONFIG.HEAT_MAX;
                        e.isOverheated = true;
                        e.overheatTimer = CONFIG.HEAT_OVERHEAT_PENALTY;
                    }

                    // 敵の弾を発射（照準の揺らぎを反映したe.angleを使用）
                    entities.enemyBullets.push({
                        x: e.x + Math.cos(e.angle) * (CONFIG.ENEMY_SIZE_W / 2),
                        y: e.y + Math.sin(e.angle) * (CONFIG.ENEMY_SIZE_W / 2),
                        vx: Math.cos(e.angle) * CONFIG.ENEMY_BULLET_SPEED + e.vx * 0.5,
                        vy: Math.sin(e.angle) * CONFIG.ENEMY_BULLET_SPEED + e.vy * 0.5,
                        life: CONFIG.BULLET_LIFE,
                        damage: CONFIG.ENEMY_BULLET_DAMAGE * (e.attackMult || 1.0)
                    });
                }
            } else {
                e.heat = Math.max(0, e.heat - CONFIG.HEAT_COOL_RATE);
            }
        }

        if (e.flashTimer > 0) e.flashTimer--;

        // 自機の弾と敵機の衝突判定
        let hit = false;
        for (let j = entities.bullets.length - 1; j >= 0; j--) {
            let b = entities.bullets[j];
            if (Math.hypot(e.x - b.x, e.y - b.y) < CONFIG.COLLISION_ENEMY_BULLET) {
                e.hp -= CONFIG.BULLET_DAMAGE;

                // Limit Burst: Scatter Shot (bulletCount >= 6)
                if ((playerStats.upgrades.bulletCount || 0) >= 6 && !b.isScatter) {
                    for (let k = 0; k < 3; k++) {
                        entities.bullets.push({
                            x: b.x, y: b.y,
                            vx: (Math.random() - 0.5) * 20,
                            vy: (Math.random() - 0.5) * 20,
                            life: 15,
                            isScatter: true
                        });
                    }
                }

                entities.bullets.splice(j, 1);

                // 攻撃ヒット演出（白フラッシュ＆破片）
                e.flashTimer = CONFIG.FLASH_DURATION;

                // 敵の性格色に合わせたデブリを生成
                let enemyColor = CONFIG.COLOR_ENEMY_DOGFIGHTER;
                if (e.personality === 'RAMMER') enemyColor = CONFIG.COLOR_ENEMY_RAMMER;
                if (e.personality === 'SNIPER') enemyColor = CONFIG.COLOR_ENEMY_SNIPER;

                spawnDebris(e.x, e.y, enemyColor, 3 + Math.floor(Math.random() * 2));

                if (e.hp <= 0) {
                    killEnemy(e, i);
                    hit = true;
                    break;
                }
            }
        }
        if (hit) continue;

        // 敵機本体と自機の物理衝突判定
        if (!GAME.isPlayerDying) {
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            const dist = Math.hypot(dx, dy);
            const minDist = CONFIG.COLLISION_ENEMY_PLAYER; // 20px
            if (dist < minDist) {
                // 重なり解消
                const overlap = minDist - dist;
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);

                // 自機と敵機を押し離す
                player.x -= nx * overlap * 0.5;
                player.y -= ny * overlap * 0.5;
                e.x += nx * overlap * 0.5;
                e.y += ny * overlap * 0.5;

                // 相対速度による反動
                const rvx = e.vx - player.vx;
                const rvy = e.vy - player.vy;
                const velAlongNormal = rvx * nx + rvy * ny;

                if (velAlongNormal < 0) {
                    const crashSpeed = Math.hypot(rvx, rvy); // 相対速度の大きさ
                    const restitution = CONFIG.COLLISION_RECOIL_RESTITUTION;
                    const impulse = (1 + restitution) * crashSpeed * 0.5 + 2.0; // 自機衝突はより強い反動に

                    player.vx -= impulse * nx;
                    player.vy -= impulse * ny;
                    e.vx += impulse * nx;
                    e.vy += impulse * ny;

                    // ダメージ計算（相対速度比例）
                    const damage = (CONFIG.COLLISION_DAMAGE_BASE + crashSpeed * CONFIG.COLLISION_DAMAGE_VEL_MULT) * (e.attackMult || 1.0);
                    damagePlayer(damage);
                    e.hp -= damage;

                    GAME.damageFlashTimer = CONFIG.FLASH_DURATION;
                    e.flashTimer = CONFIG.FLASH_DURATION;

                    let enemyColor = getEnemyColor(e);
                    spawnDebris((player.x + e.x) / 2, (player.y + e.y) / 2, '#0f0', 3);
                    spawnDebris((player.x + e.x) / 2, (player.y + e.y) / 2, enemyColor, 3);
                }
            }
        }

        // 生存チェック（衝突等でHPが0になった場合の一括処理）
        if (e.hp <= 0) {
            killEnemy(e, i);
            continue;
        }
    }

    // --- Phase 5: 敵母艦との衝突判定 (Enemy Mothership Collision) ---
    if (entities.enemyMothership && !entities.enemyMothership.isDead) {
        let em = entities.enemyMothership;
        if (em.flashTimer > 0) em.flashTimer--;

        // vs プレイヤーの弾
        for (let j = entities.bullets.length - 1; j >= 0; j--) {
            let b = entities.bullets[j];
            if (Math.hypot(em.x - b.x, em.y - b.y) < em.radius) {
                em.hp -= CONFIG.BULLET_DAMAGE;

                // Limit Burst: Scatter Shot (bulletCount >= 6)
                if ((playerStats.upgrades.bulletCount || 0) >= 6 && !b.isScatter) {
                    for (let k = 0; k < 3; k++) {
                        entities.bullets.push({
                            x: b.x, y: b.y,
                            vx: (Math.random() - 0.5) * 20,
                            vy: (Math.random() - 0.5) * 20,
                            life: 15,
                            isScatter: true
                        });
                    }
                }

                entities.bullets.splice(j, 1);
                em.flashTimer = CONFIG.FLASH_DURATION;
                spawnDebris(b.x, b.y, '#555', 3);
            }
        }

        // vs プレイヤーのミサイル
        for (let j = entities.missiles.length - 1; j >= 0; j--) {
            let m = entities.missiles[j];
            if (Math.hypot(em.x - m.x, em.y - m.y) < em.radius) {
                em.hp -= 30; // 命中時の直接ダメージ
                em.flashTimer = CONFIG.FLASH_DURATION;
                spawnDebris(m.x, m.y, '#fff', 3);
                spawnExplosion(m.x, m.y, false, false, 0.5, 1.0, true);

                // Limit Burst: Multi-Missile (missileCount >= 6)
                if ((playerStats.upgrades.missile || 0) >= 6 && !m.isSubMunition) {
                    for (let k = 0; k < 3; k++) {
                        let target = null;
                        if (entities.enemies.length > 0) {
                            target = entities.enemies[Math.floor(Math.random() * entities.enemies.length)];
                        } else if (entities.enemyMothership && !entities.enemyMothership.isDead) {
                            target = entities.enemyMothership;
                        }
                        entities.missiles.push({
                            x: m.x, y: m.y,
                            vx: (Math.random() - 0.5) * 10,
                            vy: (Math.random() - 0.5) * 10,
                            angle: Math.random() * Math.PI * 2,
                            speed: CONFIG.MISSILE_SPEED * 1.2,
                            turnRate: CONFIG.MISSILE_TURN_RATE * 1.5,
                            life: CONFIG.MISSILE_LIFE * 0.4,
                            target: target,
                            isSubMunition: true
                        });
                    }
                }

                entities.missiles.splice(j, 1);
            }
        }

        // vs プレイヤー本体（体当たり）
        if (!GAME.isPlayerDying) {
            const dx = em.x - player.x;
            const dy = em.y - player.y;
            const dist = Math.hypot(dx, dy);
            const minDist = em.radius + CONFIG.PLAYER_SIZE_W / 2;
            if (dist < minDist) {
                // 重なり解消
                const overlap = minDist - dist;
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);
                player.x -= nx * overlap;
                player.y -= ny * overlap;

                // 反動とダメージ
                const crashSpeed = Math.hypot(player.vx, player.vy);
                const impulse = (1 + CONFIG.COLLISION_RECOIL_RESTITUTION) * crashSpeed * 0.5 + 2.0;
                player.vx -= impulse * nx;
                player.vy -= impulse * ny;

                const damage = CONFIG.COLLISION_DAMAGE_BASE + crashSpeed * CONFIG.COLLISION_DAMAGE_VEL_MULT;
                damagePlayer(damage);
                em.hp -= Math.max(10, damage * 0.1); // 母艦は巨大なので体当たりダメージ軽減

                GAME.damageFlashTimer = CONFIG.FLASH_DURATION;
                em.flashTimer = CONFIG.FLASH_DURATION;
                spawnDebris((player.x + em.x) / 2, (player.y + em.y) / 2, '#0f0', 3);
                spawnDebris((player.x + em.x) / 2, (player.y + em.y) / 2, '#555', 3);
            }
        }

        if (em.hp <= 0) {
            em.isDead = true;
            // 大型フレア (サイズ2倍、ダメージ2倍、継続時間5秒)
            spawnExplosion(em.x, em.y, false, false, 2.0, 2.5, false, 2.0);

            // 中フレア2〜3個を少し離れた位置に発生させる
            const numFlares = 2 + Math.floor(Math.random() * 2);
            for (let k = 0; k < numFlares; k++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * em.radius;
                spawnExplosion(em.x + Math.cos(angle) * dist, em.y + Math.sin(angle) * dist);
            }
            Cielo.play("敵母艦の破壊を確認。作戦完了です！");
        }
    }

    // --- Phase 6: 成長要素 (ジェム回収) ---
    for (let i = entities.gems.length - 1; i >= 0; i--) {
        let g = entities.gems[i];
        const gdx = player.x - g.x;
        const gdy = player.y - g.y;
        const dist = Math.hypot(gdx, gdy);

        // 一度吸引範囲に入ったらロックオン状態になり、加速度がついて必ず回収できる
        if (dist < CONFIG.EXP_MAGNET_RADIUS) {
            g.locked = true;
        }

        if (g.locked) {
            g.speed += CONFIG.GEM_MAGNET_ACCEL; // 加速度を加算
            const safeDist = Math.max(dist, 0.0001);
            g.x += (gdx / safeDist) * g.speed;
            g.y += (gdy / safeDist) * g.speed;
        } else {
            // 敵撃破時の飛び出し＆減速挙動 (デブリと同様に)
            if (g.vx !== undefined && g.vy !== undefined) {
                g.x += g.vx;
                g.y += g.vy;
                g.vx *= 0.92; // 毎フレーム 8% 減速
                g.vy *= 0.92;
            }
        }

        if (dist < CONFIG.GEM_COLLECT_RADIUS) {
            if (g.kind === 'HEAL') {
                playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + (g.heal || CONFIG.HEAL_ITEM_AMOUNT));
            } else {
                playerStats.exp += g.exp;
                checkLevelUp();
            }
            entities.gems.splice(i, 1);
        }
    }

    // --- ミッション達成リマインダー ---
    if (GAME.killCount >= CONFIG.MISSION_QUOTA && !GAME.isMissionClear && !GAME.isPlayerDying) {
        GAME.quotaReminderTimer = (GAME.quotaReminderTimer || 0) + 1;
        if (GAME.quotaReminderTimer >= 900) {
            Cielo.play("ノルマ達成ですー、無理せず帰ってきてくださいね");
            GAME.quotaReminderTimer = 0;
        }
    }

    // --- 着艦判定（出撃後は常時有効）---
    if (!player.isLandingSequence && !GAME.isPlayerDying && !GAME.isMissionClear && !GAME.launchSequence) {
        const cat = getCatapultSpec();
        const isTargeted = entities.enemies.length > 0;

        // 着艦不可（ターゲット中）かつ母艦半径200px以内に近づいたら警告
        if (isTargeted) {
            const distToMs = Math.hypot(player.x - CONFIG.MOTHERSHIP_X, player.y - CONFIG.MOTHERSHIP_Y);
            GAME.landingBlockedTimer = (GAME.landingBlockedTimer || 0) - 1;
            if (distToMs <= 200 && GAME.landingBlockedTimer <= 0) {
                Cielo.play("敵機からターゲット中です！排除しないと着艦できません！");
                GAME.landingBlockedTimer = 300; // 約5秒間は再生しない
            }
        } else {
            GAME.landingBlockedTimer = 0;
        }

        if (!isTargeted && Math.hypot(player.x - cat.tipX, player.y - cat.tipY) <= 50) {
            const isClearLanding = GAME.killCount >= CONFIG.MISSION_QUOTA;
            player.isLandingSequence = true;
            player.landingForClear = isClearLanding;
            if (isClearLanding) GAME.isMissionClear = true;
            player.landingPhase = 'TIP_LAND';
            player.landingTimer = 0;
            player.vx = 0;
            player.vy = 0;
            player.bodyAngle = Math.PI / 2;
            player.turretAngle = Math.PI / 2;
            player.leftTrailHistory = [];
            player.rightTrailHistory = [];
        }
    }

    // クレジットのカウントアップ演出
    if (GAME.displayCredits < GAME.credits) {
        GAME.displayCredits += 5;
        if (GAME.displayCredits > GAME.credits) GAME.displayCredits = GAME.credits;
    }
    document.getElementById('ui-credits').innerText = GAME.displayCredits;

    // HP20%以下の通信
    if (playerStats.hp > 0 && playerStats.hp <= playerStats.maxHp * 0.2 && !player._hpWarningPlayed) {
        player._hpWarningPlayed = true;
        Cielo.play("無理しないで、帰還してください！");
    } else if (playerStats.hp > playerStats.maxHp * 0.2) {
        player._hpWarningPlayed = false;
    }

    // 万が一の自機HPゼロ判定のセーフガード
    if (playerStats.hp <= 0 && !GAME.isPlayerDying) {
        triggerPlayerDeath();
    }

    // --- Update Engine Trails ---
    if (!GAME.isPlayerDying) {
        const isBoosterActive = GAME.launchSequence || (player.boostActiveTimer > 0);
        const isThrusting = (InputManager.isPressed('KeyW') || InputManager.isPressed('ArrowUp') || InputManager.isPressed('KeyS') || InputManager.isPressed('ArrowDown') ||
            InputManager.isPressed('KeyA') || InputManager.isPressed('ArrowLeft') || InputManager.isPressed('KeyD') || InputManager.isPressed('ArrowRight') ||
            isBoosterActive);

        const backX = player.x - Math.cos(player.bodyAngle) * (CONFIG.PLAYER_SIZE_W / 2);
        const backY = player.y - Math.sin(player.bodyAngle) * (CONFIG.PLAYER_SIZE_W / 2);
        const perpX = Math.cos(player.bodyAngle + Math.PI / 2);
        const perpY = Math.sin(player.bodyAngle + Math.PI / 2);
        const offsetDist = 5; // Tomcat twin nozzle offset

        const leftNozzleX = backX - perpX * offsetDist;
        const leftNozzleY = backY - perpY * offsetDist;
        const rightNozzleX = backX + perpX * offsetDist;
        const rightNozzleY = backY + perpY * offsetDist;

        // --- [追加] 速度感応型 風トレイルの履歴更新 ---
        if (!player.leftWindTrailHistory) player.leftWindTrailHistory = [];
        if (!player.rightWindTrailHistory) player.rightWindTrailHistory = [];

        const currentSpeed = Math.hypot(player.vx, player.vy);

        // 一定速度以上、かつ生存時のみ風トレイルのサンプリングを行う
        if (!GAME.isPlayerDying && currentSpeed >= CONFIG.WIND_TRAIL_MIN_SPEED) {
            // 翼端から発生させる（双発）
            const wingOffsetX = Math.cos(player.bodyAngle + Math.PI / 2) * (CONFIG.PLAYER_SIZE_W / 2 + 5);
            const wingOffsetY = Math.sin(player.bodyAngle + Math.PI / 2) * (CONFIG.PLAYER_SIZE_W / 2 + 5);

            player.leftWindTrailHistory.push({
                x: player.x - wingOffsetX,
                y: player.y - wingOffsetY,
                speed: currentSpeed
            });
            player.rightWindTrailHistory.push({
                x: player.x + wingOffsetX,
                y: player.y + wingOffsetY,
                speed: currentSpeed
            });
        } else {
            if (player.leftWindTrailHistory.length > 0) player.leftWindTrailHistory.shift();
            if (player.rightWindTrailHistory.length > 0) player.rightWindTrailHistory.shift();
        }

        if (player.leftWindTrailHistory.length > CONFIG.WIND_TRAIL_MAX_LEN) player.leftWindTrailHistory.shift();
        if (player.rightWindTrailHistory.length > CONFIG.WIND_TRAIL_MAX_LEN) player.rightWindTrailHistory.shift();

        // カタパルト着地〜着艦固定、および発艦カウントダウン中（GO!以前）はトレイルを非表示（履歴を消していく）
        const hideTrail = player.isLandingSequence || (GAME.launchSequence && GAME.launchTimer <= 180);

        if (!hideTrail) {
            if (!player.leftTrailHistory) player.leftTrailHistory = [];
            if (!player.rightTrailHistory) player.rightTrailHistory = [];

            // 物理エンジンの排気ベクトルを合成
            const thrustPower = isThrusting ? (isBoosterActive ? 0.8 : 0.3) : 0;
            const exhaustVx = player.vx + Math.cos(player.bodyAngle + Math.PI) * thrustPower * 10;
            const exhaustVy = player.vy + Math.sin(player.bodyAngle + Math.PI) * thrustPower * 10;

            player.leftTrailHistory.push({ x: leftNozzleX, y: leftNozzleY, vx: exhaustVx, vy: exhaustVy, active: isThrusting, boost: isBoosterActive });
            player.rightTrailHistory.push({ x: rightNozzleX, y: rightNozzleY, vx: exhaustVx, vy: exhaustVy, active: isThrusting, boost: isBoosterActive });

            const maxPlayerTrailLen = 25;
            if (player.leftTrailHistory.length > maxPlayerTrailLen) player.leftTrailHistory.shift();
            if (player.rightTrailHistory.length > maxPlayerTrailLen) player.rightTrailHistory.shift();
        } else {
            if (player.leftTrailHistory && player.leftTrailHistory.length > 0) player.leftTrailHistory.shift();
            if (player.rightTrailHistory && player.rightTrailHistory.length > 0) player.rightTrailHistory.shift();
        }

        // トレイルパーティクルに物理演算（空間摩擦と移動）を適用
        if (player.leftTrailHistory) {
            player.leftTrailHistory.forEach(pt => {
                if (pt.vx !== undefined) {
                    pt.x += pt.vx;
                    pt.y += pt.vy;
                    pt.vx *= 0.85;
                    pt.vy *= 0.85;
                }
            });
        }
        if (player.rightTrailHistory) {
            player.rightTrailHistory.forEach(pt => {
                if (pt.vx !== undefined) {
                    pt.x += pt.vx;
                    pt.y += pt.vy;
                    pt.vx *= 0.85;
                    pt.vy *= 0.85;
                }
            });
        }
    } else {
        if (player.leftTrailHistory && player.leftTrailHistory.length > 0) player.leftTrailHistory.shift();
        if (player.rightTrailHistory && player.rightTrailHistory.length > 0) player.rightTrailHistory.shift();
    }

    // Update enemy single-nozzle trails
    entities.enemies.forEach(e => {
        if (!e.trailHistory) e.trailHistory = [];

        const isEnemyThrusting = (Math.hypot(e.vx, e.vy) > 0.3);
        const enemyBackX = e.x - Math.cos(e.angle) * (CONFIG.ENEMY_SIZE_H / 2);
        const enemyBackY = e.y - Math.sin(e.angle) * (CONFIG.ENEMY_SIZE_H / 2);

        e.trailHistory.push({ x: enemyBackX, y: enemyBackY, active: isEnemyThrusting });

        const maxEnemyTrailLen = 12; // Half length of player
        if (e.trailHistory.length > maxEnemyTrailLen) e.trailHistory.shift();
    });

    updateHUD();
}

function checkLevelUp() {
    while (playerStats.exp >= playerStats.nextLevelExp) {
        playerStats.level++;
        playerStats.exp -= playerStats.nextLevelExp;
        playerStats.nextLevelExp = Math.floor(playerStats.nextLevelExp * CONFIG.LEVEL_UP_EXP_MULT);
        // 従来のようにゲームを止めず、ストックを増やすだけにする
        playerStats.levelUpStock = (playerStats.levelUpStock || 0) + 1;
    }
}

function updateHUD() {
    const shotsPerSec = (60 / playerStats.fireRate).toFixed(1);

    const statsHtml = `
                <div class="stat-category">
                    <div class="stat-category-title">// HULL</div>
                    <div class="stat-row">
                        <span class="stat-label">INTEGRITY</span>
                        <span class="stat-level">Lv${playerStats.upgrades.hull || 0}</span>
                        <span class="stat-value">${Math.floor(playerStats.hp)}/${playerStats.maxHp}</span>
                    </div>
                </div>
                <div class="stat-category">
                    <div class="stat-category-title">// VULCAN</div>
                    <div class="stat-row">
                        <span class="stat-label">PROJECTILES</span>
                        <span class="stat-level">Lv${playerStats.upgrades.bulletCount || 0}</span>
                        <span class="stat-value">${playerStats.bulletCount}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">FIRE RATE</span>
                        <span class="stat-level">Lv${playerStats.upgrades.fireRate || 0}</span>
                        <span class="stat-value">${shotsPerSec}/s</span>
                    </div>
                </div>
                <div class="stat-category">
                    <div class="stat-category-title">// MISSILE</div>
                    <div class="stat-row">
                        <span class="stat-label">LAUNCHERS</span>
                        <span class="stat-level">Lv${playerStats.upgrades.missile || 0}</span>
                        <span class="stat-value">${playerStats.missileCount}</span>
                    </div>
                </div>
                <div class="stat-category">
                    <div class="stat-category-title">// THRUSTER</div>
                    <div class="stat-row">
                        <span class="stat-label">MAX SPEED</span>
                        <span class="stat-level">Lv${playerStats.upgrades.booster || 0}</span>
                        <span class="stat-value">${(playerStats.maxSpeed).toFixed(1)}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">ACC</span>
                        <span class="stat-level">Lv${playerStats.upgrades.booster || 0}</span>
                        <span class="stat-value">${(playerStats.moveSpeed).toFixed(2)}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">HANDLING</span>
                        <span class="stat-level">Lv${playerStats.upgrades.maneuver || 0}</span>
                        <span class="stat-value">${(playerStats.handling * 60).toFixed(1)}°/s</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">CTRL MODE</span>
                        <span class="stat-level">Lv-</span>
                        <span class="stat-value">${GAME.controlMode}</span>
                    </div>
                </div>
            `;
    document.getElementById('stats-panel').innerHTML = statsHtml;
}

// ==========================================
// TITLE / LEVEL_UP / RESULT 画面の制御ロジック
// ==========================================



function updateLevelUpScreen() {
    GAME.levelUpCursorHoverTimer++;

    const cardW = 260;
    const gap = 40;
    const totalW = cardW * 3 + gap * 2;
    const startX = (GAME.width - totalW) / 2;
    const targetX = startX + GAME.levelUpSelectedIndex * (cardW + gap) + cardW / 2;
    GAME.levelUpCursorX += (targetX - GAME.levelUpCursorX) * 0.25;

    // マウスによるホバー選択
    if (GAME.levelUpState === 'CHOOSING') {
        const mouse = InputManager.getMouse();
        const startY = GAME.height * 0.35;
        const cardH = 340;
        for (let i = 0; i < 3; i++) {
            const cardX = startX + i * (cardW + gap);
            if (mouse.x >= cardX && mouse.x <= cardX + cardW && mouse.y >= startY && mouse.y <= startY + cardH) {
                if (GAME.levelUpSelectedIndex !== i) {
                    GAME.levelUpSelectedIndex = i;
                }
                if (mouse.leftDown) {
                    mouse.leftDown = false;
                    if (GAME.credits < 0) {
                        GAME.state = 'PLAYING';
                    } else {
                        GAME.levelUpState = 'DECIDED';
                        GAME.levelUpDecidedIndex = GAME.levelUpSelectedIndex;
                        GAME.levelUpDecidedTimer = 45;
                        GAME.levelUpNonSelectedY = 0;
                    }
                }
            }
        }
    }

    if (GAME.levelUpState === 'DECIDED') {
        GAME.levelUpDecidedTimer--;
        GAME.levelUpNonSelectedY += 0.8;

        for (let i = entities.particles.length - 1; i >= 0; i--) {
            let p = entities.particles[i];
            if (p.type === 'LEVEL_UP_HIT_PARTICLE') {
                p.x += p.vx; p.y += p.vy;
                p.life -= 0.025;
                if (p.life <= 0) entities.particles.splice(i, 1);
            }
        }

        if (GAME.levelUpDecidedTimer === 15) {
            const selectedX = startX + GAME.levelUpDecidedIndex * (cardW + gap) + cardW / 2;
            const cardY = GAME.height * 0.35;
            for (let i = 0; i < 25; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 6;
                entities.particles.push({
                    x: selectedX,
                    y: cardY + 25,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1.0,
                    type: 'LEVEL_UP_HIT_PARTICLE'
                });
            }
        }

        if (GAME.levelUpDecidedTimer <= 0) {
            const upgrade = GAME.levelUpCards[GAME.levelUpDecidedIndex];
            if (upgrade) upgrade.apply();

            if (player.isLandingSequence && player.landingPhase === 'RESUPPLY') {
                if ((playerStats.levelUpStock || 0) > 0) {
                    // まだストックがある場合は続けて開く
                    playerStats.levelUpStock--;
                    GAME.levelUpCards = [];
                    let available = [...upgradePool].filter(u => {
                        const currentLvl = playerStats.upgrades[u.id] || 0;
                        return currentLvl < u.maxLevel;
                    });
                    for (let i = 0; i < 3 && available.length > 0; i++) {
                        const idx = Math.floor(Math.random() * available.length);
                        GAME.levelUpCards.push(available.splice(idx, 1)[0]);
                    }

                    GAME.state = 'LEVEL_UP';
                    GAME.levelUpState = 'CHOOSING';
                    GAME.levelUpSelectedIndex = 0;
                    GAME.levelUpCursorX = (GAME.width - (260 * 3 + 40 * 2)) / 2 + 130;
                    GAME.levelUpDecidedIndex = -1;
                    GAME.levelUpDecidedTimer = 0;
                    GAME.levelUpCursorHoverTimer = 0;
                    GAME.levelUpNonSelectedY = 0;
                } else {
                    // 全て使い切ったら発進
                    Cielo.play("全調整完了！お気をつけて！");
                    GAME.state = 'PLAYING';
                    player.isLandingSequence = false;
                    player.landingPhase = 'NONE';
                    player.vx = 0;
                    player.vy = 0;
                    GAME.launchSequence = true;
                    GAME.launchTimer = 0;
                }
            } else {
                GAME.state = 'PLAYING';
            }
        }
    }
}

function drawLevelUpScreen() {
    ctx.fillStyle = 'rgba(5, 5, 16, 0.75)';
    ctx.fillRect(0, 0, GAME.width, GAME.height);

    const cardW = 260;
    const cardH = 340;
    const gap = 40;
    const totalW = cardW * 3 + gap * 2;
    const startX = (GAME.width - totalW) / 2;
    const startY = GAME.height * 0.35;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('=== LEVEL UP ===', GAME.width / 2, GAME.height * 0.16);

    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 16px Courier New';
    ctx.fillText('SELECT AN UPGRADE TO REINFORCE THE HULL', GAME.width / 2, GAME.height * 0.22);

    // 借金差し押さえの特別表示
    if (GAME.credits < 0) {
        ctx.fillStyle = '#f33';
        ctx.font = 'bold 22px Courier New';
        ctx.fillText('WARNING: DEBT OUTSTANDING. UPGRADE PROTOCOLS SEIZED.', GAME.width / 2, GAME.height * 0.28);
        if (Math.floor(Date.now() / 400) % 2 === 0) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Courier New';
            ctx.fillText('PRESS ENTER OR SPACE TO ABORT PROTOCOL', GAME.width / 2, GAME.height * 0.85);
        }

        for (let i = 0; i < 3; i++) {
            const cardX = startX + i * (cardW + gap);
            ctx.save();

            ctx.fillStyle = 'rgba(60, 20, 20, 0.9)';
            ctx.strokeStyle = '#f33';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(cardX, startY, cardW, cardH);
            ctx.fill();
            ctx.stroke();

            ctx.translate(cardX + cardW / 2, startY + cardH / 2);
            ctx.rotate(-Math.PI / 12);
            ctx.fillStyle = '#f33';
            ctx.strokeStyle = '#f33';
            ctx.lineWidth = 3;
            ctx.font = 'bold 26px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeRect(-110, -25, 220, 50);
            ctx.fillText('SEIZED BY', 0, -10);
            ctx.fillText('UNION', 0, 12);

            ctx.restore();
        }
        return;
    }

    for (let i = 0; i < 3; i++) {
        const card = GAME.levelUpCards[i];
        if (!card) continue;

        const isSelected = (GAME.levelUpState === 'CHOOSING' && GAME.levelUpSelectedIndex === i) ||
            (GAME.levelUpState === 'DECIDED' && GAME.levelUpDecidedIndex === i);

        ctx.save();

        let x = startX + i * (cardW + gap);
        let y = startY;
        let scale = 1.0;

        if (GAME.levelUpState === 'DECIDED') {
            if (isSelected) {
                const progress = (45 - GAME.levelUpDecidedTimer) / 45;
                const targetCenterX = GAME.width / 2 - cardW / 2;
                const targetCenterY = GAME.height * 0.4 - cardH / 2;
                x = x + (targetCenterX - x) * Math.min(progress * 1.5, 1.0);
                y = y + (targetCenterY - y) * Math.min(progress * 1.5, 1.0);
                scale = 1.0 + Math.min(progress * 2.0, 1.0) * 0.5;
            } else {
                y += GAME.levelUpNonSelectedY * GAME.levelUpNonSelectedY * 0.05;
                ctx.globalAlpha = Math.max(0, 1.0 - (GAME.levelUpNonSelectedY / 20));
            }
        } else {
            if (isSelected) {
                scale = 1.05;
                y -= 5;
            }
        }

        ctx.translate(x + cardW / 2, y + cardH / 2);
        ctx.scale(scale, scale);
        ctx.translate(-cardW / 2, -cardH / 2);

        const nextLvl = (playerStats.upgrades[card.id] || 0) + 1;
        const isLimitBurst = nextLvl === 6;

        let cardBgColor = isSelected ? 'rgba(0, 40, 50, 0.95)' : 'rgba(15, 20, 30, 0.85)';
        let cardStrokeColor = isSelected ? (Math.floor(Date.now() / 100) % 2 === 0 ? '#fff' : (card.categoryColor || '#0ff')) : (card.categoryColor || '#334455');
        let titleColor = isSelected ? '#0ff' : '#888';
        let descColor = isSelected ? '#fff' : '#aaa';

        if (isLimitBurst) {
            cardBgColor = isSelected ? 'rgba(60, 10, 10, 0.95)' : 'rgba(30, 5, 5, 0.85)';
            cardStrokeColor = isSelected ? (Math.floor(Date.now() / 80) % 2 === 0 ? '#ff0' : '#f00') : '#a00';
            titleColor = isSelected ? '#ff0' : '#f88';
            descColor = isSelected ? '#fff' : '#fbb';
        }

        ctx.fillStyle = cardBgColor;
        ctx.strokeStyle = cardStrokeColor;
        ctx.lineWidth = isSelected ? (isLimitBurst ? 4 : 3) : 1.5;
        ctx.beginPath();
        ctx.rect(0, 0, cardW, cardH);
        ctx.fill();
        ctx.stroke();

        if (isSelected) {
            const grad = ctx.createRadialGradient(cardW / 2, cardH / 2, 10, cardW / 2, cardH / 2, cardW * 0.8);
            if (isLimitBurst) {
                grad.addColorStop(0, 'rgba(255, 50, 0, 0.15)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            } else {
                grad.addColorStop(0, 'rgba(0, 255, 255, 0.08)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            }
            ctx.fillStyle = grad;
            ctx.fillRect(1, 1, cardW - 2, cardH - 2);
        }

        if (isLimitBurst) {
            ctx.fillStyle = '#f00';
            ctx.font = 'bold 14px Courier New';
            ctx.textAlign = 'center';
            // Blink effect for LIMIT BURST text
            if (Math.floor(Date.now() / 150) % 2 === 0) {
                ctx.fillText('>>> LIMIT BURST <<<', cardW / 2, 20);
            }
        }

        ctx.fillStyle = titleColor;
        ctx.font = 'bold 20px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(card.name, cardW / 2, 45);

        ctx.strokeStyle = cardStrokeColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(30, 60);
        ctx.lineTo(cardW - 30, 60);
        ctx.stroke();

        ctx.fillStyle = descColor;
        ctx.font = 'bold 13px Courier New';
        ctx.textAlign = 'center';

        // Wrap text manually or use existing logic (here we use simple multi-line if needed, but previously it was just single fillText)
        const descLines = card.description.split('\\n');
        for (let j = 0; j < descLines.length; j++) {
            ctx.fillText(descLines[j], cardW / 2, 100 + j * 20);
        }


        ctx.restore();
    }

    if (GAME.levelUpState !== 'DECIDED' || GAME.levelUpDecidedTimer > 15) {
        const hoverOffset = Math.sin(GAME.levelUpCursorHoverTimer * 0.08) * 8;
        let curY = startY - 25 + hoverOffset;

        if (GAME.levelUpState === 'DECIDED') {
            const progress = (45 - GAME.levelUpDecidedTimer) / 30;
            const targetY = startY + 20;
            curY = curY + (targetY - curY) * Math.min(progress, 1.0);
        }

        ctx.save();
        ctx.fillStyle = '#0ff';
        ctx.beginPath();
        ctx.moveTo(GAME.levelUpCursorX, curY + 12);
        ctx.lineTo(GAME.levelUpCursorX - 10, curY);
        ctx.lineTo(GAME.levelUpCursorX + 10, curY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    entities.particles.forEach(p => {
        if (p.type === 'LEVEL_UP_HIT_PARTICLE') {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = '#0ff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    });
}



// ==========================================
// 5. 描画フェーズ (Rendering)
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = GAME.width;
canvas.height = GAME.height;



const CommStateManager = {
    handleInput: function (e) {
        if (GAME.commState === 'INACTIVE' || !GAME.commState) {
            if ((playerStats.levelUpStock || 0) > 0) {
                GAME.commState = 'LEVEL_UP';
                GAME.levelUpCards = [];
                let available = [...upgradePool].filter(u => {
                    const currentLvl = playerStats.upgrades[u.id] || 0;
                    return currentLvl < u.maxLevel;
                });
                for (let i = 0; i < 3 && available.length > 0; i++) {
                    const idx = Math.floor(Math.random() * available.length);
                    GAME.levelUpCards.push(available.splice(idx, 1)[0]);
                }
                Cielo.play("エネルギー蓄積完了。リミット解放の指示を！");
            } else {
                GAME.commState = 'MENU';
                Cielo.play("こちらAガレージ。通信確立しました、指示を！");
            }
        } else {
            if (GAME.commState === 'MENU' && (playerStats.levelUpStock || 0) > 0) {
                GAME.commState = 'LEVEL_UP';
                GAME.levelUpCards = [];
                let available = [...upgradePool].filter(u => {
                    const currentLvl = playerStats.upgrades[u.id] || 0;
                    return currentLvl < u.maxLevel;
                });
                for (let i = 0; i < 3 && available.length > 0; i++) {
                    const idx = Math.floor(Math.random() * available.length);
                    GAME.levelUpCards.push(available.splice(idx, 1)[0]);
                }
                Cielo.play("エネルギー蓄積完了。リミット解放の指示を！");
            } else {
                GAME.commState = 'INACTIVE';
                Cielo.play("了解、指示を待ちます！");
            }
        }
    },
    handleActiveInput: function (e) {
        if (GAME.commState === 'LEVEL_UP') {
            let selectedCardIndex = -1;
            if (e.code === 'KeyQ' && GAME.levelUpCards.length > 0) selectedCardIndex = 0;
            if (e.code === 'KeyE' && GAME.levelUpCards.length > 1) selectedCardIndex = 1;
            if (e.code === 'KeyR' && GAME.levelUpCards.length > 2) selectedCardIndex = 2;

            if (selectedCardIndex !== -1) {
                GAME.levelUpCards[selectedCardIndex].apply();
                playerStats.levelUpStock--;

                if (playerStats.levelUpStock > 0) {
                    // ストックがまだある場合はカードを引き直して継続
                    GAME.levelUpCards = [];
                    let available = [...upgradePool].filter(u => {
                        const currentLvl = playerStats.upgrades[u.id] || 0;
                        return currentLvl < u.maxLevel;
                    });
                    for (let i = 0; i < 3 && available.length > 0; i++) {
                        const idx = Math.floor(Math.random() * available.length);
                        GAME.levelUpCards.push(available.splice(idx, 1)[0]);
                    }
                    Cielo.play("続けてリミット解放が可能です！指示を！");
                } else {
                    // ストックを使い切った場合は通信を閉じる
                    GAME.commState = 'INACTIVE';
                    Cielo.play("リミット解除完了！お気をつけて！");
                }
            }
        } else if (GAME.commState === 'MENU') {
            if (e.code === 'KeyF') { Cielo.play("了解、貴機座標へベクトル合わせます。Aガレージ、前進！"); GAME.commState = 'INACTIVE'; }
            if (e.code === 'KeyR') { Cielo.play("目標座標を共有しました。Aガレージ火器管制、最大戦力へ！"); GAME.commState = 'INACTIVE'; }
            if (e.code === 'KeyE') { Cielo.play("了解、退避ルートへ急行します。……無事に帰ってきてくださいね！"); GAME.commState = 'INACTIVE'; }
            if (e.code === 'KeyQ') { Cielo.play("了解。未探索エリアへレーダーを展開しながら移動します"); GAME.commState = 'INACTIVE'; }
        }
    },
    draw: function (ctx, radarRadius) {
        if ((playerStats.levelUpStock || 0) > 0 && GAME.commState !== 'LEVEL_UP') {
            ctx.save();
            ctx.font = 'bold 12px Courier New';
            ctx.fillStyle = '#0088ff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`[ PowerUp Stock ${String(playerStats.levelUpStock).padStart(2, '0')} ]`, 0, 50);
            ctx.fillText(`[    PUSH C KEY   ]`, 0, 65);
            ctx.restore();
        }

        if (GAME.commState === 'MENU') {
            ctx.save();
            ctx.translate(0, radarRadius + 50);
            ctx.fillStyle = 'rgba(0, 20, 50, 0.7)';
            ctx.fillRect(-170, 0, 340, 30);
            ctx.strokeStyle = '#00aaff';
            ctx.strokeRect(-170, 0, 340, 30);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("[F]移動 [R]攻撃 [E]退避 [Q]索敵 [C]閉じる", 0, 15);
            ctx.restore();
        } else if (GAME.commState === 'LEVEL_UP') {
            ctx.save();
            ctx.translate(0, radarRadius + 70);

            const commKeys = ['Q', 'E', 'R'];
            for (let i = 0; i < GAME.levelUpCards.length; i++) {
                const card = GAME.levelUpCards[i];
                const x = -100 + i * 100;
                const iconSize = 64;

                ctx.fillStyle = 'rgba(0, 30, 60, 0.9)';
                ctx.strokeStyle = '#0ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(x - iconSize / 2, -iconSize / 2, iconSize, iconSize, 8);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#0ff';
                ctx.font = 'bold 16px Courier New';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText('[' + commKeys[i] + ']', x - iconSize / 2 + 4, -iconSize / 2 + 4);

                if (card.shortName) {
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 12px Courier New';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const lines = card.shortName.split('\\n');
                    if (lines.length > 1) {
                        ctx.fillText(lines[0], x, 5);
                        ctx.fillText(lines[1], x, 20);
                    } else {
                        ctx.fillText(card.shortName, x, 10);
                    }
                }
            }
            ctx.restore();
        }
    }
};

function draw() {
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, GAME.width, GAME.height);

    ctx.fillStyle = '#fff';
    const titleFadeAlpha = GAME.state === 'TITLE' ? Math.max(0, 1.0 - (GAME.fadeAlpha || 0)) : 1.0;
    stars.forEach(s => {
        ctx.globalAlpha = s.layer.rate * titleFadeAlpha;
        ctx.fillRect(s.x, s.y, s.layer.size, s.layer.size);
    });
    ctx.globalAlpha = 1.0;

    if (GAME.state === 'TITLE') {
        SceneManager.title.draw(ctx);
        return;
    }
    if (GAME.state === 'LEVEL_UP') {
        drawLevelUpScreen();
        return;
    }
    if (GAME.state === 'RESULT') {
        SceneManager.result.draw(ctx);
        return;
    }

    ctx.save();
    ctx.translate(GAME.width / 2 - player.x, GAME.height / 2 - player.y);

    // --- 母艦 (Anchor Garage) 描画 ---
    ctx.save();
    ctx.translate(CONFIG.MOTHERSHIP_X, CONFIG.MOTHERSHIP_Y);
    ctx.rotate(-Math.PI / 2); // 上向き

    // わずかな非対称性を持たせるため、片側にセンサーアンテナを追加
    ctx.strokeStyle = '#556677';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-50, 60);
    ctx.lineTo(-30, 100);
    ctx.lineTo(20, 100);
    ctx.stroke();
    // アンテナ先端の点滅
    ctx.fillStyle = Date.now() % 1000 < 500 ? '#f00' : '#556677';
    ctx.beginPath();
    ctx.arc(20, 100, 4, 0, Math.PI * 2);
    ctx.fill();

    // 外周構造 (防御・損傷状態の可視化領域)
    ctx.fillStyle = '#1a1f24';
    ctx.strokeStyle = '#334455';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-120, -70);
    ctx.lineTo(40, -70);
    ctx.lineTo(80, -40);
    ctx.lineTo(80, 40);
    ctx.lineTo(40, 70);
    ctx.lineTo(-120, 70);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 居住区の窓明かり（中に人がいる気配）
    ctx.fillStyle = '#ffffaa';
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(-100 + i * 25, -62, 8, 4);
        ctx.fillRect(-100 + i * 25, 58, 8, 4);
    }
    ctx.globalAlpha = 1.0;

    // 補助モジュール1 (上側)
    ctx.fillStyle = '#222d36';
    ctx.fillRect(-80, -90, 60, 20);
    ctx.strokeRect(-80, -90, 60, 20);
    // 補助モジュール2 (下側・少し形状を変えて非対称に)
    ctx.fillRect(-100, 70, 80, 25);
    ctx.strokeRect(-100, 70, 80, 25);

    // 中央コア (生命維持・システム中枢)
    ctx.fillStyle = '#0f141a';
    ctx.beginPath();
    ctx.arc(-20, 0, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // コアの発光 (ゆっくりと脈動させる)
    const pulse = Math.sin(Date.now() / 1000) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(0, 255, 255, ${0.1 + pulse * 0.1})`;
    ctx.beginPath();
    ctx.arc(-20, 0, 35 + pulse * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.arc(-20, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    // 発着ドック (カタパルト) - 横幅を2.5倍に拡大
    const catW = 150;
    const catH = CONFIG.PLAYER_SIZE_W * 2.5; // 75
    ctx.fillStyle = '#111';
    ctx.fillRect(80, -catH / 2, catW, catH);
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(80, -catH / 2, catW, catH);

    // カタパルト上の誘導ライン (発光)
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(80, 0);
    ctx.lineTo(80 + catW, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // ドックのゲート発光
    ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
    ctx.fillRect(80, -catH / 2, 10, catH);

    // エンジン部 (後方)
    ctx.fillStyle = '#111';
    ctx.fillRect(-140, -30, 20, 60);
    // エンジン発光
    ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(-145, 0, 10, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // 機体名のペイント
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = 'bold 20px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.rotate(Math.PI / 2);
    ctx.fillText('A.GARAGE', 0, 90);
    ctx.restore();

    ctx.restore();

    // --- 敵母艦 (Enemy Mothership) 描画 ---
    if (entities.enemyMothership && !entities.enemyMothership.isDead) {
        let em = entities.enemyMothership;
        ctx.save();
        ctx.translate(em.x, em.y);
        // 敵母艦の向き（Aガレージは-Math.PI/2だが、敵母艦は下向きなら+Math.PI/2とするが、リスポーン位置が上なのでプレイヤーへ向けるか、固定でMath.PI/2にする）
        ctx.rotate(Math.PI / 2); // 下向き

        // センサーアンテナ (少し暗い色)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-50, 60);
        ctx.lineTo(-30, 100);
        ctx.lineTo(20, 100);
        ctx.stroke();
        // アンテナ先端の点滅 (赤く高速)
        ctx.fillStyle = Date.now() % 500 < 250 ? '#f00' : '#333';
        ctx.beginPath();
        ctx.arc(20, 100, 4, 0, Math.PI * 2);
        ctx.fill();

        // 外周構造 (黒系・暗灰色)
        ctx.fillStyle = em.flashTimer > 0 ? '#fff' : '#0a0a0a';
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-120, -70);
        ctx.lineTo(40, -70);
        ctx.lineTo(80, -40);
        ctx.lineTo(80, 40);
        ctx.lineTo(40, 70);
        ctx.lineTo(-120, 70);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 居住区の窓明かり（禍々しい赤色）
        ctx.fillStyle = '#ff2222';
        ctx.globalAlpha = 0.8;
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-100 + i * 25, -62, 8, 4);
            ctx.fillRect(-100 + i * 25, 58, 8, 4);
        }
        ctx.globalAlpha = 1.0;

        // 補助モジュール
        ctx.fillStyle = em.flashTimer > 0 ? '#fff' : '#111';
        ctx.fillRect(-80, -90, 60, 20);
        ctx.strokeRect(-80, -90, 60, 20);
        ctx.fillRect(-100, 70, 80, 25);
        ctx.strokeRect(-100, 70, 80, 25);

        // 中央コア (敵コアは赤系)
        ctx.fillStyle = '#1a0000';
        ctx.beginPath();
        ctx.arc(-20, 0, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f00';
        ctx.lineWidth = 3;
        ctx.stroke();

        // コアの発光 (高速脈動)
        const emPulse = Math.sin(Date.now() / 200) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 0, 0, ${0.1 + emPulse * 0.1})`;
        ctx.beginPath();
        ctx.arc(-20, 0, 35 + emPulse * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(-20, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        // 発着ドック (カタパルト)
        const catW = 150;
        const catH = CONFIG.PLAYER_SIZE_W * 2.5; // 75
        ctx.fillStyle = '#050505';
        ctx.fillRect(80, -catH / 2, catW, catH);
        ctx.strokeStyle = '#f00';
        ctx.lineWidth = 1;
        ctx.strokeRect(80, -catH / 2, catW, catH);

        // カタパルト上の誘導ライン (赤い発光)
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(80, 0);
        ctx.lineTo(80 + catW, 0);
        ctx.stroke();
        ctx.setLineDash([]);

        // ドックのゲート発光
        ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
        ctx.fillRect(80, -catH / 2, 10, catH);

        // エンジン部 (後方)
        ctx.fillStyle = '#000';
        ctx.fillRect(-140, -30, 20, 60);
        // エンジン発光
        ctx.fillStyle = 'rgba(255, 50, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-145, 0, 10, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        // HPバーの描画
        ctx.save();
        ctx.rotate(-Math.PI / 2); // 画面に対して水平に戻す
        const hpRatio = em.hp / em.maxHp;
        const barW = 100;
        const barH = 6;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-barW / 2, 100, barW, barH); // 機体下部に表示
        ctx.fillStyle = '#f00';
        ctx.fillRect(-barW / 2, 100, barW * hpRatio, barH);
        ctx.restore();

        ctx.restore();
    }

    // --- ランディングエリア表示（着艦中・発艦中・ターゲット中・クリア後は非表示）---
    if (!player.isLandingSequence && !GAME.launchSequence && !GAME.isMissionClear && entities.enemies.length === 0) {
        const lcat = getCatapultSpec();
        const landingColor = 'rgba(0, 220, 100, 0.18)';
        const landingStroke = 'rgba(0, 220, 100, 0.55)';
        ctx.save();
        ctx.beginPath();
        ctx.arc(lcat.tipX, lcat.tipY, 50, 0, Math.PI * 2);
        ctx.fillStyle = landingColor;
        ctx.fill();
        ctx.strokeStyle = landingStroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = landingStroke;
        ctx.font = 'bold 11px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('LANDING AREA', lcat.tipX, lcat.tipY - 54);
        ctx.restore();
    }

    // --- 補給中のステータス表示 ---
    if (player.isLandingSequence && player.landingPhase === 'RESUPPLY' && player.needsResupplyVisual) {
        ctx.save();
        ctx.fillStyle = '#0ff';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('REPAIRING & RESUPPLYING...', player.x, player.y - 40);
        // ゲージの簡易表示
        ctx.strokeStyle = '#0ff';
        ctx.strokeRect(player.x - 50, player.y - 30, 100, 6);
        const progress = (120 - player.landingTimer) / 120;
        ctx.fillRect(player.x - 50, player.y - 30, 100 * progress, 6);
        ctx.restore();
    }

    entities.gems.forEach(g => {
        let sprite = SpriteCache.gem;
        if (g.kind === 'HEAL') sprite = SpriteCache.gemHeal;
        if (g.kind === 'BIG_EXP') sprite = SpriteCache.gemBigExp;
        const drawSize = sprite.width;
        ctx.drawImage(sprite, g.x - drawSize / 2, g.y - drawSize / 2);
    });

    entities.particles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.type === 'DEBRIS_SMOKE') {
            // 半透明の煙（灰色の●で表現、拡大しながら薄れて消える）
            const progress = 1.0 - (p.life / p.maxLife); // 0.0 〜 1.0
            const scale = 1.0 + progress * 1.0; // 1倍から2倍へ拡大
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.scale(scale, scale);
            ctx.fillStyle = '#888'; // 灰色
            ctx.beginPath();
            ctx.arc(0, 0, p.baseSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'ENEMY_THRUSTER') {
            ctx.globalAlpha = Math.max(0, p.life);
            const scale = Math.max(0.1, p.life);
            ctx.scale(scale, scale);
            ctx.drawImage(SpriteCache.particleEnemy, -SpriteCache.particleEnemy.width / 2, -SpriteCache.particleEnemy.height / 2);
        } else if (p.type === 'SMOKE') {
            ctx.globalAlpha = Math.max(0, p.life);
            const scale = Math.max(0.1, p.life);
            ctx.scale(scale, scale);
            ctx.fillStyle = p.color || '#fff';
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.globalAlpha = Math.max(0, p.life);
            const scale = Math.max(0.1, p.life);
            ctx.scale(scale, scale);
            ctx.drawImage(SpriteCache.particlePlayer, -SpriteCache.particlePlayer.width / 2, -SpriteCache.particlePlayer.height / 2);
        }
        ctx.restore();
    });
    ctx.globalAlpha = 1.0;

    // デブリ（破片）の描画（最後の30%でフェードアウト）
    entities.debris.forEach(d => {
        ctx.fillStyle = d.color;
        ctx.globalAlpha = Math.min(1.0, d.life / 0.3);
        ctx.fillRect(d.x - d.size / 2, d.y - d.size / 2, d.size, d.size);
    });
    ctx.globalAlpha = 1.0;

    // 敵の弾描画 (細い赤い楕円形＋白いコアのSF風レーザー)
    entities.enemyBullets.forEach(b => {
        ctx.save();
        ctx.translate(b.x, b.y);
        const angle = Math.atan2(b.vy, b.vx);
        ctx.rotate(angle);

        // 外側の赤い発光
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.ellipse(0, 0, CONFIG.BULLET_SIZE * 2.8, CONFIG.BULLET_SIZE * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // 内側の白いコア
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(0, 0, CONFIG.BULLET_SIZE * 1.8, CONFIG.BULLET_SIZE * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });

    // 自機の弾描画 (細い黄色の楕円形＋白いコアのSF風レーザー)
    entities.bullets.forEach(b => {
        ctx.save();
        ctx.translate(b.x, b.y);
        const angle = Math.atan2(b.vy, b.vx);
        ctx.rotate(angle);

        // 外側の黄色の発光
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.ellipse(0, 0, CONFIG.BULLET_SIZE * 2.8, CONFIG.BULLET_SIZE * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // 内側の白いコア
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(0, 0, CONFIG.BULLET_SIZE * 1.8, CONFIG.BULLET_SIZE * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });

    // ミサイル描画 (▲と■の組み合わせ、色は白)
    entities.missiles.forEach(m => {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.angle);

        ctx.fillStyle = '#fff';
        // 四角部分 (■)
        ctx.fillRect(-6, -2.5, 5, 5);
        // 三角部分 (▲)
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-1, -3.5);
        ctx.lineTo(-1, 3.5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    });
    // 自機の２本スラスター描画
    if (!GAME.isPlayerDying) {
        drawRibbonTrail(player.leftTrailHistory, '#00d2ff', 7);  // トムキャット風のツインバーニア（シアンブルー）
        drawRibbonTrail(player.rightTrailHistory, '#00d2ff', 7); // トムキャット風のツインバーニア（シアンブルー）
    }

    drawWindTrail(player.leftWindTrailHistory);
    drawWindTrail(player.rightWindTrailHistory);
    // =================================================================

    // 敵機の１本スラスター描画
    entities.enemies.forEach(e => {
        let color = CONFIG.COLOR_ENEMY_DOGFIGHTER;
        if (e.personality === 'RAMMER') color = CONFIG.COLOR_ENEMY_RAMMER;
        if (e.personality === 'SNIPER') color = CONFIG.COLOR_ENEMY_SNIPER;
        drawRibbonTrail(e.trailHistory, color, 5); // 太さはやや細め、長さも半分
    });

    // 敵機描画
    entities.enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);

        // 敵のHPゲージ・ヒートゲージ (機体の下に回転せず描画)
        const barW = 30;
        // 上段：HPゲージ
        const hpRatio = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-barW / 2, 22, barW, 3);
        ctx.fillStyle = hpRatio <= 0.2 ? '#f00' : '#0f0';
        ctx.fillRect(-barW / 2, 22, barW * hpRatio, 3);

        // 下段：ヒートゲージ
        if (e.heat > 0) {
            const heatRatio = Math.max(0, Math.min(1, e.heat / CONFIG.HEAT_MAX));
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(-barW / 2, 26, barW, 3);
            if (e.isOverheated) {
                ctx.fillStyle = '#808080';
            } else if (heatRatio > 0.8) {
                ctx.fillStyle = '#f80';
            } else {
                ctx.fillStyle = '#fff';
            }
            ctx.fillRect(-barW / 2, 26, barW * heatRatio, 3);
        }

        ctx.rotate(e.angle);

        // 性格に応じたプリレンダースプライトを選択
        let sprite = SpriteCache.enemyDogfighter;
        if (e.personality === 'RAMMER') sprite = SpriteCache.enemyRammer;
        if (e.personality === 'SNIPER') sprite = SpriteCache.enemySniper;

        ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);

        // 攻撃ヒット時の白フラッシュ
        if (e.flashTimer > 0) {
            ctx.globalAlpha = e.flashTimer / CONFIG.FLASH_DURATION;
            ctx.drawImage(SpriteCache.enemyFlash, -SpriteCache.enemyFlash.width / 2, -SpriteCache.enemyFlash.height / 2);
            ctx.globalAlpha = 1.0;
        }
        ctx.restore();
    });

    // 自機描画とマイクロHUD (生存時のみ)
    if (!GAME.isPlayerDying) {
        // 砲塔描画 (機体より先に描画して下に隠れるようにする)
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.turretAngle);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, -3, CONFIG.PLAYER_SIZE_W / 2 + 10, 6);
        ctx.restore();

        // 自機描画 (土台)
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.bodyAngle);
        ctx.drawImage(SpriteCache.player, -SpriteCache.player.width / 2, -SpriteCache.player.height / 2);
        ctx.restore();

        // ----------------------------------------
        // 自機追従マイクロHUDの描画 (Z-order最前面扱い - 発進シーケンス中以外のみ)
        // ----------------------------------------
        if (!GAME.launchSequence) {
            ctx.save();
            ctx.translate(player.x, player.y);
            ctx.lineWidth = 4;

            // --- 右側：HPゲージ (内側 半径39、2時〜4時) ---
            const hpRadius = 39;
            ctx.beginPath();
            ctx.arc(0, 0, hpRadius, -Math.PI / 6, Math.PI / 6); // 背景 (2時〜4時)
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
            ctx.stroke();

            const hpRatio = Math.max(0, playerStats.hp / playerStats.maxHp);
            if (hpRatio > 0) {
                ctx.beginPath();
                const startAngle = -Math.PI / 6;
                const endAngle = startAngle + (Math.PI / 3) * hpRatio;
                ctx.arc(0, 0, hpRadius, startAngle, endAngle, false);
                ctx.strokeStyle = hpRatio > 0.5 ? '#0f0' : hpRatio > 0.25 ? '#ff0' : '#f00';
                ctx.stroke();
            }

            // --- 右側：ヒートゲージ (外側 半径45、2時〜4時) ---
            const heatRadius = 45;
            ctx.beginPath();
            ctx.arc(0, 0, heatRadius, -Math.PI / 6, Math.PI / 6); // 背景 (2時〜4時)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.stroke();

            const heatRatio = Math.max(0, Math.min(1, playerStats.heat / CONFIG.HEAT_MAX));
            if (heatRatio > 0) {
                ctx.beginPath();
                const startAngle = -Math.PI / 6;
                const endAngle = startAngle + (Math.PI / 3) * heatRatio;
                ctx.arc(0, 0, heatRadius, startAngle, endAngle, false);
                if (player.isOverheated) {
                    ctx.strokeStyle = '#808080';
                } else if (heatRatio > 0.8) {
                    ctx.strokeStyle = '#f80';
                } else {
                    ctx.strokeStyle = '#fff';
                }
                ctx.stroke();
            }

            // --- 左側中段：ブーストゲージ (内側 半径39、10時〜8時) ---
            // 現在のEXPの位置にブーストゲージ（オレンジ）を配置
            const boostRadius = 39;
            ctx.beginPath();
            ctx.arc(0, 0, boostRadius, 5 * Math.PI / 6, 7 * Math.PI / 6); // 背景
            ctx.strokeStyle = 'rgba(255, 136, 0, 0.2)';
            ctx.stroke();

            const boostRatio = (player.boostGauge !== undefined ? player.boostGauge : 80) / 80;
            if (boostRatio > 0) {
                ctx.beginPath();
                const startAngle = 7 * Math.PI / 6; // 8時から
                const endAngle = startAngle - (Math.PI / 3) * boostRatio; // 10時へ向かって
                ctx.arc(0, 0, boostRadius, startAngle, endAngle, true);
                ctx.strokeStyle = '#f80';
                ctx.stroke();
            }

            // --- 左側外段：EXPゲージ (外側 半径45、10時〜8時) ---
            const expRadius = 45;
            ctx.beginPath();
            ctx.arc(0, 0, expRadius, 5 * Math.PI / 6, 7 * Math.PI / 6); // 背景
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
            ctx.stroke();

            const expRatio = Math.max(0, Math.min(1, playerStats.exp / playerStats.nextLevelExp));
            if (expRatio > 0) {
                ctx.beginPath();
                const startAngle = 7 * Math.PI / 6; // 8時から
                const endAngle = startAngle - (Math.PI / 3) * expRatio; // 10時へ向かって
                ctx.arc(0, 0, expRadius, startAngle, endAngle, true);
                ctx.strokeStyle = '#0ff';
                ctx.stroke();
            }

            ctx.restore();
        } // GAME.launchSequence wrapper end
    }

    // 爆発の描画 (共通関数を利用)
    entities.explosions.forEach(exp => {
        drawExplosion(ctx, exp);
    });

    ctx.restore(); // カメラ適用終了

    // ----------------------------------------
    // プレイヤー中心レーダーと敵方向マーカー描画 (抽出先: radar.js)
    // ----------------------------------------
    Radar.draw(ctx, player, entities, CONFIG, GAME);

    // ----------------------------------------
    // 被弾時の画面全体赤フラッシュ演出
    // ----------------------------------------
    if (GAME.damageFlashTimer > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${(GAME.damageFlashTimer / CONFIG.FLASH_DURATION) * 0.4})`;
        ctx.fillRect(0, 0, GAME.width, GAME.height);
        GAME.damageFlashTimer--;
    }

    // ----------------------------------------
    // 発進シーケンスの Canvas ベクターカウントダウン描画
    // ----------------------------------------
    if (GAME.launchSequence && GAME.launchTimer <= 240) {
        let currentText = "";
        let frameInCycle = 0;

        if (GAME.launchTimer <= 60) {
            currentText = "3";
            frameInCycle = GAME.launchTimer;
        } else if (GAME.launchTimer <= 120) {
            currentText = "2";
            frameInCycle = GAME.launchTimer - 60;
        } else if (GAME.launchTimer <= 180) {
            currentText = "1";
            frameInCycle = GAME.launchTimer - 120;
        } else if (GAME.launchTimer <= 240) {
            currentText = "GO!";
            frameInCycle = GAME.launchTimer - 180;
        }

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let opacity = 1.0;
        let fontSize = 150;

        if (frameInCycle <= 48) {
            const p = frameInCycle / 48;
            fontSize = 200 - 50 * p; // スケールダウンしながら出現
            opacity = p;
        } else {
            const p = (frameInCycle - 48) / 12;
            fontSize = 150;
            opacity = 1.0 - p; // 急速にフェードアウト
        }

        // ネオンシアンのグローエフェクト
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 30;
        ctx.fillStyle = `rgba(0, 255, 255, ${opacity})`;
        ctx.font = `bold ${fontSize}px Courier New`;
        ctx.fillText(currentText, GAME.width / 2, GAME.height / 2);

        ctx.restore();
    }

    // ミニマップ描画
    MapManager.draw(ctx, player, entities, CONFIG, GAME);

    // ----------------------------------------
    // 画面全体のフェード処理
    // ----------------------------------------
    if (GAME.fadeAlpha > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${GAME.fadeAlpha})`;
        ctx.fillRect(0, 0, GAME.width, GAME.height);
    }
}

// ==========================================
// 6. メインループ
// ==========================================
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// 初期化して開始
SpriteCache.init();
Cielo.init();
loop();

