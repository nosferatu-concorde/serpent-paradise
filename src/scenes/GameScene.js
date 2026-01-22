import Phaser from 'phaser';
import { CANVAS, COLORS, GAME, GRID, DIRECTIONS } from '../config.js';
import { Warrior } from '../entities/Warrior.js';
import { InputManager } from '../managers/InputManager.js';
import { SnakeManager } from '../managers/SnakeManager.js';
import { FoodManager } from '../managers/FoodManager.js';
import { CollisionManager } from '../managers/CollisionManager.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  ensureFontLoaded() {
    if (document.fonts && document.fonts.load) {
      return document.fonts.load('10px "Press Start 2P"');
    }
    return Promise.resolve();
  }

  preload() {
    // Load the spritesheet atlas
    this.load.atlas('sprites', 'game_spritesheet.png', 'game_spritesheet.json');
    // Load split sound
    this.load.audio('goopyslime', '/goopyslime.mp3');
    // Load death/game over sounds
    this.load.audio('playerdeath', '/playerdeath.mp3');
    this.load.audio('gameover', '/gameover.mp3');
    // Load dash sound
    this.load.audio('chainsaw', '/chainsaw.mp3');
    // Load background music
    this.load.audio('bg-music', '/bg-music.mp3');
    // Load player atlas
    this.load.atlas('player', '/player_spritesheet.png', '/player_spritesheet.json');
  }

  create() {
    // Initialize managers
    this.snakeManager = new SnakeManager(this);
    this.foodManager = new FoodManager(this);
    this.inputManager = new InputManager(this);

    // Initialize collision manager
    this.collisionManager = new CollisionManager(this, this.snakeManager);

    // Death effect state
    this.deathEffectPlayed = false;
    this.lastDeathPos = null;
    this.deathEffectSprite = null;
    this.deathFadeRect = null;
    this.statusPulseTween = null;
    this.gridGraphics = null;
    this.playerDeathSound = null;
    this.gameOverSound = null;
    this.chainsawSound = null;
    this.backgroundMusicSound = null;
    this.backgroundMusicTween = null;
    this.snakeSpawnEvent = null;

    // Create warrior
    this.warrior = new Warrior(this, GAME.WARRIOR_START_X, GAME.WARRIOR_START_Y);

    // Spawn initial snakes
    this.spawnInitialSnakes();

    // Ongoing snake spawns
    this.snakeSpawnEvent = this.time.addEvent({
      delay: 3500,
      loop: true,
      callback: () => this.spawnRandomSnake()
    });

    // Initialize food
    this.foodManager.initialize(this.warrior, this.snakeManager.getAliveSnakes());

    // Movement timing
    this.lastWarriorMoveTime = 0;
    this.lastSnakeMoveTime = 0;

    // UI Text
    this.createUI();

    // Grid disabled
    // this.drawGrid();

    // Prep sounds
    this.playerDeathSound = this.sound.add('playerdeath');
    this.gameOverSound = this.sound.add('gameover');
    this.chainsawSound = this.sound.add('chainsaw');
    this.backgroundMusicSound = this.sound.add('bg-music');
    this.backgroundMusicSound.play({ volume: 0.28, detune: -300, loop: true });
    this.backgroundMusicTween = this.tweens.add({
      targets: this.backgroundMusicSound,
      volume: { from: 0.24, to: 0.32 },
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.runStartTime = this.time.now;

    // Game state
    this.gameStarted = true;
    this.pausedUntil = 0; // Timestamp when pause ends
    this.blinkPosition = null; // Position to blink during pause
    this.blinkUntil = 0;
  }

  recordDeathPosition(x, y) {
    this.lastDeathPos = { x, y };
    this.deathEffectPlayed = false;
  }

  playDeathHeadEffect() {
    if (this.deathEffectPlayed || !this.lastDeathPos) return;

    const { x, y } = this.lastDeathPos;
    const px = x * GRID.TILE_SIZE + GRID.TILE_SIZE / 2;
    const py = y * GRID.TILE_SIZE + GRID.TILE_SIZE / 2;

    // Brief camera shake on death
    this.cameras.main.shake(220, 0.015);

    if (this.deathEffectSprite) {
      this.deathEffectSprite.destroy();
    }

    // Fade the board to black and keep it
    if (this.deathFadeRect) {
      this.deathFadeRect.destroy();
    }
    this.deathFadeRect = this.add.rectangle(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT, 0x000000, 0);
    this.deathFadeRect.setOrigin(0, 0);
    this.deathFadeRect.setDepth(2000);
    this.tweens.add({
      targets: this.deathFadeRect,
      alpha: 1,
      duration: 280,
      ease: 'Quad.easeOut'
    });

    this.deathEffectSprite = this.add.sprite(px, py, 'sprites', 'game_sprites_1.png');
    this.deathEffectSprite.setDepth(3000);
    this.deathEffectSprite.setScale(1);
    this.deathEffectSprite.setAlpha(1);

    // Dramatic zoom-in, then keep spinning in place
    this.tweens.add({
      targets: this.deathEffectSprite,
      angle: 360,
      scale: 32,
      alpha: 1,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.deathEffectSprite,
          angle: '+=360',
          duration: 8400,
          ease: 'Linear',
          repeat: -1
        });
      }
    });

    this.deathEffectPlayed = true;
  }

  // Pause the game for a duration in milliseconds
  pauseGame(duration, blinkX = null, blinkY = null) {
    this.pausedUntil = this.time.now + duration;
    if (blinkX !== null && blinkY !== null) {
      this.blinkPosition = { x: blinkX, y: blinkY };
      this.blinkUntil = this.time.now + duration;
    }
    console.log('Game paused for', duration, 'ms');
  }

  spawnInitialSnakes() {
    // Spawn a few snakes
    this.snakeManager.spawnSnake(2, 2, GAME.SNAKE_INITIAL_LENGTH, DIRECTIONS.RIGHT);
    this.snakeManager.spawnSnake(GRID.WIDTH - 3, 2, GAME.SNAKE_INITIAL_LENGTH, DIRECTIONS.LEFT);
    this.snakeManager.spawnSnake(2, GRID.HEIGHT - 3, GAME.SNAKE_INITIAL_LENGTH, DIRECTIONS.RIGHT);
  }

  isTileOccupied(tileX, tileY) {
    const warriorPos = this.warrior ? this.warrior.getPosition() : null;
    if (warriorPos && warriorPos.x === tileX && warriorPos.y === tileY) return true;

    const foodPositions = this.foodManager ? this.foodManager.getActiveFoodPositions() : [];
    if (foodPositions.some(f => f.x === tileX && f.y === tileY)) return true;

    const snakes = this.snakeManager ? this.snakeManager.getAliveSnakes() : [];
    for (const snake of snakes) {
      if (snake.checkCollision(tileX, tileY)) {
        return true;
      }
    }
    return false;
  }

  spawnRandomSnake() {
    if (!this.gameStarted) return;
    const maxSnakes = 8;
    if (this.snakeManager.getAliveSnakes().length >= maxSnakes) return;

    const edges = [
      { side: 'left', x: 1, y: () => Phaser.Math.Between(1, GRID.HEIGHT - 2), dir: DIRECTIONS.RIGHT },
      { side: 'right', x: GRID.WIDTH - 2, y: () => Phaser.Math.Between(1, GRID.HEIGHT - 2), dir: DIRECTIONS.LEFT },
      { side: 'top', x: () => Phaser.Math.Between(1, GRID.WIDTH - 2), y: 1, dir: DIRECTIONS.DOWN },
      { side: 'bottom', x: () => Phaser.Math.Between(1, GRID.WIDTH - 2), y: GRID.HEIGHT - 2, dir: DIRECTIONS.UP }
    ];

    for (let i = 0; i < 25; i++) {
      const edge = Phaser.Utils.Array.GetRandom(edges);
      const spawnX = typeof edge.x === 'function' ? edge.x() : edge.x;
      const spawnY = typeof edge.y === 'function' ? edge.y() : edge.y;
      if (!this.isTileOccupied(spawnX, spawnY)) {
        this.snakeManager.spawnSnake(spawnX, spawnY, GAME.SNAKE_INITIAL_LENGTH, edge.dir);
        break;
      }
    }
  }

  createUI() {
    // Score text
    this.scoreText = this.add.text(CANVAS.WIDTH / 2, 10, 'Score: 0', {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'Press Start 2P'
    });
    this.scoreText.setDepth(1000);
    this.scoreText.setOrigin(0.5, 0);

    // Status text
    this.statusText = this.add.text(CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2, '', {
      fontSize: '96px',
      fill: '#ffffff',
      fontFamily: 'Press Start 2P',
      align: 'center'
    });
    this.statusText.setOrigin(0.5);
    this.statusText.setDepth(4000);
    this.statusText.setVisible(false);

    // Time alive readout for game over
    this.timeAliveText = this.add.text(CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2 + 110, '', {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'Press Start 2P',
      align: 'center'
    });
    this.timeAliveText.setOrigin(0.5);
    this.timeAliveText.setDepth(4000);
    this.timeAliveText.setVisible(false);

    // Game over note text (smaller footer style)
    this.gameOverNoteText = this.add.text(CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2 + 180, "Don't understand the game? Me neither!\ncopyright 2026 RAAAA Interactive\nA game by Nosferatu Concorde. Lol.", {
      fontSize: '14px',
      fill: '#cccccc',
      fontFamily: 'Press Start 2P',
      align: 'center'
    });
    this.gameOverNoteText.setOrigin(0.5);
    this.gameOverNoteText.setDepth(4000);
    this.gameOverNoteText.setLineSpacing(10);
    this.gameOverNoteText.setVisible(false);

    // Ensure webfont is applied and bump size once loaded
    this.ensureFontLoaded().then(() => {
      this.statusText.setFontFamily('"Press Start 2P"');
      this.statusText.setFontSize(16);
      this.statusText.setScale(1);
      this.scoreText.setFontFamily('"Press Start 2P"');
      this.instructionsText.setFontFamily('"Press Start 2P"');
      this.gameOverNoteText.setFontFamily('"Press Start 2P"');
      this.timeAliveText.setFontFamily('"Press Start 2P"');
    });

    // Instructions
    this.instructionsText = this.add.text(CANVAS.WIDTH / 2, CANVAS.HEIGHT - 25, 'Arrow Keys | WASD to move | SPACE to dash', {
      fontSize: '16px',
      fill: '#888888',
      fontFamily: 'Press Start 2P'
    });
    this.instructionsText.setDepth(1000);
    this.instructionsText.setOrigin(0.5, 1);

    // Add restart key
    this.input.keyboard.on('keydown-R', () => {
      this.restartGame();
    });
  }

  drawGrid() {
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.lineStyle(1, COLORS.GRID_LINE, 0.3);

    // Draw vertical lines
    for (let x = 0; x <= GRID.WIDTH; x++) {
      this.gridGraphics.moveTo(x * GRID.TILE_SIZE, 0);
      this.gridGraphics.lineTo(x * GRID.TILE_SIZE, CANVAS.HEIGHT);
    }

    // Draw horizontal lines
    for (let y = 0; y <= GRID.HEIGHT; y++) {
      this.gridGraphics.moveTo(0, y * GRID.TILE_SIZE);
      this.gridGraphics.lineTo(CANVAS.WIDTH, y * GRID.TILE_SIZE);
    }

    this.gridGraphics.strokePath();
  }

  hideBoardForDeath() {
    if (this.gridGraphics) {
      this.gridGraphics.setVisible(false);
    }
    if (this.warrior) {
      this.warrior.hide();
    }
    if (this.snakeManager) {
      this.snakeManager.hideAll();
    }
    if (this.foodManager) {
      this.foodManager.hideAll();
    }
    if (this.scoreText) {
      this.scoreText.setVisible(false);
    }
    if (this.instructionsText) {
      this.instructionsText.setVisible(false);
    }
  }

  playDeathSounds() {
    if (this.playerDeathSound) {
      this.playerDeathSound.stop();
      this.playerDeathSound.play({ volume: 1 });
    }
    if (this.gameOverSound) {
      this.gameOverSound.stop();
      this.gameOverSound.play({ volume: 1 });
    }
  }

  update(time, delta) {
    if (!this.gameStarted) return;

    // Check if game is paused
    if (time < this.pausedUntil) {
      // Still paused, but continue rendering
      this.render();
      return;
    }

    // Check game over or win conditions
    if (this.collisionManager.isGameOver()) {
      this.handleGameOver();
      return;
    }

    if (this.collisionManager.isGameWon()) {
      this.handleGameWon();
      return;
    }

    // Update input
    this.inputManager.update(this.warrior);

    // Warrior moves at double speed (half the delay)
    if (time - this.lastWarriorMoveTime > GAME.MOVE_DELAY / 2) {
      this.warrior.move();
      this.lastWarriorMoveTime = time;
    }

    // Snakes move at normal speed
    if (time - this.lastSnakeMoveTime > GAME.MOVE_DELAY) {
      // Move snakes
      const foodPositions = this.foodManager.getActiveFoodPositions();
      const warriorPosition = this.warrior.getPosition();
      this.snakeManager.update(foodPositions, warriorPosition);

      // Check if snakes ate food
      this.snakeManager.checkFoodCollisions(this.foodManager);

      // Update food spawning
      this.foodManager.update(time, this.warrior, this.snakeManager.getAliveSnakes());

      this.lastSnakeMoveTime = time;
    }

    // Check collisions every frame (regardless of movement timing)
    this.collisionManager.checkCollisions(this.warrior);

    // Remove dead snakes
    this.snakeManager.removeDeadSnakes();

    // Check win condition
    this.collisionManager.checkWinCondition();

    // Render everything
    this.render();

    // Update score
    this.updateScore();
  }

  render() {
    // Render in order: food, snakes, warrior
    this.foodManager.render();
    this.snakeManager.render();
    this.warrior.render();

    // Render blink indicator if active
    if (this.blinkPosition && this.time.now < this.blinkUntil) {
      const blinkCycle = Math.floor(this.time.now / 150) % 2;
      if (blinkCycle === 1) {
        // Draw white flash at split position
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffffff, 0.8);
        graphics.fillRect(
          this.blinkPosition.x * GRID.TILE_SIZE,
          this.blinkPosition.y * GRID.TILE_SIZE,
          GRID.TILE_SIZE,
          GRID.TILE_SIZE
        );
        graphics.destroy();
      }
    } else if (this.blinkPosition && this.time.now >= this.blinkUntil) {
      this.blinkPosition = null;
    }
  }

  updateScore() {
    // Calculate score based on snakes killed (simplified)
    const deadSnakes = this.snakeManager.snakes.length - this.snakeManager.getAliveSnakes().length;
    this.scoreText.setText(`Snakes Alive: ${this.snakeManager.getAliveSnakes().length}`);
  }

  handleGameOver() {
    this.hideBoardForDeath();
    this.playDeathHeadEffect();
    this.playDeathSounds();
    this.gameStarted = false;
    const elapsedSeconds = Math.max(0, (this.time.now - (this.runStartTime || 0)) / 1000);
    const timeDisplay = elapsedSeconds >= 100 ? elapsedSeconds.toFixed(0) : elapsedSeconds.toFixed(1);
    this.timeAliveText.setText(`Time Alive: ${timeDisplay}s`);
    this.timeAliveText.setVisible(true);
    this.statusText.setText('GAME OVER\n\nPress R to restart');
    this.statusText.setScale(4);
    this.statusText.setVisible(true);
    this.gameOverNoteText.setVisible(true);
    if (this.statusPulseTween) {
      this.statusPulseTween.stop();
    }
    this.statusPulseTween = this.tweens.add({
      targets: this.statusText,
      scale: { from: 1, to: 1.1 },
      alpha: { from: 0.4, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  handleGameWon() {
    this.gameStarted = false;
    this.statusText.setText('YOU WIN!\n\nPress R to restart');
    this.statusText.setVisible(true);
  }

  restartGame() {
    // Clean up
    this.warrior.destroy();
    this.snakeManager.destroy();
    this.foodManager.destroy();

    // Reset death effect state
    this.deathEffectPlayed = false;
    this.lastDeathPos = null;
    if (this.deathEffectSprite) {
      this.deathEffectSprite.destroy();
      this.deathEffectSprite = null;
    }
    if (this.deathFadeRect) {
      this.deathFadeRect.destroy();
      this.deathFadeRect = null;
    }
    if (this.statusPulseTween) {
      this.statusPulseTween.stop();
      this.statusPulseTween = null;
    }
    if (this.playerDeathSound) {
      this.playerDeathSound.stop();
    }
    if (this.gameOverSound) {
      this.gameOverSound.stop();
    }
    if (this.backgroundMusicSound) {
      this.backgroundMusicSound.stop();
    }
    if (this.backgroundMusicTween) {
      this.backgroundMusicTween.stop();
      this.backgroundMusicTween = null;
    }
    if (this.snakeSpawnEvent) {
      this.snakeSpawnEvent.remove();
      this.snakeSpawnEvent = null;
    }

    // Reset collision manager
    this.collisionManager.reset();

    // Restart scene
    this.scene.restart();
  }
}
