// ==========================================
// 0. ゲーム調整用パラメータ設定 (CONFIG)
// ==========================================
const CONFIG = {
    // 【物理・自機基本設定】
    FRICTION: 0.996,               // 宇宙空間の摩擦係数（滑りすぎを防止し、程よく収束させる）
    PLAYER_BASE_MOVE_SPEED: 0.35,   // 自機の初期移動力（ベクトル変化をマイルドにするため低減）
    PLAYER_BASE_MAX_SPEED: 12.0,    // 自機の初期最高速度（ドリフト時のトップスピード上限を引き上げ）
    PLAYER_BASE_HANDLING: 0.035,   // 自機の初期旋回速度（重厚感を出すためにマイルドに設定）
    PLAYER_BASE_HP: 250,          // 自機の初期HP
    PLAYER_SIZE_W: 30,            // 自機のグラフィック幅（ピクセル）
    PLAYER_SIZE_H: 36,            // 自機のグラフィック高（ピクセル）

    // 【射撃・弾設定】
    BULLET_BASE_FIRE_RATE: 20,    // 射撃の初期連射速度（フレーム間隔。低いほど高速連射）
    BULLET_SPEED: 15,             // ショットの飛翔弾速
    BULLET_DAMAGE: 10,            // ショット1発あたりの敵へのダメージ
    BULLET_LIFE: 100,             // ショットの生存寿命（フレーム数。射程距離に影響）
    BULLET_SIZE: 4,               // ショットの半径（ピクセル）
    BULLET_SPREAD_ANGLE: 0.15,    // 複数弾発射（マルチショット）時の1弾あたりの拡散角度（ラジアン）
    AUTO_AIM_RADIUS: 600,         // 自動エイムが敵を捕捉する最大半径（ピクセル）

    // 【ヒートゲージ設定】
    HEAT_MAX: 100,                // ヒートゲージの最大容量
    HEAT_PER_SHOT: 8,             // 1発射撃ごとの熱上昇量
    HEAT_COOL_RATE: 0.8,          // 射撃していない時の毎フレームの冷却量
    HEAT_OVERHEAT_PENALTY: 180,   // オーバーヒート時の冷却完了までのペナルティ時間（フレーム数。約3秒）

    // 【敵機設定】
    ENEMY_MAX_COUNT: 5,          // 敵の同時出現最大数（初期値）
    ENEMY_SIZE_W: 30,             // 敵機のグラフィック幅
    ENEMY_SIZE_H: 36,             // 敵機のグラフィック高
    ENEMY_ACCEL: 0.15,             // 敵機の加速度（慣性移動用）(iv:0.2)
    ENEMY_MAX_SPEED: 2.5,         // 敵機の最高速度 (iv:5)
    ENEMY_FIRE_RATE: 40,          // 敵機の射撃間隔（フレーム数）
    ENEMY_BULLET_SPEED: 5,        // 敵の弾速(iv:10)
    ENEMY_BASE_HP: 20,            // 敵機の初期HP（レベル1時点）
    ENEMY_HP_LEVEL_MULT: 5,       // プレイヤーのレベル上昇に伴う敵HPの増加量（レベルごとに加算）
    ENEMY_SPAWN_BASE_RATE: 0.04,  // 敵機の基本スポーン率（毎フレームごとの出現判定確率）
    ENEMY_SPAWN_LEVEL_MULT: 0.005, // プレイヤーレベル上昇時の敵機スポーン増加係数
    ENEMY_DAMAGE: 15,             // 敵機本体に衝突した際に自機が受けるダメージ量
    ENEMY_BULLET_DAMAGE: 10,      // 敵の弾に当たった際のダメージ

    // 【敵の性格出現確率（初期値、合計値に対する比率）】
    ENEMY_CHANCE_RAMMER: 20,      // 肉薄・体当たり型 (初期30%)
    ENEMY_CHANCE_SNIPER: 20,      // 距離維持・遠距離射撃型 (初期20%)
    ENEMY_CHANCE_DOGFIGHTER: 60,  // すれ違いドッグファイト型 (初期50%)

    // 【敵機カラー設定】
    COLOR_ENEMY_RAMMER: '#555555',     // 濃いグレー（肉薄型）
    COLOR_ENEMY_SNIPER: '#aa00ff',     // パープル（遠距離型）
    COLOR_ENEMY_DOGFIGHTER: '#3366ff', // ブルー（ドッグファイト型）

    // 【経験値ジェム・成長システム設定】
    GEM_SIZE: 24,                 // 経験値ジェムのサイズ (2倍に拡大)
    GEM_BASE_EXP: 20,             // ジェム1個あたりから獲得できる基本経験値量
    HEAL_ITEM_DROP_CHANCE: 0.2,   // HP回復アイテムの出現率
    HEAL_ITEM_AMOUNT: 50,         // HP回復量
    BIG_EXP_DROP_CHANCE: 0.1,     // 極大EXPの出現率
    BIG_EXP_MULT: 10,             // 極大EXPの倍率
    BIG_EXP_SIZE_MULT: 1.5,       // 極大EXPのサイズ倍率
    EXP_MAGNET_RADIUS: 150,       // 経験値を引き寄せる半径

    // --- α2追加仕様 ---
    MOTHERSHIP_X: 0,
    MOTHERSHIP_Y: 0,
    SPAWN_X: -1000,
    SPAWN_Y: -6000,
    SPAWN_TRIGGER_Y: -3000,
    MISSION_QUOTA: 10,
    MISSILE_COOLDOWN: 60,  // 1秒
    MISSILE_SPEED: 5.3,    // 以前(8)の約2/3の速度
    MISSILE_TURN_RATE: 0.1,
    MISSILE_FLARE_DAMAGE: 150,    // ミサイルのフレアダメージ
    GEM_MAGNET_BASE_SPEED: 8.0,   // ジェムがプレイヤーに吸引される時の初速
    GEM_MAGNET_ACCEL: 0.5,        // ジェムの毎フレームの吸引加速度（逃さず必ず回収するため）
    GEM_COLLECT_RADIUS: 20,       // ジェムを回収・獲得する自機との判定半径（ピクセル）
    LEVEL_UP_EXP_BASE: 100,       // レベル2に上がるために必要な基本経験値量
    LEVEL_UP_EXP_MULT: 1.3,       // レベルアップ毎の必要経験値の倍率上昇係数

    // 【アップグレード効果設定】
    UPGRADE_FIRERATE_MULT: 0.8,   // 「Rapid Fire」取得時の連射間隔短縮率（例: 0.8 = 連射速度20%アップ）
    UPGRADE_FIRERATE_MIN: 5,      // 連射速度の限界最小フレーム間隔（これ以上速くならないようにクランプ）
    UPGRADE_MOVESPEED_ADD: 0.2,   // 「Engine Boost」取得時の加速度加算値
    UPGRADE_MAXSPEED_ADD: 2.0,    // 「Engine Boost」取得時の最高速度加算値
    UPGRADE_HEAL_AMOUNT: 50,      // 「Hull Repair」取得時のHP回復量

    // 【当たり判定半径設定】
    COLLISION_ENEMY_BULLET: 20,   // 敵機とプレイヤーの弾が当たったと判定する円半径（ピクセル）
    COLLISION_ENEMY_PLAYER: 20,   // 敵機とプレイヤー自身が接触したと判定する円半径（ピクセル）

    // 【エフェクト・演出設定】
    FLASH_DURATION: 8,            // 被弾時の画面フラッシュ・敵の白フラッシュ時間（フレーム数）
    DEBRIS_SPEED_MULT: 5.0,       // 破片の飛び散る初速の最大値
    DEBRIS_LIFE: 300,             // 破片の生存フレーム数（約5秒）
    DEBRIS_SMOKE_COLOR: '#f80',   // デブリの煙パーティクルの色 (自機軌跡と同じオレンジ #f80)
    DEBRIS_SMOKE_SIZE: 3,         // デブリの煙パーティクルのサイズ (やや小さめの軌跡)
    DEBRIS_SMOKE_DECAY: 0.03,     // デブリの煙パーティクルの消失速度 (ややゆっくり消える)

    // 【爆発・破片ダメージ設定】
    DEBRIS_DAMAGE: 5,             // 爆破時に飛び散る有害破片のダメージ量
    EXPLOSION_DAMAGE: 15,         // 爆発のダメージ量
    EXPLOSION_RADIUS: 65,         // 爆発の最大当たり判定半径
    EXPLOSION_DURATION: 180,      // 爆発の寿命（フレーム数）※約3秒間維持
    DEBRIS_COUNT_MIN: 3,          // 撃破時に飛び散る有害破片の最小数
    DEBRIS_COUNT_MAX: 4,          // 撃破時に飛び散る有害破片の最大数

    // 【衝突物理・反動設定】
    COLLISION_RECOIL_RESTITUTION: 0.8, // 跳ね返りの弾性係数 (0.0 = 吸着, 1.0 = 完全弾性)
    COLLISION_DAMAGE_BASE: 3,          // 衝突時の基本最低ダメージ
    COLLISION_DAMAGE_VEL_MULT: 5.0,    // 衝突時の相対速度による追加ダメージ倍率

    STAR_LAYERS: [
        { rate: 0.2, size: 1, count: 150 }, // 遠景レイヤー（スクロール率、星の描画サイズ、描画個数）
        { rate: 0.5, size: 2, count: 100 }, // 中景レイヤー
        { rate: 0.8, size: 3, count: 50 }   // 近景レイヤー
    ],
    PARTICLE_SIZE: 3,             // スラスターから出るパーティクルの初期サイズ（半径）
    PARTICLE_DECAY: 0.008,        // パーティクルの毎フレームのフェードアウト速度（小さくすると長持ち）
    PARTICLE_VEL_MULT: 0.5,       // パーティクル生成時にプレイヤーの慣性速度を引き継ぐ割合（0.5 = 50%）
    PARTICLE_SPEED: 2.0,          // スラスター噴射炎の射出速度
    PARTICLE_SPREAD: 0.0,         // スラスター噴射炎のランダム拡散度（0で直進）
    COLOR_PARTICLE_PLAYER: '#fff',// 自機のスラスター噴射炎の色
    COLOR_PARTICLE_ENEMY: '#888', // 敵機のスラスター噴射炎の色
    RADAR_RADIUS: 200,            // 真円レーダーゲージの半径（ピクセル）
    WIND_TRAIL_MIN_SPEED: 6.0,     // 風トレイルが発生し始める最低速度
    WIND_TRAIL_MAX_LEN: 15,        // 風トレイルの最大履歴長さ（メインより少し短くしてシャープに）

    // 【ミニマップ設定】
    MINIMAP_SIZE: 200,             // ミニマップの幅・高さ (px)
    MINIMAP_MARGIN: 5,             // 画面端からのマージン (px)
    MINIMAP_SCALE: 10,             // 1px = 10m (ゲーム内座標単位)
    MINIMAP_GRID_INTERVAL: 500,    // グリッド間隔 (ゲーム内座標単位 = 500m)

    // 【アップグレードカテゴリカラー】
    UPGRADE_CAT_WEAPON: '#ff3333',   // 武器カテゴリ（赤）
    UPGRADE_CAT_HULL: '#33ff66',     // 船体カテゴリ（緑）
    UPGRADE_CAT_MOBILITY: '#3399ff', // 機動カテゴリ（青）
    UPGRADE_CAT_RECOVERY: '#ff8800', // 回復カテゴリ（オレンジ）

    // 【タクティカル・ブレーキ設定】
    BRAKE_DAMPING: 0.7,            // ブレーキ時の速度減衰係数

    // 【オートリペア設定 (Hull Integrity Lv.6)】
    AUTO_REPAIR_COOLDOWN: 7200,    // 120秒 (60fps * 120) のクールダウン
    AUTO_REPAIR_RATIO: 0.5,        // HP最大値の50%まで回復

    // 【Hull Integrity基礎強化】
    HULL_HP_PER_LEVEL: 50,         // Lv.1-5で+50 maxHP/Lv
};

