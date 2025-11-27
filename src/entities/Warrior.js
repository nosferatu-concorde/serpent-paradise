import { GRID, COLORS, DIRECTIONS } from '../config.js';

export class Warrior {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.direction = DIRECTIONS.NONE;
    this.nextDirection = DIRECTIONS.NONE;
    this.graphics = null;
    this.dashPending = false;
    this.dashTrail = [];
    this.dashTrailFrames = 0; // How many frames to show trail
    this.createGraphics();
  }

  createGraphics() {
    this.graphics = this.scene.add.graphics();
  }

  setDirection(direction) {
    // Prevent 180-degree reversals (though warrior can technically reverse)
    this.nextDirection = direction;
  }

  move() {
    // Update direction
    if (this.nextDirection !== DIRECTIONS.NONE) {
      this.direction = this.nextDirection;
    }

    // Determine how many tiles to move (1 for normal, 2 for dash)
    const moveDistance = this.dashPending ? 2 : 1;

    // If dashing, calculate trail positions
    if (this.dashPending) {
      this.dashTrail = [];

      // Starting position (tail)
      this.dashTrail.push({ x: this.x, y: this.y, opacity: 0.4 });

      // Middle position
      const midX = (this.x + this.direction.x + GRID.WIDTH) % GRID.WIDTH;
      const midY = (this.y + this.direction.y + GRID.HEIGHT) % GRID.HEIGHT;
      this.dashTrail.push({ x: midX, y: midY, opacity: 0.7 });

      // Final position (head - current position after move, full opacity)
      const finalX = (this.x + this.direction.x * 2 + GRID.WIDTH) % GRID.WIDTH;
      const finalY = (this.y + this.direction.y * 2 + GRID.HEIGHT) % GRID.HEIGHT;
      this.dashTrail.push({ x: finalX, y: finalY, opacity: 1.0 });

      // Show trail for longer (render happens 60fps, so 15 frames = 250ms)
      this.dashTrailFrames = 15;
    }

    this.dashPending = false; // Reset dash flag

    // Move in current direction
    this.x += this.direction.x * moveDistance;
    this.y += this.direction.y * moveDistance;

    // Handle grid wrapping
    if (this.x < 0) this.x = (this.x % GRID.WIDTH) + GRID.WIDTH;
    if (this.x >= GRID.WIDTH) this.x = this.x % GRID.WIDTH;
    if (this.y < 0) this.y = (this.y % GRID.HEIGHT) + GRID.HEIGHT;
    if (this.y >= GRID.HEIGHT) this.y = this.y % GRID.HEIGHT;
  }

  // Trigger a dash attack (moves 2 tiles)
  dash() {
    this.dashPending = true;
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  render() {
    this.graphics.clear();

    // If dashing, render trail
    if (this.dashTrailFrames > 0 && this.dashTrail.length > 0) {
      for (const segment of this.dashTrail) {
        this.graphics.fillStyle(COLORS.WARRIOR, segment.opacity);
        this.graphics.fillRect(
          segment.x * GRID.TILE_SIZE,
          segment.y * GRID.TILE_SIZE,
          GRID.TILE_SIZE,
          GRID.TILE_SIZE
        );
      }
      // Decrement frame counter
      this.dashTrailFrames--;
    } else {
      // Normal rendering
      this.graphics.fillStyle(COLORS.WARRIOR, 1);
      this.graphics.fillRect(
        this.x * GRID.TILE_SIZE,
        this.y * GRID.TILE_SIZE,
        GRID.TILE_SIZE,
        GRID.TILE_SIZE
      );
    }
  }

  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
    }
  }
}
