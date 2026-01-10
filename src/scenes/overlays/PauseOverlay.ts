import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../constants';
import { AudioManager } from '../../managers/AudioManager';

const SETTINGS_STORAGE_KEY = 'miniWarriorsSettings';
const SLIDER_WIDTH = 200;
const SLIDER_HEIGHT = 8;
const HANDLE_RADIUS = 12;

/**
 * Semi-transparent pause overlay with Resume, Settings, and Quit buttons.
 * Launch this scene parallel to the battle scene using scene.launch('pause').
 * Resume closes this overlay and resumes the paused battle scene.
 */
export class PauseOverlay extends Phaser.Scene {
  /** The scene key that was paused (passed via scene data) */
  private pausedSceneKey: string | null = null;
  /** Settings panel container, shown when Settings button is clicked */
  private settingsPanel: Phaser.GameObjects.Container | null = null;
  /** Main menu buttons container */
  private menuButtons: Phaser.GameObjects.Container | null = null;

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

    // Create menu buttons in a container
    this.menuButtons = this.add.container(0, 0);
    this.createMenuButtons();

    // Create settings panel (initially hidden)
    this.settingsPanel = this.add.container(0, 0);
    this.createSettingsPanel();
    this.settingsPanel.setVisible(false);

    // ESC key to resume or close settings
    this.input.keyboard?.on('keydown-ESC', () => this.handleEsc());
  }

  private createMenuButtons(): void {
    if (!this.menuButtons) return;

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

    this.menuButtons.add([resumeButton, settingsButton, quitButton]);
  }

  private createSettingsPanel(): void {
    if (!this.settingsPanel) return;

    const panelCenterX = GAME_WIDTH / 2;
    const panelStartY = GAME_HEIGHT / 2 - 60;

    // Settings title
    const settingsTitle = this.add.text(panelCenterX, panelStartY - 60, 'Settings', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    settingsTitle.setOrigin(0.5);

    // Music volume label
    const musicLabel = this.add.text(panelCenterX - SLIDER_WIDTH / 2, panelStartY, 'Music Volume', {
      fontSize: '24px',
      color: '#ffffff',
    });
    musicLabel.setOrigin(0, 0.5);

    // Get current volume from AudioManager or localStorage
    const audio = AudioManager.getInstance(this);
    const savedSettings = this.loadSettings();
    const initialVolume = savedSettings.musicVolume ?? 1.0;

    // Create volume slider
    const sliderY = panelStartY + 40;
    const sliderElements = this.createVolumeSlider(
      panelCenterX,
      sliderY,
      initialVolume,
      (volume: number) => {
        audio?.setMusicVolume(volume);
        this.saveSettings({ musicVolume: volume });
      }
    );

    // Back button
    const backButton = this.add.text(panelCenterX, panelStartY + 120, 'Back', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#4a4a4a',
      padding: { x: 30, y: 15 },
    });
    backButton.setOrigin(0.5);
    this.setupButton(backButton, () => this.closeSettings());

    this.settingsPanel.add([settingsTitle, musicLabel, ...sliderElements, backButton]);
  }

  private createVolumeSlider(
    centerX: number,
    y: number,
    initialValue: number,
    onChange: (value: number) => void
  ): Phaser.GameObjects.GameObject[] {
    const sliderX = centerX - SLIDER_WIDTH / 2;

    // Slider track background
    const track = this.add.rectangle(
      centerX,
      y,
      SLIDER_WIDTH,
      SLIDER_HEIGHT,
      0x333333
    );
    track.setOrigin(0.5);

    // Slider fill (shows current volume level)
    const fill = this.add.rectangle(
      sliderX,
      y,
      SLIDER_WIDTH * initialValue,
      SLIDER_HEIGHT,
      0x4a90d9
    );
    fill.setOrigin(0, 0.5);

    // Slider handle
    const handleX = sliderX + SLIDER_WIDTH * initialValue;
    const handle = this.add.circle(handleX, y, HANDLE_RADIUS, 0xffffff);
    handle.setInteractive({ useHandCursor: true, draggable: true });

    // Hit area for clicking on track
    const hitArea = this.add.rectangle(centerX, y, SLIDER_WIDTH + HANDLE_RADIUS * 2, HANDLE_RADIUS * 3, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    // Handle drag
    this.input.setDraggable(handle);
    handle.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      const clampedX = Phaser.Math.Clamp(dragX, sliderX, sliderX + SLIDER_WIDTH);
      handle.x = clampedX;
      const value = (clampedX - sliderX) / SLIDER_WIDTH;
      fill.width = SLIDER_WIDTH * value;
      onChange(value);
    });

    // Click on track to set volume
    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const clampedX = Phaser.Math.Clamp(pointer.x, sliderX, sliderX + SLIDER_WIDTH);
      handle.x = clampedX;
      const value = (clampedX - sliderX) / SLIDER_WIDTH;
      fill.width = SLIDER_WIDTH * value;
      onChange(value);
    });

    // Volume percentage display
    const percentText = this.add.text(centerX + SLIDER_WIDTH / 2 + 20, y, `${Math.round(initialValue * 100)}%`, {
      fontSize: '20px',
      color: '#aaaaaa',
    });
    percentText.setOrigin(0, 0.5);

    // Update percentage text on change
    const originalOnChange = onChange;
    onChange = (value: number) => {
      percentText.setText(`${Math.round(value * 100)}%`);
      originalOnChange(value);
    };

    // Re-bind handlers with updated onChange
    handle.off('drag');
    handle.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      const clampedX = Phaser.Math.Clamp(dragX, sliderX, sliderX + SLIDER_WIDTH);
      handle.x = clampedX;
      const value = (clampedX - sliderX) / SLIDER_WIDTH;
      fill.width = SLIDER_WIDTH * value;
      onChange(value);
    });

    hitArea.off('pointerdown');
    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const clampedX = Phaser.Math.Clamp(pointer.x, sliderX, sliderX + SLIDER_WIDTH);
      handle.x = clampedX;
      const value = (clampedX - sliderX) / SLIDER_WIDTH;
      fill.width = SLIDER_WIDTH * value;
      onChange(value);
    });

    return [track, fill, handle, hitArea, percentText];
  }

  private handleEsc(): void {
    if (this.settingsPanel?.visible) {
      this.closeSettings();
    } else {
      this.resume();
    }
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
    this.menuButtons?.setVisible(false);
    this.settingsPanel?.setVisible(true);
  }

  private closeSettings(): void {
    this.settingsPanel?.setVisible(false);
    this.menuButtons?.setVisible(true);
  }

  private loadSettings(): { musicVolume?: number } {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors, return default
    }
    return {};
  }

  private saveSettings(updates: { musicVolume?: number }): void {
    try {
      const current = this.loadSettings();
      const merged = { ...current, ...updates };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // Ignore storage errors
    }
  }

  private quitToMenu(): void {
    if (this.pausedSceneKey) {
      this.scene.stop(this.pausedSceneKey);
    }
    this.scene.stop();
    this.scene.start('menu');
  }
}
