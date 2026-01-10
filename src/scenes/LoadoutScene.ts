import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { AudioManager } from '../managers/AudioManager';
import { MUSIC_KEYS } from '../data/audio';
import { LoadoutGrid } from '../ui/LoadoutGrid';
import { getUnlockedUnits } from '../data/units';

const MAX_LOADOUT_SIZE = 5;

interface LoadoutSceneData {
  stageId: number;
}

/**
 * Pre-battle loadout selection scene.
 * Players select up to 5 units from their unlocked roster.
 */
export class LoadoutScene extends Phaser.Scene {
  private stageId = 1;
  private battleButton!: Phaser.GameObjects.Text;
  private selectedLoadout: string[] = [];

  constructor() {
    super({ key: 'loadout' });
  }

  init(data: LoadoutSceneData): void {
    this.stageId = data.stageId ?? 1;
  }

  create(): void {
    const audio = AudioManager.getInstance(this);
    audio?.switchMusic(MUSIC_KEYS.menu);

    // Title with stage info
    const title = this.add.text(GAME_WIDTH / 2, 30, `Stage ${this.stageId} - Select Units`, {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Get unlocked units based on highest stage reached
    // For now, use stageId as the unlock threshold
    const unlockedUnits = getUnlockedUnits(this.stageId);

    // Create loadout grid (self-registers with scene)
    new LoadoutGrid({
      scene: this,
      x: 50,
      y: 80,
      availableUnits: unlockedUnits,
      maxLoadoutSize: MAX_LOADOUT_SIZE,
      onLoadoutChange: (loadout) => {
        this.selectedLoadout = loadout;
        this.updateBattleButton();
      },
    });

    // Battle button
    this.battleButton = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'Start Battle', {
      fontSize: '32px',
      color: '#888888',
      backgroundColor: '#333333',
      padding: { x: 30, y: 15 },
    });
    this.battleButton.setOrigin(0.5);
    this.setupBattleButton();

    // Back button
    const backButton = this.add.text(50, GAME_HEIGHT - 60, 'Back', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#4a4a4a',
      padding: { x: 20, y: 10 },
    });
    backButton.setOrigin(0, 0.5);
    backButton.setInteractive({ useHandCursor: true });

    backButton.on('pointerover', () => {
      backButton.setStyle({ backgroundColor: '#6a6a6a' });
    });
    backButton.on('pointerout', () => {
      backButton.setStyle({ backgroundColor: '#4a4a4a' });
    });
    backButton.on('pointerdown', () => {
      this.scene.start('levelSelect');
    });
  }

  private setupBattleButton(): void {
    this.battleButton.setInteractive({ useHandCursor: true });

    this.battleButton.on('pointerover', () => {
      if (this.selectedLoadout.length > 0) {
        this.battleButton.setStyle({ backgroundColor: '#4a6a4a' });
      }
    });

    this.battleButton.on('pointerout', () => {
      this.updateBattleButton();
    });

    this.battleButton.on('pointerdown', () => {
      if (this.selectedLoadout.length > 0) {
        this.startBattle();
      }
    });
  }

  private updateBattleButton(): void {
    if (this.selectedLoadout.length > 0) {
      this.battleButton.setStyle({
        color: '#ffffff',
        backgroundColor: '#3a5a3a',
      });
    } else {
      this.battleButton.setStyle({
        color: '#888888',
        backgroundColor: '#333333',
      });
    }
  }

  private startBattle(): void {
    this.scene.start('battle', {
      stageId: this.stageId,
      loadout: this.selectedLoadout,
    });
  }
}
