import { GRID, GAME } from '../config.js';
import { Food } from '../entities/Food.js';

export class FoodManager {
  constructor(scene) {
    this.scene = scene;
    this.foods = [];
    this.lastSpawnTime = 0;
  }

  // Check if position is valid (not occupied)
  isPositionValid(x, y, warrior, snakes) {
    // Check warrior position
    if (warrior.x === x && warrior.y === y) {
      return false;
    }

    // Check all snake segments
    for (const snake of snakes) {
      if (!snake.alive) continue;
      for (const segment of snake.segments) {
        if (segment.x === x && segment.y === y) {
          return false;
        }
      }
    }

    // Check existing food
    for (const food of this.foods) {
      if (!food.eaten && food.x === x && food.y === y) {
        return false;
      }
    }

    return true;
  }

  // Find random valid position
  findRandomValidPosition(warrior, snakes) {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const x = Math.floor(Math.random() * GRID.WIDTH);
      const y = Math.floor(Math.random() * GRID.HEIGHT);

      if (this.isPositionValid(x, y, warrior, snakes)) {
        return { x, y };
      }

      attempts++;
    }

    return null; // No valid position found
  }

  // Spawn a new food item
  spawnFood(warrior, snakes) {
    const position = this.findRandomValidPosition(warrior, snakes);
    if (position) {
      const food = new Food(this.scene, position.x, position.y);
      this.foods.push(food);
      return food;
    }
    return null;
  }

  // Get positions of all active food
  getActiveFoodPositions() {
    return this.foods
      .filter(food => !food.eaten)
      .map(food => food.getPosition());
  }

  // Check if snake ate food at position
  checkFoodEaten(x, y) {
    for (const food of this.foods) {
      if (!food.eaten && food.x === x && food.y === y) {
        food.markEaten();
        return true;
      }
    }
    return false;
  }

  // Update food spawning
  update(time, warrior, snakes) {
    // Count active food
    const activeFood = this.foods.filter(food => !food.eaten).length;

    // Spawn food if below limit
    if (activeFood < GAME.FOOD_MAX) {
      if (time - this.lastSpawnTime > GAME.FOOD_SPAWN_INTERVAL) {
        this.spawnFood(warrior, snakes);
        this.lastSpawnTime = time;
      }
    }

    // Clean up eaten food - destroy graphics and remove from array
    const eatenFood = this.foods.filter(food => food.eaten);
    for (const food of eatenFood) {
      food.destroy();
    }
    this.foods = this.foods.filter(food => !food.eaten);
  }

  render() {
    for (const food of this.foods) {
      food.render();
    }
  }

  // Initialize with starting food
  initialize(warrior, snakes, count = GAME.FOOD_MAX) {
    for (let i = 0; i < count; i++) {
      this.spawnFood(warrior, snakes);
    }
  }

  destroy() {
    for (const food of this.foods) {
      food.destroy();
    }
    this.foods = [];
  }
}
