import Phaser from 'phaser';
import { DIRECTIONS } from '../config.js';

export class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.cursors = null;
    this.wasd = null;
    this.spaceKey = null;
    this.dashTriggered = false;
    this.setupInput();
  }

  setupInput() {
    // Arrow keys
    this.cursors = this.scene.input.keyboard.createCursorKeys();

    // WASD keys
    this.wasd = this.scene.input.keyboard.addKeys({
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D'
    });

    // Spacebar for dash
    this.spaceKey = this.scene.input.keyboard.addKey('SPACE');

    // Mouse input for dash
    this.scene.input.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown()) {
        this.dashTriggered = true;
      }
    });
  }

  getDirection() {
    // Check arrow keys
    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      return DIRECTIONS.UP;
    }
    if (this.cursors.down.isDown || this.wasd.down.isDown) {
      return DIRECTIONS.DOWN;
    }
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      return DIRECTIONS.LEFT;
    }
    if (this.cursors.right.isDown || this.wasd.right.isDown) {
      return DIRECTIONS.RIGHT;
    }

    return null; // No input
  }

  update(warrior) {
    const direction = this.getDirection();
    if (direction) {
      warrior.setDirection(direction);
    }

    // Check for dash input (spacebar or mouse click)
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || this.dashTriggered) {
      warrior.dash();
      this.dashTriggered = false; // Reset flag
    }
  }
}
