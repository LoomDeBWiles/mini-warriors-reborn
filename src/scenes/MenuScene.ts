import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'menu' });
  }

  create(): void {
    // Title text
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3, 'Mini Warriors Reborn', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Placeholder start button
    const startButton = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Start Game', {
      fontSize: '32px',
      color: '#4a90d9',
      backgroundColor: '#222222',
      padding: { x: 20, y: 10 },
    });
    startButton.setOrigin(0.5);
    startButton.setInteractive({ useHandCursor: true });

    startButton.on('pointerover', () => {
      startButton.setColor('#6ab0f9');
    });

    startButton.on('pointerout', () => {
      startButton.setColor('#4a90d9');
    });

    startButton.on('pointerdown', () => {
      // Will navigate to level select in future
      console.log('Start game clicked - level select not yet implemented');
    });

    // Version text
    const versionText = this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, 'v0.1.0', {
      fontSize: '14px',
      color: '#666666',
    });
    versionText.setOrigin(1, 1);
  }
}
