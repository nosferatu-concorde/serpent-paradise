// Game configuration constants
export const GRID = {
  WIDTH: 24,
  HEIGHT: 18,
  TILE_SIZE: 32
};

export const CANVAS = {
  WIDTH: GRID.WIDTH * GRID.TILE_SIZE, // 1024px
  HEIGHT: GRID.HEIGHT * GRID.TILE_SIZE // 768px
};

export const COLORS = {
  WARRIOR: 0x00ff00,      // Green
  SNAKE_HEAD: 0xff0000,   // Red
  SNAKE_BODY: 0xffff00,   // Yellow
  SNAKE_TAIL: 0xff9900,   // Orange
  FOOD: 0xff00ff,         // Magenta
  GRID_LINE: 0x333333,    // Dark gray
  BACKGROUND: 0x000000    // Black
};

export const GAME = {
  FOOD_MAX: 5,
  FOOD_SPAWN_INTERVAL: 2000, // milliseconds
  MOVE_DELAY: 300, // milliseconds between moves (affects speed)
  SNAKE_INITIAL_LENGTH: 5,
  WARRIOR_START_X: 12,
  WARRIOR_START_Y: 9
};

export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
  NONE: { x: 0, y: 0 }
};
