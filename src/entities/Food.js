import { GRID } from '../config.js';

export class Food {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.eaten = false;
    this.sprite = null;
    this.createSprite();
  }

  createSprite() {
    this.sprite = this.scene.add.sprite(
      this.x * GRID.TILE_SIZE + GRID.TILE_SIZE / 2,
      this.y * GRID.TILE_SIZE + GRID.TILE_SIZE / 2,
      'sprites',
      'game_sprites_5.png'
    );
    this.sprite.setScale(0.5); // halve to offset global zoom and keep food tile-sized
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  markEaten() {
    this.eaten = true;
    if (this.sprite) {
      this.sprite.setVisible(false);
    }
  }

  render() {
    if (this.eaten) return;

    // Sprite position is already set on creation, nothing to update
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
