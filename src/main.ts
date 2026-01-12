import Phaser from 'phaser';
import { gameConfig } from './config';

export function createGame(): Phaser.Game {
  return new Phaser.Game(gameConfig);
}

// Initialize game when DOM is ready
window.addEventListener('load', () => {
  createGame();

  // Prevent iOS Safari fullscreen keyboard warning
  const canvas = document.querySelector('#game-container canvas');
  if (canvas) {
    canvas.setAttribute('inputmode', 'none');
  }
});
