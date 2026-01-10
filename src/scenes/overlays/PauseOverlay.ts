import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config';

/**
 * Semi-transparent pause overlay with Resume, Settings, and Quit buttons.
 * Launch this scene parallel to the battle scene using scene.launch('pause').
 * Resume closes this overlay and resumes the paused battle scene.
 */
export class PauseOverlay extends Phaser.Scene {
  /** The scene key that was paused (passed via scene data) */
  private pausedSceneKey: string | null = null;

  constructor() {
    super({ key: 'pause' });
  }

  init(data: { pausedScene?: string }): void {
    this.pausedSceneKey = data.pausedScene ?? null;
  }

  create(): void {
    // Semi-transparent dark overlay covering the entire screen
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.7
    );
    overlay.setInteractive(); // Block clicks from passing through

    // Pause title
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3, 'PAUSED', {
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Button styling
    const buttonStyle = {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#4a4a4a',
      padding: { x: 30, y: 15 },
    };

    const buttonSpacing = 70;
    const buttonsStartY = GAME_HEIGHT / 2;

    // Resume button
    const resumeButton = this.add.text(GAME_WIDTH / 2, buttonsStartY, 'Resume', buttonStyle);
    resumeButton.setOrigin(0.5);
    this.setupButton(resumeButton, () => this.resume());

    // Settings button
    const settingsButton = this.add.text(
      GAME_WIDTH / 2,
      buttonsStartY + buttonSpacing,
      'Settings',
      buttonStyle
    );
    settingsButton.setOrigin(0.5);
    this.setupButton(settingsButton, () => this.openSettings());

    // Quit button
    const quitButton = this.add.text(
      GAME_WIDTH / 2,
      buttonsStartY + buttonSpacing * 2,
      'Quit',
      buttonStyle
    );
    quitButton.setOrigin(0.5);
    this.setupButton(quitButton, () => this.quitToMenu());

    // ESC key to resume
    this.input.keyboard?.on('keydown-ESC', () => this.resume());
  }

  private setupButton(
    button: Phaser.GameObjects.Text,
    onClick: () => void
  ): void {
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      button.setStyle({ backgroundColor: '#6a6a6a' });
    });

    button.on('pointerout', () => {
      button.setStyle({ backgroundColor: '#4a4a4a' });
    });

    button.on('pointerdown', onClick);
  }

  private resume(): void {
    if (this.pausedSceneKey) {
      this.scene.resume(this.pausedSceneKey);
    }
    this.scene.stop();
  }

  private openSettings(): void {
    // Settings scene not yet implemented
    console.log('Settings not yet implemented');
  }

  private quitToMenu(): void {
    if (this.pausedSceneKey) {
      this.scene.stop(this.pausedSceneKey);
    }
    this.scene.stop();
    this.scene.start('menu');
  }
}
