# VANGUARDRIFTER リファクタリング フェーズ2 指示書

本書は、シューティングゲーム『VANGUARDRIFTER (v0.5.00)』のソースコード構造を根本から改善し、今後の機能拡張（新しい敵機、新兵器、ステージの追加など）を迅速かつ安全に行うための設計指針および具体的な実装手順をまとめたものである。

---

## 1. 基本方針（アーキテクチャの刷新）
フェーズ1における「デッドコードの削除」と「不具合修正」により、コードの健全化は完了した。フェーズ2では、約1,800行の単一ファイル構造が抱える「高結合度（密結合）」「見通しの悪さ」「メモリ管理の懸念」を解決するため、以下の4つのタスクを段階的に実行する。

---

## 2. 実行タスク詳細

### 🧱 タスク1：エンティティのクラス化（オブジェクト指向の導入）

#### 【現状の課題】
自機（`player`）、敵機（`enemies`）、弾（`bullets`）などが、すべて単なるプレーンなオブジェクト（連想配列）として定義されており、生成ロジックや個別の移動・描画ロジックがメインループの `update()` や `draw()` 内にベタ書きされている。これにより、新しい敵を追加するたびにメインループの条件分岐が肥大化する。

#### 【リファクタリング方針】
ES6の `class` 構文を導入し、ゲーム内のすべての動的オブジェクトの基底となる `Entity` クラスを定義する。それを継承して各コンポーネントを独立させる。

#### 【実装イメージ】
javascript
// 基底エンティティクラス
class Entity {
    constructor(x, y, vx = 0, vy = 0) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.active = true;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
    draw(ctx) {
        // 各自オーバーライド
    }
}

// 敵機のクラス化例
class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y);
        this.type = type;
        this.hp = type === 'MOTHERSHIP' ? 500 : 10;
    }
    update() {
        super.update();
        // 敵固有のAI・移動ロジック
    }
    draw(ctx) {
        // 敵固有のCanvas描画ロジック
    }
}

### タスク2：オブジェクトプールの導入（パフォーマンス最適化）
#### 【現状の課題】
弾（bullets）やパーティクル（particles、explosions）が発生するたびに push() で配列に追加し、画面外への逸脱や消滅のたびに splice() で配列から削除している。この頻繁なメモリ確保と解放は、JavaScriptのガベージコレクション（GC）を引き起こし、一瞬画面がカクつく「スパイク現象」の原因となる。

#### 【リファクタリング方針】
あらかじめ最大出現数分のインスタンスを生成して保持しておく「オブジェクトプール」構造を導入する。

#### 【実装イメージ】
class ObjectPool {
    constructor(ClassType, size) {
        this.pool = Array.from({ length: size }, () => new ClassType());
    }
    obtain(...args) {
        const instance = this.pool.find(obj => !obj.active);
        if (instance) {
            instance.init(...args); // 初期化メソッドを呼び出し活性化
            return instance;
        }
        return null; // プール空きなし
    }
}

#### メインループ内での利用
弾を新しくnewするのではなく、プールから有効化する
const bullet = bulletPool.obtain(player.x, player.y, angle);

### タスク3：ハードコード（マジックナンバー）の定数化
#### 【現状の課題】
コード内の随所に 50、-170、110、0.05 といった具体的な数値（マジックナンバー）が直接書き込まれている。UIの位置調整やゲームのゲームバランス（移動速度、当たり判定）を変更する際、コード全体を検索して書き換える必要があり、先述のUI座標バグのような先祖返りやミスを誘発しやすい。

#### 【リファクタリング方針】
既存の CONFIG オブジェクトを大幅に拡張、または UI_LAYOUT 定数を新設し、設定値を一元管理する。

#### 【実装イメージ】
const CONFIG = {
    // 既存の設定
    FPS: 60,
    WIDTH: 1920,
    // 追加：UIレイアウト基準値
    UI: {
        RADAR_RADIUS: 200,
        COMM_MENU_Y_OFFSET: 50,
        COMM_LEVELUP_Y_OFFSET: 70,
        STOCK_PANEL_Y: 50
    },
    // 追加：ゲームバランス因数
    BALANCER: {
        PLAYER_DEFAULT_SPEED: 4.5,
        BOOST_MULTIPLIER: 1.5,
        ENEMY_SPAWN_INTERVAL: 180
    }
};

#### 描画部での利用例
ctx.translate(0, radarRadius + CONFIG.UI.COMM_MENU_Y_OFFSET);

### タスク4：ステートマシン（状態管理）の整理
#### 【現状の課題】
update() 関数や draw() 関数の内部で if (GAME.state === 'TITLE')、else if (GAME.state === 'PLAYING') といった巨大な分岐が同居しており、1つの関数が担う責務が大きすぎる。

#### 【リファクタリング方針】
状態（State）ごとに update と draw を持つオブジェクト、あるいは関数群に分割し、メインループからは現在の状態に応じた関数を呼び出すだけにする（Stateパターンの簡易適用）。

#### 【実装イメージ】
const GameStates = {
    TITLE: {
        update() { /* タイトル画面の更新ロジック */ },
        draw(ctx) { /* タイトル画面の描画ロジック */ }
    },
    PLAYING: {
        update() { /* ゲーム本編の更新ロジック */ },
        draw(ctx) { /* ゲーム本編の描画ロジック */ }
    },
    RESULT: {
        update() { /* リザルト画面の更新ロジック */ },
        draw(ctx) { /* リザルト画面の描画ロジック */ }
    }
};

// メインループ
function loop() {
    GameStates[GAME.state].update();
    GameStates[GAME.state].draw(ctx);
    requestAnimationFrame(loop);
}

### 段階的リファクタリング・ロードマップ
バグの混入を防ぐため、以下の順序で1タスクずつ実装・デバッグを行うことを推奨する。

#### 第1ステップ：タスク3（定数化）
既存コードの挙動を一切変えずに数値を定数に置き換えるだけのため、最も安全。

#### 第2ステップ：タスク4（状態管理の分離）
メインループの見通しを改善し、エンティティの分離作業を行いやすくする。

#### 第3ステップ：タスク1（クラス化）
まずは Bullet や Particle など、ロジックの単純なものからクラス化して置き換えていく。

#### 第4ステップ：タスク2（オブジェクトプール）
クラス化された Bullet や Particle に対してプールを適用し、パフォーマンスを最適化する。
