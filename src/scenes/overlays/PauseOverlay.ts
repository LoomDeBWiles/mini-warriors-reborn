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
const PANEL_HEIGHT = 420;

// Platform detection helpers
function isIOSDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isIPad(): boolean {
  return /iPad/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isIPhone(): boolean {
  return isIOSDevice() && !isIPad();
}

function isStandaloneMode(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

/**
 * Pause overlay with glass-morphism styling.
 * Features decorative panel frame, themed styling, and battle stats display.
 */
export class PauseOverlay extends Phaser.Scene {
  private pausedSceneKey: string | null = null;
  private settingsPanel: Phaser.GameObjects.Container | null = null;
  private menuContainer: Phaser.GameObjects.Container | null = null;
  private pauseTitle: Phaser.GameObjects.Container | null = null;
  private fullscreenToggleText: Phaser.GameObjects.Text | null = null;
  private fullscreenToggleBg: Phaser.GameObjects.Rectangle | null = null;
  private addToHomeScreenPopup: Phaser.GameObjects.Container | null = null;

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
      panelCenterY - 50,
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
    const sliderY = panelCenterY - 10;
    const sliderElements = this.createVolumeSlider(
      panelCenterX,
      sliderY,
      initialVolume,
      (volume: number) => {
        audio?.setMusicVolume(volume);
        this.saveSettings({ musicVolume: volume });
      }
    );

    // Fullscreen toggle
    const fullscreenElements = this.createFullscreenToggle(
      panelCenterX,
      panelCenterY + 50
    );

    // Back button
    const backBtn = new Button({
      scene: this,
      x: panelCenterX,
      y: panelCenterY + 130,
      label: 'Back',
      tier: 'secondary',
      width: 120,
      height: 44,
      onClick: () => this.closeSettings(),
    });

    // Listen for fullscreen changes
    this.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, this.onFullscreenChange, this);
    this.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, this.onFullscreenChange, this);

    this.settingsPanel.add([panelBg, settingsTitle, musicLabel, ...sliderElements, ...fullscreenElements, backBtn]);
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

  private createFullscreenToggle(
    centerX: number,
    y: number
  ): Phaser.GameObjects.GameObject[] {
    // Fullscreen label
    const label = this.add.text(
      centerX - SLIDER_WIDTH / 2,
      y - 20,
      'Fullscreen',
      {
        fontSize: '20px',
        color: THEME.colors.text.primary,
      }
    );
    label.setOrigin(0, 0.5);

    const toggleWidth = 80;
    const toggleHeight = 36;

    // Check if running in standalone mode (PWA) or on iPhone
    const standalone = isStandaloneMode();
    const oniPhone = isIPhone();

    if (standalone) {
      // Already in fullscreen mode (PWA) - show as ON and disabled
      this.fullscreenToggleBg = this.add.rectangle(
        centerX,
        y + 10,
        toggleWidth,
        toggleHeight,
        THEME.colors.accent.blueHex
      );
      this.fullscreenToggleBg.setStrokeStyle(2, THEME.colors.border.normal);
      this.fullscreenToggleBg.setAlpha(0.7);

      this.fullscreenToggleText = this.add.text(
        centerX,
        y + 10,
        'ON',
        {
          fontSize: '18px',
          color: THEME.colors.text.primary,
          fontStyle: 'bold',
        }
      );
      this.fullscreenToggleText.setOrigin(0.5);

      return [label, this.fullscreenToggleBg, this.fullscreenToggleText];
    }

    if (oniPhone) {
      // iPhone Safari - show "Add to Home" button
      this.fullscreenToggleBg = this.add.rectangle(
        centerX,
        y + 10,
        140,
        toggleHeight,
        0x333333
      );
      this.fullscreenToggleBg.setStrokeStyle(2, THEME.colors.border.normal);
      this.fullscreenToggleBg.setInteractive({ useHandCursor: true });

      this.fullscreenToggleText = this.add.text(
        centerX,
        y + 10,
        'Add to Home',
        {
          fontSize: '16px',
          color: THEME.colors.text.primary,
          fontStyle: 'bold',
        }
      );
      this.fullscreenToggleText.setOrigin(0.5);

      // Click handler - show instructions popup
      this.fullscreenToggleBg.on('pointerdown', () => {
        this.showAddToHomeScreenPopup();
      });

      // Hover effects
      this.fullscreenToggleBg.on('pointerover', () => {
        this.fullscreenToggleBg?.setStrokeStyle(2, THEME.colors.accent.goldHex);
      });
      this.fullscreenToggleBg.on('pointerout', () => {
        this.fullscreenToggleBg?.setStrokeStyle(2, THEME.colors.border.normal);
      });

      return [label, this.fullscreenToggleBg, this.fullscreenToggleText];
    }

    // iPad / Desktop - standard fullscreen toggle
    const isFullscreen = this.scale.isFullscreen;

    this.fullscreenToggleBg = this.add.rectangle(
      centerX,
      y + 10,
      toggleWidth,
      toggleHeight,
      isFullscreen ? THEME.colors.accent.blueHex : 0x333333
    );
    this.fullscreenToggleBg.setStrokeStyle(2, THEME.colors.border.normal);
    this.fullscreenToggleBg.setInteractive({ useHandCursor: true });

    this.fullscreenToggleText = this.add.text(
      centerX,
      y + 10,
      isFullscreen ? 'ON' : 'OFF',
      {
        fontSize: '18px',
        color: THEME.colors.text.primary,
        fontStyle: 'bold',
      }
    );
    this.fullscreenToggleText.setOrigin(0.5);

    // Click handler
    this.fullscreenToggleBg.on('pointerdown', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });

    // Hover effects
    this.fullscreenToggleBg.on('pointerover', () => {
      this.fullscreenToggleBg?.setStrokeStyle(2, THEME.colors.accent.goldHex);
    });
    this.fullscreenToggleBg.on('pointerout', () => {
      this.fullscreenToggleBg?.setStrokeStyle(2, THEME.colors.border.normal);
    });

    return [label, this.fullscreenToggleBg, this.fullscreenToggleText];
  }

  private showAddToHomeScreenPopup(): void {
    // Close existing popup if open
    if (this.addToHomeScreenPopup) {
      this.addToHomeScreenPopup.destroy();
    }

    const popupWidth = 320;
    const popupHeight = 200;
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    this.addToHomeScreenPopup = this.add.container(centerX, centerY);

    // Dimmed background
    const dimBg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);
    dimBg.setInteractive();
    dimBg.on('pointerdown', () => this.hideAddToHomeScreenPopup());

    // Popup background
    const popupBg = this.add.rectangle(0, 0, popupWidth, popupHeight, THEME.colors.background.panel, 0.98);
    popupBg.setStrokeStyle(2, THEME.colors.border.normal);

    // Title
    const title = this.add.text(0, -70, 'Add to Home Screen', {
      fontSize: '22px',
      color: THEME.colors.accent.gold,
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Instructions
    const instructions = this.add.text(0, -10,
      '1. Tap the Share button\n' +
      '2. Scroll down and tap\n' +
      '   "Add to Home Screen"\n' +
      '3. Open from your home screen',
      {
        fontSize: '16px',
        color: THEME.colors.text.primary,
        align: 'center',
        lineSpacing: 6,
      }
    );
    instructions.setOrigin(0.5);

    // OK button
    const okBtn = new Button({
      scene: this,
      x: 0,
      y: 70,
      label: 'Got it',
      tier: 'primary',
      width: 100,
      height: 36,
      fontSize: '18px',
      onClick: () => this.hideAddToHomeScreenPopup(),
    });

    this.addToHomeScreenPopup.add([dimBg, popupBg, title, instructions, okBtn]);
    this.addToHomeScreenPopup.setDepth(100);
  }

  private hideAddToHomeScreenPopup(): void {
    if (this.addToHomeScreenPopup) {
      this.addToHomeScreenPopup.destroy();
      this.addToHomeScreenPopup = null;
    }
  }

  private onFullscreenChange(): void {
    const isFullscreen = this.scale.isFullscreen;

    if (this.fullscreenToggleText) {
      this.fullscreenToggleText.setText(isFullscreen ? 'ON' : 'OFF');
    }

    if (this.fullscreenToggleBg) {
      this.fullscreenToggleBg.setFillStyle(isFullscreen ? THEME.colors.accent.blueHex : 0x333333);
    }
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
