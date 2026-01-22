import Phaser from 'phaser';
import { GRID } from '../config.js';

export class CollisionManager {
  constructor(scene, snakeManager) {
    this.scene = scene;
    this.snakeManager = snakeManager;
    this.gameOver = false;
    this.gameWon = false;
    this.postSplitContact = false; // Invulnerability while still touching after a split
    this.postSplitSafeUntil = 0;   // Time-based grace after a split
    this.splitSound = this.scene.sound.add('goopyslime');
  }

  spawnBloodEffect(tileX, tileY) {
    const px = tileX * GRID.TILE_SIZE + GRID.TILE_SIZE / 2;
    const py = tileY * GRID.TILE_SIZE + GRID.TILE_SIZE / 2;

    const sound = this.splitSound;
    const rawDuration = sound && sound.duration ? sound.duration * 1000 : 700;
    // Keep visuals tight: clamp between 600ms and 900ms regardless of sound length
    const durationMs = Math.min(900, Math.max(600, rawDuration));
    if (sound) {
      sound.play({ volume: 0.7 });
    }

    const burstLife = Math.max(450, durationMs * 0.45);
    const sprayLife = Math.max(600, durationMs * 0.7);
    const dripLife = Math.max(750, durationMs * 0.9);

    // Local burst at hit point
    const particles = this.scene.add.particles(px, py, 'sprites', {
      frame: 'game_sprites_1.png', // reuse red head frame as blood bits
      angle: { min: 0, max: 360 },
      speed: { min: 120, max: 220 },
      gravityY: 340,
      scale: { start: 2.1, end: 0.35 },
      alpha: { start: 1, end: 0 },
      lifespan: burstLife,
      quantity: 28,
      tint: { onEmit: () => Phaser.Display.Color.GetColor(200 + Math.random() * 55, 0, 0) },
      blendMode: 'ADD'
    });

    // Wide spray to cover the screen
    const spray = this.scene.add.particles(px, py, 'sprites', {
      frame: 'game_sprites_1.png',
      angle: { min: 0, max: 360 },
      speed: { min: 260, max: 540 },
      gravityY: 180,
      scale: { start: 1.4, end: 0.25 },
      alpha: { start: 0.95, end: 0 },
      lifespan: sprayLife,
      quantity: 80,
      tint: { onEmit: () => Phaser.Display.Color.GetColor(150 + Math.random() * 100, 0, 0) },
      blendMode: 'ADD'
    });

    // Slow, heavy droplets that linger
    const drips = this.scene.add.particles(px, py, 'sprites', {
      frame: 'game_sprites_1.png',
      angle: { min: 0, max: 360 },
      speed: { min: 40, max: 120 },
      gravityY: 220,
      scale: { start: 1.8, end: 0.15 },
      alpha: { start: 0.85, end: 0 },
      lifespan: dripLife,
      quantity: 32,
      tint: { onEmit: () => Phaser.Display.Color.GetColor(120 + Math.random() * 80, 0, 0) },
      blendMode: 'ADD'
    });

    // Mild camera shake on impact
    this.scene.cameras.main.shake(160, 0.01);

    this.scene.time.delayedCall(durationMs + 120, () => {
      particles.destroy();
      spray.destroy();
      drips.destroy();
    });
  }

  isTouchingAnySnake(warriorPos, snakes) {
    for (const snake of snakes) {
      if (snake.checkCollision(warriorPos.x, warriorPos.y)) {
        return true;
      }
    }
    return false;
  }

  // Check all collisions between warrior and snakes
  checkCollisions(warrior) {
    const warriorPos = warrior.getPosition();
    const snakes = this.snakeManager.getAliveSnakes();
    const now = this.scene.time.now;

    // After a split, ignore collisions until the warrior leaves snake contact
    if (this.postSplitContact) {
      const stillTouching = this.isTouchingAnySnake(warriorPos, snakes);
      const stillInGrace = now < this.postSplitSafeUntil;
      if (stillTouching || stillInGrace) {
        return;
      }
      this.postSplitContact = false;
    }

    for (const snake of snakes) {
      const collision = snake.checkCollision(warriorPos.x, warriorPos.y);

      if (collision) {
        this.handleCollision(collision, snake, warrior, warriorPos);
      }
    }
  }

  // Handle collision based on type
  handleCollision(collision, snake, warrior, warriorPos) {
    switch (collision.type) {
      case 'head':
        // Warrior touched snake head - GAME OVER
        this.gameOver = true;
        this.scene.recordDeathPosition(warriorPos.x, warriorPos.y);
        break;

      case 'body':
        if (this.scene.chainsawSound) {
          const saw = this.scene.chainsawSound;
          saw.stop();
          saw.setVolume(1);
          saw.setDetune(0);
          saw.play({ loop: false });
          // Play goopyslime after chainsaw starts
          this.scene.time.delayedCall(150, () => {
            const slime = this.scene.sound.get('goopyslime') || this.splitSound;
            if (slime) {
              slime.stop();
              slime.play({ volume: 0.8 });
            }
          });
        }
        const newSnake = snake.splitAt(collision.index);
        if (newSnake && newSnake.alive) {
          this.snakeManager.addSnake(newSnake);
          // Pause game and blink at the hit position
          this.scene.pauseGame(1000, warriorPos.x, warriorPos.y);
        }
        this.spawnBloodEffect(warriorPos.x, warriorPos.y);
        // Warrior remains safe while still overlapping the split snakes
        this.postSplitContact = true;
        this.postSplitSafeUntil = this.scene.time.now + 1200; // 1.2s grace window
        break;

      case 'tail':
        if (this.scene.chainsawSound) {
          const saw = this.scene.chainsawSound;
          saw.stop();
          saw.setVolume(1);
          saw.setDetune(0);
          saw.play({ loop: false });
          this.scene.time.delayedCall(150, () => {
            const slime = this.scene.sound.get('goopyslime') || this.splitSound;
            if (slime) {
              slime.stop();
              slime.play({ volume: 0.8 });
            }
          });
        }
        snake.shrink();
        break;
    }
  }

  // Check win condition
  checkWinCondition() {
    if (this.snakeManager.allSnakesDead()) {
      this.gameWon = true;
    }
  }

  reset() {
    this.gameOver = false;
    this.gameWon = false;
  }

  isGameOver() {
    return this.gameOver;
  }

  isGameWon() {
    return this.gameWon;
  }
}
