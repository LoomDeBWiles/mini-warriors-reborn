import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { AudioManager } from '../managers/AudioManager';
import { GameState } from '../managers/GameState';
import { MUSIC_KEYS } from '../data/audio';
import { LoadoutGrid } from '../ui/LoadoutGrid';
import { getUnlockedUnits } from '../data/units';
import { Button } from '../ui/Button';
import { TransitionManager } from '../systems/TransitionManager';

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
  private battleButton!: Button;
  private selectedLoadout: string[] = [];

  constructor() {
    super({ key: 'loadout' });
  }

  init(data: LoadoutSceneData): void {
    this.stageId = data.stageId ?? 1;
  }

  create(): void {
    // Reset camera and fade in
    TransitionManager.resetCamera(this);
    TransitionManager.fadeIn(this);

    // Add background with parallax
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_loadout');
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const offsetX = (pointer.x - GAME_WIDTH / 2) * 0.008;
      const offsetY = (pointer.y - GAME_HEIGHT / 2) * 0.008;
      bg.setPosition(GAME_WIDTH / 2 + offsetX, GAME_HEIGHT / 2 + offsetY);
    });

    const audio = AudioManager.getInstance(this);
    audio?.switchMusic(MUSIC_KEYS.menu);

    // Title with shadow
    this.add.text(GAME_WIDTH / 2 + 2, 32, `Stage ${this.stageId} - Select Units`, {
      fontSize: '36px',
      color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.3);

    this.add.text(GAME_WIDTH / 2, 30, `Stage ${this.stageId} - Select Units`, {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Get unlocked units from game state
    const gameState = GameState.getInstance(this);
    const unlockedUnits = getUnlockedUnits(gameState?.unlockedUnits ?? ['swordsman']);

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

    // Battle button using Button component
    this.battleButton = new Button({
      scene: this,
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 60,
      label: 'Start Battle',
      tier: 'primary',
      width: 180,
      height: 56,
      fontSize: '28px',
      disabled: true,
      onClick: () => this.startBattle(),
    });

    // Back button
    new Button({
      scene: this,
      x: 80,
      y: GAME_HEIGHT - 60,
      label: 'Back',
      tier: 'secondary',
      width: 100,
      height: 44,
      onClick: () => {
        TransitionManager.transition(this, 'levelSelect', undefined, 'slideLeft');
      },
    });
  }

  private updateBattleButton(): void {
    this.battleButton.setDisabled(this.selectedLoadout.length === 0);
  }

  private startBattle(): void {
    if (this.selectedLoadout.length === 0) return;

    // Use zoom transition for dramatic battle entry
    TransitionManager.transition(
      this,
      'battle',
      { stageId: this.stageId, loadout: this.selectedLoadout },
      'zoom'
    );
  }
}
