import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { LoadoutScene } from './scenes/LoadoutScene';
import { BattleScene } from './scenes/BattleScene';
import { UpgradeScene } from './scenes/UpgradeScene';
import { PauseOverlay } from './scenes/overlays/PauseOverlay';
import { ResultsOverlay } from './scenes/overlays/ResultsOverlay';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [BootScene, PreloadScene, MenuScene, LevelSelectScene, LoadoutScene, BattleScene, UpgradeScene, PauseOverlay, ResultsOverlay],
};
