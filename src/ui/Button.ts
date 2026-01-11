import Phaser from 'phaser';
import { THEME } from './theme';
import { AudioManager } from '../managers/AudioManager';

export type ButtonTier = 'primary' | 'secondary' | 'tertiary';

export interface ButtonConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  label: string;
  tier?: ButtonTier;
  width?: number;
  height?: number;
  fontSize?: string;
  disabled?: boolean;
  onClick: () => void;
}

/**
 * Reusable button component with three visual tiers and built-in animations.
 * - Primary: Green gradient for main actions (Play, Start Battle)
 * - Secondary: Gray for secondary actions (Back, Settings)
 * - Tertiary: Text-only with underline hover
 */
export class Button extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private tier: ButtonTier;
  private isDisabled: boolean;
  private isPressed: boolean = false;
  private onClick: () => void;

  private baseColors: { bg: number; border: number; text: string };

  constructor(config: ButtonConfig) {
    super(config.scene, config.x, config.y);

    this.tier = config.tier ?? 'secondary';
    this.isDisabled = config.disabled ?? false;
    this.onClick = config.onClick;

    // Determine colors based on tier
    this.baseColors = this.getColorsForTier(this.tier);

    const width = config.width ?? THEME.button.minWidth;
    const height = config.height ?? 48;
    const fontSize = config.fontSize ?? THEME.typography.button.size;

    // Create background rectangle
    this.background = this.scene.add.rectangle(
      0,
      0,
      width,
      height,
      this.isDisabled ? THEME.colors.background.panelLight : this.baseColors.bg
    );
    this.background.setOrigin(0.5);

    // Create border
    this.border = this.scene.add.rectangle(0, 0, width, height);
    this.border.setOrigin(0.5);
    this.border.setStrokeStyle(
      2,
      this.isDisabled ? THEME.colors.border.disabled : this.baseColors.border
    );
    this.border.setFillStyle(0x000000, 0); // Transparent fill

    // Create label
    this.label = this.scene.add.text(0, 0, config.label, {
      fontSize,
      color: this.isDisabled ? THEME.colors.text.disabled : this.baseColors.text,
      fontStyle: 'bold',
    });
    this.label.setOrigin(0.5);

    // Add children to container
    this.add([this.background, this.border, this.label]);

    // Add to scene
    this.scene.add.existing(this);

    // Setup interactivity
    if (!this.isDisabled) {
      this.setupInteractivity();
    }
  }

  private getColorsForTier(tier: ButtonTier): { bg: number; border: number; text: string } {
    switch (tier) {
      case 'primary':
        return {
          bg: THEME.colors.primary.base,
          border: THEME.colors.accent.goldHex,
          text: THEME.colors.primary.text,
        };
      case 'secondary':
        return {
          bg: THEME.colors.secondary.base,
          border: THEME.colors.border.normal,
          text: THEME.colors.secondary.text,
        };
      case 'tertiary':
        return {
          bg: THEME.colors.tertiary.base,
          border: 0x000000, // No visible border
          text: THEME.colors.tertiary.text,
        };
    }
  }

  private setupInteractivity(): void {
    // Make the background the hit area
    this.background.setInteractive({ useHandCursor: true });

    // Hover effects
    this.background.on('pointerover', () => this.onHover());
    this.background.on('pointerout', () => this.onHoverEnd());
    this.background.on('pointerdown', () => this.onPress());
    this.background.on('pointerup', () => this.onRelease());
  }

  private onHover(): void {
    if (this.isDisabled) return;

    // Play hover sound
    const audio = AudioManager.getInstance(this.scene);
    audio?.playSfx('sfx_button_hover');

    // Scale up
    this.scene.tweens.add({
      targets: this,
      scaleX: THEME.button.hoverScale,
      scaleY: THEME.button.hoverScale,
      duration: THEME.animation.fast,
      ease: 'Quad.easeOut',
    });

    // Brighten colors
    const hoverColors = this.getHoverColors();
    this.background.setFillStyle(hoverColors.bg);
    this.border.setStrokeStyle(2, hoverColors.border);

    if (this.tier === 'tertiary') {
      this.label.setColor(THEME.colors.tertiary.textHover);
    }
  }

  private onHoverEnd(): void {
    if (this.isDisabled) return;

    // Scale back to normal
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: THEME.animation.fast,
      ease: 'Quad.easeOut',
    });

    // Restore colors
    this.background.setFillStyle(this.baseColors.bg);
    this.border.setStrokeStyle(2, this.baseColors.border);

    if (this.tier === 'tertiary') {
      this.label.setColor(this.baseColors.text);
    }

    this.isPressed = false;
  }

  private onPress(): void {
    if (this.isDisabled) return;

    this.isPressed = true;

    // Scale down for press effect
    this.scene.tweens.add({
      targets: this,
      scaleX: THEME.button.pressScale,
      scaleY: THEME.button.pressScale,
      duration: 50,
      ease: 'Quad.easeOut',
    });

    // Darken slightly
    const activeColors = this.getActiveColors();
    this.background.setFillStyle(activeColors.bg);
  }

  private onRelease(): void {
    if (this.isDisabled || !this.isPressed) return;

    // Play click sound
    const audio = AudioManager.getInstance(this.scene);
    audio?.playSfx('sfx_button_click');

    // Scale back to hover state
    this.scene.tweens.add({
      targets: this,
      scaleX: THEME.button.hoverScale,
      scaleY: THEME.button.hoverScale,
      duration: THEME.animation.fast,
      ease: 'Back.easeOut',
    });

    // Restore hover colors
    const hoverColors = this.getHoverColors();
    this.background.setFillStyle(hoverColors.bg);

    // Execute callback
    this.onClick();

    this.isPressed = false;
  }

  private getHoverColors(): { bg: number; border: number } {
    switch (this.tier) {
      case 'primary':
        return { bg: THEME.colors.primary.hover, border: THEME.colors.accent.goldHex };
      case 'secondary':
        return { bg: THEME.colors.secondary.hover, border: THEME.colors.border.highlight };
      case 'tertiary':
        return { bg: THEME.colors.tertiary.hover, border: 0x000000 };
    }
  }

  private getActiveColors(): { bg: number } {
    switch (this.tier) {
      case 'primary':
        return { bg: THEME.colors.primary.active };
      case 'secondary':
        return { bg: THEME.colors.secondary.active };
      case 'tertiary':
        return { bg: THEME.colors.tertiary.active };
    }
  }

  /** Enable or disable the button */
  setDisabled(disabled: boolean): void {
    this.isDisabled = disabled;

    if (disabled) {
      this.background.setFillStyle(THEME.colors.background.panelLight);
      this.border.setStrokeStyle(2, THEME.colors.border.disabled);
      this.label.setColor(THEME.colors.text.disabled);
      this.background.disableInteractive();
    } else {
      this.background.setFillStyle(this.baseColors.bg);
      this.border.setStrokeStyle(2, this.baseColors.border);
      this.label.setColor(this.baseColors.text);
      this.background.setInteractive({ useHandCursor: true });
    }
  }

  /** Update the button label text */
  setLabel(text: string): void {
    this.label.setText(text);
  }

  /** Get the label text object for custom styling */
  getLabel(): Phaser.GameObjects.Text {
    return this.label;
  }
}
