export class CollisionManager {
  constructor(scene, snakeManager) {
    this.scene = scene;
    this.snakeManager = snakeManager;
    this.gameOver = false;
    this.gameWon = false;
  }

  // Check all collisions between warrior and snakes
  checkCollisions(warrior) {
    const warriorPos = warrior.getPosition();
    const snakes = this.snakeManager.getAliveSnakes();

    for (const snake of snakes) {
      const collision = snake.checkCollision(warriorPos.x, warriorPos.y);

      if (collision) {
        this.handleCollision(collision, snake, warriorPos);
      }
    }
  }

  // Handle collision based on type
  handleCollision(collision, snake, warriorPos) {
    switch (collision.type) {
      case 'head':
        // Warrior touched snake head - GAME OVER
        this.gameOver = true;
        break;

      case 'body':
        // Hit body - SPLIT SNAKE
        const newSnake = snake.splitAt(collision.index);
        if (newSnake && newSnake.alive) {
          this.snakeManager.addSnake(newSnake);
          // Pause game and blink at the hit position
          this.scene.pauseGame(1000, warriorPos.x, warriorPos.y);
        }
        break;

      case 'tail':
        // Hit tail - SHRINK SNAKE
        snake.shrink();
        break;
    }
  }

  // Check win condition
  checkWinCondition() {
    if (this.snakeManager.allSnakesDead()) {
      this.gameWon = true;
    }
  }

  reset() {
    this.gameOver = false;
    this.gameWon = false;
  }

  isGameOver() {
    return this.gameOver;
  }

  isGameWon() {
    return this.gameWon;
  }
}
