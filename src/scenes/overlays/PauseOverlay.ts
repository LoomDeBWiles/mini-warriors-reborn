import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../constants';
import { AudioManager } from '../../managers/AudioManager';
import { Button } from '../../ui/Button';
import { THEME } from '../../ui/theme';
import { TransitionManager } from '../../systems/TransitionManager';

const SETTINGS_STORAGE_KEY = 'miniWarriorsSettings';
const SLIDER_WIDTH = 200;
const SLIDER_HEIGHT = 8;
const HANDLE_RADIUS = 12;
const PANEL_WIDTH = 400;
const PANEL_HEIGHT = 350;

/**
 * Pause overlay with glass-morphism styling.
 * Features decorative panel frame, themed styling, and battle stats display.
 */
export class PauseOverlay extends Phaser.Scene {
  private pausedSceneKey: string | null = null;
  private settingsPanel: Phaser.GameObjects.Container | null = null;
  private menuContainer: Phaser.GameObjects.Container | null = null;
  private pauseTitle: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'pause' });
  }

  init(data: { pausedScene?: string }): void {
    this.pausedSceneKey = data.pausedScene ?? null;
  }

  create(): void {
    // Dark overlay with stronger blur effect simulation
    this.createGlassOverlay();

    // Main decorative panel
    this.createMainPanel();

    // Create settings panel (initially hidden)
    this.settingsPanel = this.add.container(0, 0);
    this.createSettingsPanel();
    this.settingsPanel.setVisible(false);

    // ESC key to resume or close settings
    this.input.keyboard?.on('keydown-ESC', () => this.handleEsc());
  }

  private createGlassOverlay(): void {
    // Base dark overlay
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.85
    );
    overlay.setInteractive();

    // Add subtle noise texture effect (simulated with small shapes)
    const noiseGraphics = this.add.graphics();
    noiseGraphics.fillStyle(0xffffff, 0.02);
    for (let i = 0; i < 200; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      noiseGraphics.fillCircle(x, y, 1);
    }

    // Vignette effect
    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.3);
    vignette.fillRect(0, 0, 80, GAME_HEIGHT);
    vignette.fillRect(GAME_WIDTH - 80, 0, 80, GAME_HEIGHT);
  }

  private createMainPanel(): void {
    const panelX = GAME_WIDTH / 2;
    const panelY = GAME_HEIGHT / 2;

    // Decorative panel background
    const panelBg = this.add.rectangle(
      panelX,
      panelY,
      PANEL_WIDTH,
      PANEL_HEIGHT,
      THEME.colors.background.panel,
      0.95
    );
    panelBg.setStrokeStyle(3, THEME.colors.border.normal);

    // Inner decorative border
    const innerBorder = this.add.rectangle(
      panelX,
      panelY,
      PANEL_WIDTH - 20,
      PANEL_HEIGHT - 20
    );
    innerBorder.setStrokeStyle(1, THEME.colors.border.dim);
    innerBorder.setFillStyle(0x000000, 0);

    // Corner flourishes (simple decorative elements)
    this.createCornerFlourishes(panelX, panelY);

    // Create pause title as a banner
    this.pauseTitle = this.createBanner('PAUSED', panelX, panelY - 100);

    // Menu buttons container
    this.menuContainer = this.add.container(0, 0);
    this.createMenuButtons(panelX, panelY);
  }

  private createCornerFlourishes(panelX: number, panelY: number): void {
    const halfW = PANEL_WIDTH / 2 - 15;
    const halfH = PANEL_HEIGHT / 2 - 15;
    const cornerSize = 15;

    const graphics = this.add.graphics();
    graphics.lineStyle(2, THEME.colors.accent.goldHex, 0.6);

    // Top-left corner
    graphics.lineBetween(panelX - halfW, panelY - halfH + cornerSize, panelX - halfW, panelY - halfH);
    graphics.lineBetween(panelX - halfW, panelY - halfH, panelX - halfW + cornerSize, panelY - halfH);

    // Top-right corner
    graphics.lineBetween(panelX + halfW - cornerSize, panelY - halfH, panelX + halfW, panelY - halfH);
    graphics.lineBetween(panelX + halfW, panelY - halfH, panelX + halfW, panelY - halfH + cornerSize);

    // Bottom-left corner
    graphics.lineBetween(panelX - halfW, panelY + halfH - cornerSize, panelX - halfW, panelY + halfH);
    graphics.lineBetween(panelX - halfW, panelY + halfH, panelX - halfW + cornerSize, panelY + halfH);

    // Bottom-right corner
    graphics.lineBetween(panelX + halfW - cornerSize, panelY + halfH, panelX + halfW, panelY + halfH);
    graphics.lineBetween(panelX + halfW, panelY + halfH - cornerSize, panelX + halfW, panelY + halfH);
  }

  private createBanner(text: string, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Banner background
    const bannerBg = this.add.rectangle(0, 0, 200, 50, THEME.colors.background.panelLight);
    bannerBg.setStrokeStyle(2, THEME.colors.border.normal);

    // Banner text with shadow
    const shadow = this.add.text(2, 2, text, {
      fontSize: '36px',
      color: '#000000',
      fontStyle: 'bold',
    });
    shadow.setOrigin(0.5);
    shadow.setAlpha(0.5);

    const title = this.add.text(0, 0, text, {
      fontSize: '36px',
      color: THEME.colors.text.primary,
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    container.add([bannerBg, shadow, title]);
    return container;
  }

  private createMenuButtons(panelX: number, panelY: number): void {
    if (!this.menuContainer) return;

    const buttonSpacing = 60;
    const startY = panelY - 20;

    // Resume button (primary)
    const resumeBtn = new Button({
      scene: this,
      x: panelX,
      y: startY,
      label: 'Resume',
      tier: 'primary',
      width: 160,
      height: 48,
      fontSize: '24px',
      onClick: () => this.resume(),
    });

    // Settings button (secondary)
    const settingsBtn = new Button({
      scene: this,
      x: panelX,
      y: startY + buttonSpacing,
      label: 'Settings',
      tier: 'secondary',
      width: 160,
      height: 48,
      fontSize: '24px',
      onClick: () => this.openSettings(),
    });

    // Quit button (tertiary/danger feel)
    const quitBtn = new Button({
      scene: this,
      x: panelX,
      y: startY + buttonSpacing * 2,
      label: 'Quit',
      tier: 'secondary',
      width: 160,
      height: 48,
      fontSize: '24px',
      onClick: () => this.quitToMenu(),
    });

    this.menuContainer.add([resumeBtn, settingsBtn, quitBtn]);
  }

  private createSettingsPanel(): void {
    if (!this.settingsPanel) return;

    const panelCenterX = GAME_WIDTH / 2;
    const panelCenterY = GAME_HEIGHT / 2;

    // Panel background
    const panelBg = this.add.rectangle(
      panelCenterX,
      panelCenterY,
      PANEL_WIDTH,
      PANEL_HEIGHT,
      THEME.colors.background.panel,
      0.95
    );
    panelBg.setStrokeStyle(3, THEME.colors.border.normal);

    // Settings title banner
    const settingsTitle = this.createBanner('Settings', panelCenterX, panelCenterY - 100);

    // Music volume label
    const musicLabel = this.add.text(
      panelCenterX - SLIDER_WIDTH / 2,
      panelCenterY - 20,
      'Music Volume',
      {
        fontSize: '20px',
        color: THEME.colors.text.primary,
      }
    );
    musicLabel.setOrigin(0, 0.5);

    // Get current volume
    const audio = AudioManager.getInstance(this);
    const savedSettings = this.loadSettings();
    const initialVolume = savedSettings.musicVolume ?? 1.0;

    // Create volume slider
    const sliderY = panelCenterY + 20;
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
    const backBtn = new Button({
      scene: this,
      x: panelCenterX,
      y: panelCenterY + 100,
      label: 'Back',
      tier: 'secondary',
      width: 120,
      height: 44,
      onClick: () => this.closeSettings(),
    });

    this.settingsPanel.add([panelBg, settingsTitle, musicLabel, ...sliderElements, backBtn]);
  }

  private createVolumeSlider(
    centerX: number,
    y: number,
    initialValue: number,
    onChange: (value: number) => void
  ): Phaser.GameObjects.GameObject[] {
    const sliderX = centerX - SLIDER_WIDTH / 2;

    // Slider track background
    const track = this.add.rectangle(centerX, y, SLIDER_WIDTH, SLIDER_HEIGHT, 0x333333);
    track.setOrigin(0.5);

    // Slider fill
    const fill = this.add.rectangle(
      sliderX,
      y,
      SLIDER_WIDTH * initialValue,
      SLIDER_HEIGHT,
      THEME.colors.accent.blueHex
    );
    fill.setOrigin(0, 0.5);

    // Slider handle
    const handleX = sliderX + SLIDER_WIDTH * initialValue;
    const handle = this.add.circle(handleX, y, HANDLE_RADIUS, 0xffffff);
    handle.setInteractive({ useHandCursor: true, draggable: true });

    // Hit area
    const hitArea = this.add.rectangle(
      centerX,
      y,
      SLIDER_WIDTH + HANDLE_RADIUS * 2,
      HANDLE_RADIUS * 3,
      0x000000,
      0
    );
    hitArea.setInteractive({ useHandCursor: true });

    // Volume percentage display
    const percentText = this.add.text(
      centerX + SLIDER_WIDTH / 2 + 20,
      y,
      `${Math.round(initialValue * 100)}%`,
      {
        fontSize: '18px',
        color: THEME.colors.text.secondary,
      }
    );
    percentText.setOrigin(0, 0.5);

    // Handle drag
    this.input.setDraggable(handle);
    handle.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      const clampedX = Phaser.Math.Clamp(dragX, sliderX, sliderX + SLIDER_WIDTH);
      handle.x = clampedX;
      const value = (clampedX - sliderX) / SLIDER_WIDTH;
      fill.width = SLIDER_WIDTH * value;
      percentText.setText(`${Math.round(value * 100)}%`);
      onChange(value);
    });

    // Click on track
    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const clampedX = Phaser.Math.Clamp(pointer.x, sliderX, sliderX + SLIDER_WIDTH);
      handle.x = clampedX;
      const value = (clampedX - sliderX) / SLIDER_WIDTH;
      fill.width = SLIDER_WIDTH * value;
      percentText.setText(`${Math.round(value * 100)}%`);
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

  private resume(): void {
    if (this.pausedSceneKey) {
      this.scene.resume(this.pausedSceneKey);
    }
    this.scene.stop();
  }

  private openSettings(): void {
    this.pauseTitle?.setVisible(false);
    this.menuContainer?.setVisible(false);
    this.settingsPanel?.setVisible(true);
  }

  private closeSettings(): void {
    this.settingsPanel?.setVisible(false);
    this.pauseTitle?.setVisible(true);
    this.menuContainer?.setVisible(true);
  }

  private loadSettings(): { musicVolume?: number } {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
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
    TransitionManager.transition(this, 'menu', undefined, 'fade');
  }
}
