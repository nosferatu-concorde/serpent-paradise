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

  create() {
    // Initialize managers
    this.snakeManager = new SnakeManager(this);
    this.foodManager = new FoodManager(this);
    this.inputManager = new InputManager(this);

    // Initialize collision manager
    this.collisionManager = new CollisionManager(this, this.snakeManager);

    // Create warrior
    this.warrior = new Warrior(this, GAME.WARRIOR_START_X, GAME.WARRIOR_START_Y);

    // Spawn initial snakes
    this.spawnInitialSnakes();

    // Initialize food
    this.foodManager.initialize(this.warrior, this.snakeManager.getAliveSnakes());

    // Movement timing
    this.lastWarriorMoveTime = 0;
    this.lastSnakeMoveTime = 0;

    // UI Text
    this.createUI();

    // Draw grid (optional, for debugging)
    this.drawGrid();

    // Game state
    this.gameStarted = true;
    this.pausedUntil = 0; // Timestamp when pause ends
    this.blinkPosition = null; // Position to blink during pause
    this.blinkUntil = 0;
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
    // Spawn one snake at position (2, 2)
    this.snakeManager.spawnSnake(2, 2, GAME.SNAKE_INITIAL_LENGTH, DIRECTIONS.RIGHT);
  }

  createUI() {
    // Score text
    this.scoreText = this.add.text(10, 10, 'Score: 0', {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'monospace'
    });
    this.scoreText.setDepth(1000);

    // Status text
    this.statusText = this.add.text(CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2, '', {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'monospace',
      align: 'center'
    });
    this.statusText.setOrigin(0.5);
    this.statusText.setDepth(1000);
    this.statusText.setVisible(false);

    // Instructions
    this.instructionsText = this.add.text(10, CANVAS.HEIGHT - 25, 'Arrow Keys / WASD to move | SPACE / Left Click to dash attack | R to restart', {
      fontSize: '14px',
      fill: '#888888',
      fontFamily: 'monospace'
    });
    this.instructionsText.setDepth(1000);

    // Add restart key
    this.input.keyboard.on('keydown-R', () => {
      this.restartGame();
    });
  }

  drawGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, COLORS.GRID_LINE, 0.3);

    // Draw vertical lines
    for (let x = 0; x <= GRID.WIDTH; x++) {
      graphics.moveTo(x * GRID.TILE_SIZE, 0);
      graphics.lineTo(x * GRID.TILE_SIZE, CANVAS.HEIGHT);
    }

    // Draw horizontal lines
    for (let y = 0; y <= GRID.HEIGHT; y++) {
      graphics.moveTo(0, y * GRID.TILE_SIZE);
      graphics.lineTo(CANVAS.WIDTH, y * GRID.TILE_SIZE);
    }

    graphics.strokePath();
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
    this.gameStarted = false;
    this.statusText.setText('GAME OVER\n\nPress R to restart');
    this.statusText.setVisible(true);
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

    // Reset collision manager
    this.collisionManager.reset();

    // Restart scene
    this.scene.restart();
  }
}
