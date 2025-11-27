import { Snake } from '../entities/Snake.js';
import { DIRECTIONS, GAME } from '../config.js';

export class SnakeManager {
  constructor(scene) {
    this.scene = scene;
    this.snakes = [];
  }

  // Spawn a new snake
  spawnSnake(x, y, length = GAME.SNAKE_INITIAL_LENGTH, direction = DIRECTIONS.RIGHT) {
    const snake = new Snake(this.scene, x, y, length, direction);
    this.snakes.push(snake);
    return snake;
  }

  // Add an already created snake (for splits)
  addSnake(snake) {
    this.snakes.push(snake);
  }

  // Move all snakes
  update(foodPositions, warriorPosition) {
    const activeFoodPositions = foodPositions || [];

    // Find the shortest snake
    let shortestSnake = null;
    let minLength = Infinity;

    for (const snake of this.snakes) {
      if (snake.alive && snake.segments.length < minLength) {
        minLength = snake.segments.length;
        shortestSnake = snake;
      }
    }

    for (const snake of this.snakes) {
      if (snake.alive) {
        let target;

        if (snake === shortestSnake) {
          // Shortest snake seeks food
          if (activeFoodPositions.length > 0) {
            const head = snake.getHead();
            let nearestFood = null;
            let minDist = Infinity;

            for (const food of activeFoodPositions) {
              const dist = Math.abs(food.x - head.x) + Math.abs(food.y - head.y);
              if (dist < minDist) {
                minDist = dist;
                nearestFood = food;
              }
            }
            target = nearestFood;
          } else {
            target = null;
          }
        } else {
          // Other snakes seek the player
          target = warriorPosition;
        }

        // Pass all snakes for collision avoidance
        snake.move(target, this.snakes);
      }
    }
  }

  // Check if any snake ate food and handle growth
  checkFoodCollisions(foodManager) {
    for (const snake of this.snakes) {
      if (!snake.alive) continue;

      const head = snake.getHead();
      if (foodManager.checkFoodEaten(head.x, head.y)) {
        snake.grow();
      }
    }
  }

  // Remove dead snakes
  removeDeadSnakes() {
    const deadSnakes = this.snakes.filter(snake => !snake.alive);
    for (const snake of deadSnakes) {
      snake.destroy();
    }
    this.snakes = this.snakes.filter(snake => snake.alive);
  }

  // Get all alive snakes
  getAliveSnakes() {
    return this.snakes.filter(snake => snake.alive);
  }

  // Check if all snakes are dead (win condition)
  allSnakesDead() {
    return this.getAliveSnakes().length === 0;
  }

  render() {
    for (const snake of this.snakes) {
      snake.render();
    }
  }

  destroy() {
    for (const snake of this.snakes) {
      snake.destroy();
    }
    this.snakes = [];
  }
}
