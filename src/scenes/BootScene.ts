import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'boot' });
  }

  preload(): void {
    // Minimal assets for loading screen can be loaded here
  }

  create(): void {
    this.scene.start('preload');
  }
}
