import { GRID, DIRECTIONS } from '../config.js';

export class Warrior {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.direction = DIRECTIONS.NONE;
    this.nextDirection = DIRECTIONS.NONE;
    this.sprite = null;
    this.dashPending = false;
    this.dashTrail = []; // Array of trail sprites
    this.dashTrailFrames = 0;
    this.isDashingThisStep = false;
    this.createSprite();
  }

  createSprite() {
    // Create animation once
    if (!this.scene.anims.exists('player_walk')) {
      this.scene.anims.create({
        key: 'player_walk',
        frames: this.scene.anims.generateFrameNames('player', {
          start: 0,
          end: 1,
          zeroPad: 4,
          prefix: 'frame',
          suffix: '.png'
        }),
        frameRate: 6,
        repeat: -1
      });
    }

    this.sprite = this.scene.add.sprite(
      this.x * GRID.TILE_SIZE + GRID.TILE_SIZE / 2,
      this.y * GRID.TILE_SIZE + GRID.TILE_SIZE / 2,
      'player',
      'frame0000.png'
    );
    this.sprite.play('player_walk');
    this.sprite.setScale(2);
  }

  setDirection(direction) {
    this.nextDirection = direction;
  }

  move() {
    // Update direction
    if (this.nextDirection !== DIRECTIONS.NONE) {
      this.direction = this.nextDirection;
    }

    // Flip sprite when moving left
    if (this.sprite) {
      if (this.direction.x < 0) {
        this.sprite.setFlipX(true);
      } else if (this.direction.x > 0) {
        this.sprite.setFlipX(false);
      }
    }

    // Determine how many tiles to move (1 for normal, 2 for dash)
    this.isDashingThisStep = this.dashPending;
    const moveDistance = this.dashPending ? 2 : 1;

    // If dashing, calculate trail positions
    if (this.dashPending) {
      // Clear old trail sprites
      this.clearTrail();

      // Starting position (tail)
      const startX = this.x;
      const startY = this.y;
      this.addTrailSprite(startX, startY, 0.4);

      // Middle position
      const midX = (this.x + this.direction.x + GRID.WIDTH) % GRID.WIDTH;
      const midY = (this.y + this.direction.y + GRID.HEIGHT) % GRID.HEIGHT;
      this.addTrailSprite(midX, midY, 0.7);

      this.dashTrailFrames = 15;
    }

    this.dashPending = false;

    // Move in current direction
    this.x += this.direction.x * moveDistance;
    this.y += this.direction.y * moveDistance;

    // Handle grid wrapping
    if (this.x < 0) this.x = (this.x % GRID.WIDTH) + GRID.WIDTH;
    if (this.x >= GRID.WIDTH) this.x = this.x % GRID.WIDTH;
    if (this.y < 0) this.y = (this.y % GRID.HEIGHT) + GRID.HEIGHT;
    if (this.y >= GRID.HEIGHT) this.y = this.y % GRID.HEIGHT;
  }

  addTrailSprite(x, y, opacity) {
    const trailSprite = this.scene.add.sprite(
      x * GRID.TILE_SIZE + GRID.TILE_SIZE / 2,
      y * GRID.TILE_SIZE + GRID.TILE_SIZE / 2,
      'player',
      'frame0000.png'
    );
    trailSprite.setScale(2);
    if (this.sprite) {
      trailSprite.setFlipX(this.sprite.flipX);
    }
    trailSprite.setAlpha(opacity);
    this.dashTrail.push(trailSprite);
  }

  clearTrail() {
    for (const sprite of this.dashTrail) {
      sprite.destroy();
    }
    this.dashTrail = [];
  }

  dash() {
    this.dashPending = true;
  }

  isDashingActive() {
    return this.isDashingThisStep;
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  render() {
    // Update sprite position
    this.sprite.setPosition(
      this.x * GRID.TILE_SIZE + GRID.TILE_SIZE / 2,
      this.y * GRID.TILE_SIZE + GRID.TILE_SIZE / 2
    );

    // Handle dash trail fade
    if (this.dashTrailFrames > 0) {
      this.dashTrailFrames--;
      if (this.dashTrailFrames <= 0) {
        this.clearTrail();
      }
    }
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
    this.clearTrail();
  }

  hide() {
    if (this.sprite) {
      this.sprite.setVisible(false);
    }
    this.clearTrail();
  }
}
