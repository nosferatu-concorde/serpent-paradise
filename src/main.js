import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene.js';
import { CANVAS, COLORS } from './config.js';

const config = {
  type: Phaser.AUTO,
  width: CANVAS.WIDTH,
  height: CANVAS.HEIGHT,
  parent: 'game-container',
  backgroundColor: COLORS.BACKGROUND,
  scene: [GameScene],
  pixelArt: true,
  physics: {
    default: false
  }
};

const game = new Phaser.Game(config);
