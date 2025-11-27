import { GRID, COLORS, DIRECTIONS } from '../config.js';

export class Snake {
  constructor(scene, startX, startY, length, direction = DIRECTIONS.RIGHT) {
    this.scene = scene;
    this.segments = [];
    this.direction = direction;
    this.alive = true;
    this.graphics = null;
    this.pendingGrowth = 0; // Number of segments to add
    this.blinking = false; // Blink effect during split
    this.blinkUntil = 0; // Timestamp when blinking should stop

    // Create initial segments
    this.initializeSegments(startX, startY, length, direction);
    this.createGraphics();
  }

  initializeSegments(startX, startY, length, direction) {
    // Create segments from head backwards
    for (let i = 0; i < length; i++) {
      this.segments.push({
        x: startX - (direction.x * i),
        y: startY - (direction.y * i)
      });
    }
  }

  createGraphics() {
    this.graphics = this.scene.add.graphics();
  }

  getHead() {
    return this.segments[0];
  }

  getTail() {
    return this.segments[this.segments.length - 1];
  }

  getBody() {
    // Return body segments (excluding head and tail)
    return this.segments.slice(1, -1);
  }

  // AI: Find direction toward a target position
  findDirectionToTarget(targetX, targetY) {
    const head = this.getHead();

    // Calculate direction toward target
    const dx = targetX - head.x;
    const dy = targetY - head.y;

    // Handle wrapping - choose shorter path
    let wrapDx = dx;
    let wrapDy = dy;

    if (Math.abs(dx) > GRID.WIDTH / 2) {
      wrapDx = dx > 0 ? dx - GRID.WIDTH : dx + GRID.WIDTH;
    }
    if (Math.abs(dy) > GRID.HEIGHT / 2) {
      wrapDy = dy > 0 ? dy - GRID.HEIGHT : dy + GRID.HEIGHT;
    }

    // Prefer horizontal or vertical movement based on distance
    if (Math.abs(wrapDx) > Math.abs(wrapDy)) {
      return wrapDx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
    } else if (Math.abs(wrapDy) > Math.abs(wrapDx)) {
      return wrapDy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
    }

    // Equal distance, prefer current direction
    return this.direction;
  }

  // AI: Find direction toward nearest food
  findDirectionToFood(foodPositions) {
    if (!foodPositions || foodPositions.length === 0) {
      return this.direction; // Keep current direction if no food
    }

    const head = this.getHead();
    let nearestFood = null;
    let minDistance = Infinity;

    // Find nearest food
    for (const food of foodPositions) {
      const dx = food.x - head.x;
      const dy = food.y - head.y;
      const distance = Math.abs(dx) + Math.abs(dy); // Manhattan distance

      if (distance < minDistance) {
        minDistance = distance;
        nearestFood = food;
      }
    }

    if (!nearestFood) return this.direction;

    return this.findDirectionToTarget(nearestFood.x, nearestFood.y);
  }

