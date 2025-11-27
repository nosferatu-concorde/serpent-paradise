import { GRID, COLORS } from '../config.js';

export class Food {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.eaten = false;
    this.graphics = null;
    this.createGraphics();
  }

  createGraphics() {
    this.graphics = this.scene.add.graphics();
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  markEaten() {
    this.eaten = true;
  }

  render() {
    if (this.eaten) return;

    this.graphics.clear();
    this.graphics.fillStyle(COLORS.FOOD, 1);

    // Draw as a circle in the center of the tile
    const centerX = this.x * GRID.TILE_SIZE + GRID.TILE_SIZE / 2;
    const centerY = this.y * GRID.TILE_SIZE + GRID.TILE_SIZE / 2;
    const radius = GRID.TILE_SIZE / 3;

    this.graphics.fillCircle(centerX, centerY, radius);
  }

  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
    }
  }
}
