import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { AudioManager } from '../managers/AudioManager';
import { MUSIC_KEYS } from '../data/audio';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'menu' });
  }

  create(): void {
    // Start menu music with crossfade
    const audio = AudioManager.getInstance(this);
    audio?.switchMusic(MUSIC_KEYS.menu);

    // Title text
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3, 'Mini Warriors Reborn', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Menu buttons layout
    const buttonY = GAME_HEIGHT / 2;
    const buttonSpacing = 60;

    // Play button
    this.createMenuButton('Play', GAME_WIDTH / 2, buttonY, () => {
      this.scene.start('levelSelect');
    });

    // Options button
    this.createMenuButton('Options', GAME_WIDTH / 2, buttonY + buttonSpacing, () => {
      // Options scene not yet implemented - button is present but non-functional
    });

    // Stats button
    this.createMenuButton('Stats', GAME_WIDTH / 2, buttonY + buttonSpacing * 2, () => {
      // Stats scene not yet implemented - button is present but non-functional
    });

    // Version text
    const versionText = this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, 'v0.1.0', {
      fontSize: '14px',
      color: '#666666',
    });
    versionText.setOrigin(1, 1);
  }

  private createMenuButton(label: string, x: number, y: number, onClick: () => void): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, label, {
      fontSize: '32px',
      color: '#4a90d9',
      backgroundColor: '#222222',
      padding: { x: 20, y: 10 },
    });
    button.setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      button.setColor('#6ab0f9');
    });

    button.on('pointerout', () => {
      button.setColor('#4a90d9');
    });

    button.on('pointerdown', onClick);

    return button;
  }
}
