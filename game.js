class InvaderGame {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    // ゲーム状態
    this.gameState = "start"; // 'start', 'playing', 'gameOver', 'gameClear'
    this.score = 0;
    this.lives = 3;
    this.level = 1;

    // ゲームオブジェクト
    this.player = null;
    this.invaders = [];
    this.bullets = [];
    this.enemyBullets = [];

    // ゲーム設定
    this.gameWidth = 800;
    this.gameHeight = 600;

    // タイマー
    this.lastTime = 0;
    this.invaderShootTimer = 0;
    this.invaderMoveTimer = 0;

    // 入力管理
    this.keys = {};
    this.touchInput = {
      left: false,
      right: false,
      fire: false,
    };

    this.init();
  }

  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.setupTouchControls();
    this.showStartScreen();
  }

  setupCanvas() {
    // レスポンシブキャンバスサイズ設定
    const container = document.querySelector(".game-area");
    const containerWidth = container.clientWidth - 40; // マージン考慮
    const containerHeight = container.clientHeight - 40;

    const aspectRatio = this.gameWidth / this.gameHeight;

    if (containerWidth / containerHeight > aspectRatio) {
      this.canvas.height = containerHeight;
      this.canvas.width = containerHeight * aspectRatio;
    } else {
      this.canvas.width = containerWidth;
      this.canvas.height = containerWidth / aspectRatio;
    }

    // スケール比率を計算
    this.scaleX = this.canvas.width / this.gameWidth;
    this.scaleY = this.canvas.height / this.gameHeight;
  }

  setupEventListeners() {
    // キーボード入力
    document.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      if (e.code === "Space") {
        e.preventDefault();
      }
    });

    document.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    // ゲーム画面ボタン
    document.getElementById("startBtn").addEventListener("click", () => {
      this.startGame();
    });

    document.getElementById("restartBtn").addEventListener("click", () => {
      this.startGame();
    });

    document.getElementById("nextStageBtn").addEventListener("click", () => {
      this.startGame();
    });

    // ウィンドウリサイズ
    window.addEventListener("resize", () => {
      this.setupCanvas();
    });
  }

  setupTouchControls() {
    const leftBtn = document.getElementById("leftBtn");
    const rightBtn = document.getElementById("rightBtn");
    const fireBtn = document.getElementById("fireBtn");

    // タッチイベント設定
    this.setupTouchButton(leftBtn, "left");
    this.setupTouchButton(rightBtn, "right");
    this.setupTouchButton(fireBtn, "fire");
  }

  setupTouchButton(button, action) {
    button.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.touchInput[action] = true;
    });

    button.addEventListener("touchend", (e) => {
      e.preventDefault();
      this.touchInput[action] = false;
    });

    button.addEventListener("mousedown", (e) => {
      e.preventDefault();
      this.touchInput[action] = true;
    });

    button.addEventListener("mouseup", (e) => {
      e.preventDefault();
      this.touchInput[action] = false;
    });
  }

  showStartScreen() {
    document.getElementById("startScreen").classList.remove("hidden");
    document.getElementById("gameOverScreen").classList.add("hidden");
    document.getElementById("gameClearScreen").classList.add("hidden");
  }

  showGameOverScreen() {
    document.getElementById("startScreen").classList.add("hidden");
    document.getElementById("gameOverScreen").classList.remove("hidden");
    document.getElementById("gameClearScreen").classList.add("hidden");
    document.getElementById("finalScore").textContent = this.score;
  }

  showGameClearScreen() {
    document.getElementById("startScreen").classList.add("hidden");
    document.getElementById("gameOverScreen").classList.add("hidden");
    document.getElementById("gameClearScreen").classList.remove("hidden");
    document.getElementById("clearScore").textContent = this.score;
  }

  hideAllScreens() {
    document.getElementById("startScreen").classList.add("hidden");
    document.getElementById("gameOverScreen").classList.add("hidden");
    document.getElementById("gameClearScreen").classList.add("hidden");
  }

  startGame() {
    this.gameState = "playing";
    this.score = 0;
    this.lives = 3;
    this.level = 1;

    this.hideAllScreens();
    this.initGameObjects();
    this.updateUI();
    this.gameLoop();
  }

  initGameObjects() {
    // プレイヤー初期化
    this.player = {
      x: this.gameWidth / 2 - 25,
      y: this.gameHeight - 60,
      width: 50,
      height: 40,
      speed: 5,
      shootCooldown: 0,
    };

    // インベーダー初期化
    this.invaders = [];
    const rows = 5;
    const cols = 10;
    const invaderWidth = 40;
    const invaderHeight = 30;
    const startX = 50;
    const startY = 50;
    const spacing = 60;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.invaders.push({
          x: startX + col * spacing,
          y: startY + row * spacing,
          width: invaderWidth,
          height: invaderHeight,
          speed: 1,
          alive: true,
          type: row < 2 ? "fast" : "normal",
        });
      }
    }

    this.bullets = [];
    this.enemyBullets = [];
    this.invaderDirection = 1;
    this.invaderDropDistance = 20;
  }

  gameLoop(currentTime = 0) {
    if (this.gameState !== "playing") return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  update(deltaTime) {
    this.updatePlayer(deltaTime);
    this.updateBullets(deltaTime);
    this.updateInvaders(deltaTime);
    this.updateEnemyBullets(deltaTime);
    this.checkCollisions();
    this.checkGameConditions();
  }

  updatePlayer(deltaTime) {
    // プレイヤー移動
    const moving = this.keys["ArrowLeft"] || this.touchInput.left;
    const movingRight = this.keys["ArrowRight"] || this.touchInput.right;

    if (moving && this.player.x > 0) {
      this.player.x -= this.player.speed;
    }
    if (movingRight && this.player.x < this.gameWidth - this.player.width) {
      this.player.x += this.player.speed;
    }

    // プレイヤー射撃
    if (this.player.shootCooldown > 0) {
      this.player.shootCooldown -= deltaTime;
    }

    if (
      (this.keys["Space"] || this.touchInput.fire) &&
      this.player.shootCooldown <= 0
    ) {
      this.bullets.push({
        x: this.player.x + this.player.width / 2 - 2,
        y: this.player.y,
        width: 4,
        height: 10,
        speed: 8,
      });
      this.player.shootCooldown = 300; // 300ms クールダウン
    }
  }

  updateBullets(deltaTime) {
    this.bullets = this.bullets.filter((bullet) => {
      bullet.y -= bullet.speed;
      return bullet.y > -bullet.height;
    });
  }

  updateInvaders(deltaTime) {
    this.invaderMoveTimer += deltaTime;

    if (this.invaderMoveTimer > 500) {
      // 500ms ごとに移動
      this.invaderMoveTimer = 0;

      let shouldDrop = false;

      // 端に到達したかチェック
      for (let invader of this.invaders) {
        if (!invader.alive) continue;

        if (
          (invader.x <= 0 && this.invaderDirection === -1) ||
          (invader.x >= this.gameWidth - invader.width &&
            this.invaderDirection === 1)
        ) {
          shouldDrop = true;
          break;
        }
      }

      if (shouldDrop) {
        this.invaderDirection *= -1;
        this.invaders.forEach((invader) => {
          if (invader.alive) {
            invader.y += this.invaderDropDistance;
          }
        });
      }

      // インベーダー移動
      this.invaders.forEach((invader) => {
        if (invader.alive) {
          invader.x += this.invaderDirection * 20;
        }
      });
    }

    // インベーダーの射撃
    this.invaderShootTimer += deltaTime;
    if (this.invaderShootTimer > 1000) {
      // 1秒ごと
      this.invaderShootTimer = 0;
      this.enemyShoot();
    }
  }

  enemyShoot() {
    const aliveInvaders = this.invaders.filter((invader) => invader.alive);
    if (aliveInvaders.length === 0) return;

    const shooter =
      aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
    this.enemyBullets.push({
      x: shooter.x + shooter.width / 2 - 2,
      y: shooter.y + shooter.height,
      width: 4,
      height: 10,
      speed: 3,
    });
  }

  updateEnemyBullets(deltaTime) {
    this.enemyBullets = this.enemyBullets.filter((bullet) => {
      bullet.y += bullet.speed;
      return bullet.y < this.gameHeight;
    });
  }

  checkCollisions() {
    // プレイヤーの弾とインベーダーの当たり判定
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      for (let j = 0; j < this.invaders.length; j++) {
        const invader = this.invaders[j];

        if (invader.alive && this.isColliding(bullet, invader)) {
          invader.alive = false;
          this.bullets.splice(i, 1);
          this.score += invader.type === "fast" ? 20 : 10;
          this.updateUI();
          break;
        }
      }
    }

    // 敵の弾とプレイヤーの当たり判定
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];

      if (this.isColliding(bullet, this.player)) {
        this.enemyBullets.splice(i, 1);
        this.lives--;
        this.updateUI();

        if (this.lives <= 0) {
          this.gameState = "gameOver";
          this.showGameOverScreen();
        }
        break;
      }
    }

    // インベーダーとプレイヤーの当たり判定
    for (let invader of this.invaders) {
      if (invader.alive && invader.y + invader.height >= this.player.y) {
        this.gameState = "gameOver";
        this.showGameOverScreen();
        break;
      }
    }
  }

  isColliding(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  checkGameConditions() {
    const aliveInvaders = this.invaders.filter((invader) => invader.alive);

    if (aliveInvaders.length === 0) {
      this.gameState = "gameClear";
      this.showGameClearScreen();
    }
  }

  updateUI() {
    document.getElementById("score").textContent = `スコア: ${this.score}`;
    document.getElementById("lives").textContent = `ライフ: ${this.lives}`;
  }

  render() {
    // 背景クリア
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // スケール適用
    this.ctx.save();
    this.ctx.scale(this.scaleX, this.scaleY);

    this.renderPlayer();
    this.renderInvaders();
    this.renderBullets();
    this.renderEnemyBullets();

    this.ctx.restore();
  }

  renderPlayer() {
    this.ctx.fillStyle = "#00ff00";
    this.ctx.fillRect(
      this.player.x,
      this.player.y,
      this.player.width,
      this.player.height,
    );

    // 簡単な宇宙船デザイン
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(this.player.x + 20, this.player.y - 5, 10, 5);
  }

  renderInvaders() {
    for (let invader of this.invaders) {
      if (!invader.alive) continue;

      this.ctx.fillStyle = invader.type === "fast" ? "#ff0000" : "#ffff00";
      this.ctx.fillRect(invader.x, invader.y, invader.width, invader.height);

      // インベーダーの目
      this.ctx.fillStyle = "#000";
      this.ctx.fillRect(invader.x + 8, invader.y + 8, 4, 4);
      this.ctx.fillRect(invader.x + 28, invader.y + 8, 4, 4);
    }
  }

  renderBullets() {
    this.ctx.fillStyle = "#00ff00";
    for (let bullet of this.bullets) {
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
  }

  renderEnemyBullets() {
    this.ctx.fillStyle = "#ff0000";
    for (let bullet of this.enemyBullets) {
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
  }
}

// ゲーム初期化
document.addEventListener("DOMContentLoaded", () => {
  new InvaderGame();
});