  // Check if position collides with own body
  collidesWithSelf(x, y) {
    // Check all segments except the head (index 0)
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      if (segment.x === x && segment.y === y) {
        return true;
      }
    }
    return false;
  }

  // Check if position is too close to other snakes (on top or adjacent)
  isPositionTooClose(x, y, otherSnakes) {
    for (const snake of otherSnakes) {
      if (snake === this || !snake.alive) continue;

      for (const segment of snake.segments) {
        // Check if on top of segment
        if (segment.x === x && segment.y === y) {
          return true;
        }

        // Check if adjacent (1 tile away in cardinal or diagonal directions)
        const dx = Math.abs(segment.x - x);
        const dy = Math.abs(segment.y - y);

        // Handle wrapping for distance calculation
        const wrapDx = Math.min(dx, GRID.WIDTH - dx);
        const wrapDy = Math.min(dy, GRID.HEIGHT - dy);

        if (wrapDx <= 1 && wrapDy <= 1 && (wrapDx + wrapDy > 0)) {
          return true;
        }
      }
    }
    return false;
  }

  // Find a valid direction that avoids other snakes and self
  findValidDirection(targetPosition, otherSnakes) {
    const head = this.getHead();
    const possibleDirections = [
      DIRECTIONS.UP,
      DIRECTIONS.DOWN,
      DIRECTIONS.LEFT,
      DIRECTIONS.RIGHT
    ];

    // First, try the target-seeking direction
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

    // If target direction is blocked, try other directions
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

    // If all directions blocked, return current direction (shouldn't happen often)
    return this.direction;
  }

  move(targetPosition = null, otherSnakes = []) {
    if (!this.alive || this.segments.length === 0) return;

    // Update direction based on target-seeking AI with collision avoidance
    this.direction = this.findValidDirection(targetPosition, otherSnakes);

    // Calculate new head position
    const head = this.getHead();
    const newHead = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y
    };

    // Handle wrapping
    if (newHead.x < 0) newHead.x = GRID.WIDTH - 1;
    if (newHead.x >= GRID.WIDTH) newHead.x = 0;
    if (newHead.y < 0) newHead.y = GRID.HEIGHT - 1;
    if (newHead.y >= GRID.HEIGHT) newHead.y = 0;

    // Add new head
    this.segments.unshift(newHead);

    // Handle growth
    if (this.pendingGrowth > 0) {
      this.pendingGrowth--;
    } else {
      // Remove tail if not growing
      this.segments.pop();
    }

    // Check if snake should die (only head remaining)
    if (this.segments.length <= 1) {
      this.alive = false;
    }
  }

  grow() {
    this.pendingGrowth++;
  }

  // Split snake at given segment index
  // Returns new snake or null
  splitAt(segmentIndex) {
    if (segmentIndex <= 0 || segmentIndex >= this.segments.length - 1) {
      return null; // Can't split at head or tail
    }

    // Create new snake from split point to tail
    const newSnakeSegments = this.segments.slice(segmentIndex);

    // Keep this snake from head to split point (exclusive)
    this.segments = this.segments.slice(0, segmentIndex);

    // Create new snake with opposite direction (tail moves away from head)
    const oppositeDirection = {
      x: -this.direction.x,
      y: -this.direction.y
    };

    const newSnake = new Snake(this.scene, 0, 0, 0, oppositeDirection);
    newSnake.segments = newSnakeSegments;
    newSnake.direction = oppositeDirection;

    // Check if either snake should die
    if (this.segments.length <= 1) this.alive = false;
    if (newSnake.segments.length <= 1) newSnake.alive = false;

    return newSnake;
  }

  // Remove tail segment (damage)
  shrink() {
    if (this.segments.length > 1) {
      this.segments.pop();
    }

    // Check if snake should die
    if (this.segments.length <= 1) {
      this.alive = false;
    }
  }

  // Check if position matches any segment
  // Returns segment type: 'head', 'body', 'tail', or null
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

    this.graphics.clear();

    // Check if blinking and should be visible this frame
    const now = this.scene.time.now;
    if (this.blinking && now < this.blinkUntil) {
      // Blink every 150ms (on for 150ms, off for 150ms)
      const blinkCycle = Math.floor(now / 150) % 2;
      if (blinkCycle === 0) {
        // Don't render (invisible part of blink)
        return;
      }
    } else if (now >= this.blinkUntil) {
      // Stop blinking
      this.blinking = false;
    }

    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      let color;

      if (i === 0) {
        color = COLORS.SNAKE_HEAD;
      } else if (i === this.segments.length - 1) {
        color = COLORS.SNAKE_TAIL;
      } else {
        color = COLORS.SNAKE_BODY;
      }

      this.graphics.fillStyle(color, 1);
      this.graphics.fillRect(
        segment.x * GRID.TILE_SIZE,
        segment.y * GRID.TILE_SIZE,
        GRID.TILE_SIZE,
        GRID.TILE_SIZE
      );
    }
  }

  // Start blinking effect for a duration
  startBlinking(duration) {
    this.blinking = true;
    this.blinkUntil = this.scene.time.now + duration;
  }

  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
    }
  }
}
