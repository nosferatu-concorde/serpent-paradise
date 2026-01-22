import { GRID, DIRECTIONS } from '../config.js';

export class Snake {
  constructor(scene, startX, startY, length, direction = DIRECTIONS.RIGHT) {
    this.scene = scene;
    this.segments = [];
    this.sprites = []; // Array of sprites for each segment
    this.direction = direction;
    this.alive = true;
    this.pendingGrowth = 0;
    this.blinking = false;
    this.blinkUntil = 0;

    // Create initial segments
    this.initializeSegments(startX, startY, length, direction);
  }

  initializeSegments(startX, startY, length, direction) {
    // Create segments from head backwards
    for (let i = 0; i < length; i++) {
      this.segments.push({
        x: startX - (direction.x * i),
        y: startY - (direction.y * i)
      });
    }
    this.createSprites();
  }

  createSprites() {
    // Clear existing sprites
    this.clearSprites();

    // Create a sprite for each segment
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      const frameName = this.getFrameForSegment(i);

      const sprite = this.scene.add.sprite(
        segment.x * GRID.TILE_SIZE + GRID.TILE_SIZE / 2,
        segment.y * GRID.TILE_SIZE + GRID.TILE_SIZE / 2,
        'sprites',
        frameName
      );
      this.sprites.push(sprite);
    }
  }

  getFrameForSegment(index) {
    if (index === 0) {
      return 'game_sprites_1.png'; // Head
    } else if (index === this.segments.length - 1) {
      return 'game_sprites_3.png'; // Tail
    } else {
      return 'game_sprites_2.png'; // Body
    }
  }

  // Get rotation for a segment based on direction
  // LEFT: 0, RIGHT: π, UP: π/2, DOWN: -π/2
  getRotationForDirection(dx, dy) {
    if (dx === -1 && dy === 0) return 0;           // LEFT
    if (dx === 1 && dy === 0) return Math.PI;      // RIGHT
    if (dx === 0 && dy === -1) return Math.PI / 2;  // UP
    if (dx === 0 && dy === 1) return -Math.PI / 2;  // DOWN
    return 0;
  }

  // Get direction from segment at index to the segment ahead (toward head)
  getSegmentDirection(index) {
    if (index === 0) {
      // Head uses snake's current direction
      return { dx: this.direction.x, dy: this.direction.y };
    }

    // Body/tail: direction from this segment to the one ahead (closer to head)
    const current = this.segments[index];
    const ahead = this.segments[index - 1];

    let dx = ahead.x - current.x;
    let dy = ahead.y - current.y;

    // Handle grid wrapping
    if (dx > 1) dx = -1;
    if (dx < -1) dx = 1;
    if (dy > 1) dy = -1;
    if (dy < -1) dy = 1;

    return { dx, dy };
  }

  clearSprites() {
    for (const sprite of this.sprites) {
      sprite.destroy();
    }
    this.sprites = [];
  }

  getHead() {
    return this.segments[0];
  }

  getTail() {
    return this.segments[this.segments.length - 1];
  }

  getBody() {
    return this.segments.slice(1, -1);
  }

  findDirectionToTarget(targetX, targetY) {
    const head = this.getHead();
    const dx = targetX - head.x;
    const dy = targetY - head.y;

    let wrapDx = dx;
    let wrapDy = dy;

    if (Math.abs(dx) > GRID.WIDTH / 2) {
      wrapDx = dx > 0 ? dx - GRID.WIDTH : dx + GRID.WIDTH;
    }
    if (Math.abs(dy) > GRID.HEIGHT / 2) {
      wrapDy = dy > 0 ? dy - GRID.HEIGHT : dy + GRID.HEIGHT;
    }

    if (Math.abs(wrapDx) > Math.abs(wrapDy)) {
      return wrapDx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
    } else if (Math.abs(wrapDy) > Math.abs(wrapDx)) {
      return wrapDy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
    }

    return this.direction;
  }

  findDirectionToFood(foodPositions) {
    if (!foodPositions || foodPositions.length === 0) {
      return this.direction;
    }

    const head = this.getHead();
    let nearestFood = null;
    let minDistance = Infinity;

    for (const food of foodPositions) {
      const dx = food.x - head.x;
      const dy = food.y - head.y;
      const distance = Math.abs(dx) + Math.abs(dy);

      if (distance < minDistance) {
        minDistance = distance;
        nearestFood = food;
      }
    }

    if (!nearestFood) return this.direction;

    return this.findDirectionToTarget(nearestFood.x, nearestFood.y);
  }

  collidesWithSelf(x, y) {
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      if (segment.x === x && segment.y === y) {
        return true;
      }
    }
    return false;
  }

  isPositionTooClose(x, y, otherSnakes) {
    for (const snake of otherSnakes) {
      if (snake === this || !snake.alive) continue;

      for (const segment of snake.segments) {
        if (segment.x === x && segment.y === y) {
          return true;
        }

        const dx = Math.abs(segment.x - x);
        const dy = Math.abs(segment.y - y);

        const wrapDx = Math.min(dx, GRID.WIDTH - dx);
        const wrapDy = Math.min(dy, GRID.HEIGHT - dy);

        if (wrapDx <= 1 && wrapDy <= 1 && (wrapDx + wrapDy > 0)) {
          return true;
        }
      }
    }
    return false;
  }

  findValidDirection(targetPosition, otherSnakes) {
    const head = this.getHead();
    const possibleDirections = [
      DIRECTIONS.UP,
      DIRECTIONS.DOWN,
      DIRECTIONS.LEFT,
      DIRECTIONS.RIGHT
    ];

    let targetDirection;
    if (targetPosition) {
      targetDirection = this.findDirectionToTarget(targetPosition.x, targetPosition.y);
    } else {
      targetDirection = this.direction;
    }

    const testPos = {
      x: (head.x + targetDirection.x + GRID.WIDTH) % GRID.WIDTH,
      y: (head.y + targetDirection.y + GRID.HEIGHT) % GRID.HEIGHT
    };

    if (!this.collidesWithSelf(testPos.x, testPos.y) &&
        !this.isPositionTooClose(testPos.x, testPos.y, otherSnakes)) {
      return targetDirection;
    }

    for (const dir of possibleDirections) {
      const testPos = {
        x: (head.x + dir.x + GRID.WIDTH) % GRID.WIDTH,
        y: (head.y + dir.y + GRID.HEIGHT) % GRID.HEIGHT
      };

      if (!this.collidesWithSelf(testPos.x, testPos.y) &&
          !this.isPositionTooClose(testPos.x, testPos.y, otherSnakes)) {
        return dir;
      }
    }

    return this.direction;
  }

  move(targetPosition = null, otherSnakes = []) {
    if (!this.alive || this.segments.length === 0) return;

    this.direction = this.findValidDirection(targetPosition, otherSnakes);

    const head = this.getHead();
    const newHead = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y
    };

    if (newHead.x < 0) newHead.x = GRID.WIDTH - 1;
    if (newHead.x >= GRID.WIDTH) newHead.x = 0;
    if (newHead.y < 0) newHead.y = GRID.HEIGHT - 1;
    if (newHead.y >= GRID.HEIGHT) newHead.y = 0;

    this.segments.unshift(newHead);

    if (this.pendingGrowth > 0) {
      this.pendingGrowth--;
      // Add a new sprite for the grown segment
      const newSprite = this.scene.add.sprite(
        newHead.x * GRID.TILE_SIZE + GRID.TILE_SIZE / 2,
        newHead.y * GRID.TILE_SIZE + GRID.TILE_SIZE / 2,
        'sprites',
        'game_sprites_1.png'
      );
      this.sprites.unshift(newSprite);
    } else {
      this.segments.pop();
    }

    if (this.segments.length <= 1) {
      this.alive = false;
    }
  }

  grow() {
    this.pendingGrowth++;
  }

  splitAt(segmentIndex) {
    if (segmentIndex <= 0 || segmentIndex >= this.segments.length - 1) {
      return null;
    }

    const newSnakeSegments = this.segments.slice(segmentIndex);
    this.segments = this.segments.slice(0, segmentIndex);

    // Update sprites - destroy and recreate for both snakes
    this.createSprites();

    const oppositeDirection = {
      x: -this.direction.x,
      y: -this.direction.y
    };

    const newSnake = new Snake(this.scene, 0, 0, 0, oppositeDirection);
    newSnake.segments = newSnakeSegments;
    newSnake.direction = oppositeDirection;
    newSnake.createSprites();

    if (this.segments.length <= 1) this.alive = false;
    if (newSnake.segments.length <= 1) newSnake.alive = false;

    return newSnake;
  }

  shrink() {
    if (this.segments.length > 1) {
      this.segments.pop();
      // Remove the tail sprite
      if (this.sprites.length > 0) {
        const tailSprite = this.sprites.pop();
        tailSprite.destroy();
      }
    }

    if (this.segments.length <= 1) {
      this.alive = false;
    }
  }

  checkCollision(x, y) {
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      if (segment.x === x && segment.y === y) {
        if (i === 0) return { type: 'head', index: i };
        if (i === this.segments.length - 1) return { type: 'tail', index: i };
        return { type: 'body', index: i };
      }
    }
    return null;
  }

  render() {
    if (!this.alive) return;

    const now = this.scene.time.now;
    const isVisible = !(this.blinking && now < this.blinkUntil && Math.floor(now / 150) % 2 === 0);

    // Update sprite positions, rotation, and visibility
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];

      if (i < this.sprites.length) {
        const sprite = this.sprites[i];
        sprite.setPosition(
          segment.x * GRID.TILE_SIZE + GRID.TILE_SIZE / 2,
          segment.y * GRID.TILE_SIZE + GRID.TILE_SIZE / 2
        );
        sprite.setVisible(isVisible);

        // Update frame based on position
        const frameName = this.getFrameForSegment(i);
        sprite.setFrame(frameName);

        // Update rotation based on direction
        const { dx, dy } = this.getSegmentDirection(i);
        sprite.setRotation(this.getRotationForDirection(dx, dy));
      }
    }

    if (now >= this.blinkUntil) {
      this.blinking = false;
    }
  }

  startBlinking(duration) {
    this.blinking = true;
    this.blinkUntil = this.scene.time.now + duration;
  }

  destroy() {
    this.clearSprites();
  }
}
