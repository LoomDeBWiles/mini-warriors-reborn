import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { AudioManager } from '../managers/AudioManager';
import { MUSIC_KEYS } from '../data/audio';
import { Button } from '../ui/Button';
import { THEME } from '../ui/theme';
import { TransitionManager } from '../systems/TransitionManager';

export class MenuScene extends Phaser.Scene {
  private titleMain!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'menu' });
  }

  create(): void {
    // Reset camera in case we came from a slide transition
    TransitionManager.resetCamera(this);

    // Fade in on scene enter
    TransitionManager.fadeIn(this);

    // Add background
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_menu');

    // Add subtle parallax effect to background
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const offsetX = (pointer.x - GAME_WIDTH / 2) * 0.01;
      const offsetY = (pointer.y - GAME_HEIGHT / 2) * 0.01;
      bg.setPosition(GAME_WIDTH / 2 + offsetX, GAME_HEIGHT / 2 + offsetY);
    });

    // Start menu music with crossfade
    const audio = AudioManager.getInstance(this);
    audio?.switchMusic(MUSIC_KEYS.menu);

    // Create layered title with visual depth
    this.createTitle();

    // Two warriors fighting under the title
    this.createFightingWarriors();

    // Play button using new Button component
    new Button({
      scene: this,
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2 + 40,
      label: 'Play',
      tier: 'primary',
      width: 160,
      height: 56,
      fontSize: '32px',
      onClick: () => {
        TransitionManager.transition(this, 'levelSelect', undefined, 'slideRight');
      },
    });

    // Version text
    const versionText = this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, 'v0.1.0', {
      fontSize: '14px',
      color: THEME.colors.text.disabled,
    });
    versionText.setOrigin(1, 1);

    // Add ambient dust particles
    this.createAmbientParticles();
  }

  private createTitle(): void {
    const titleY = GAME_HEIGHT / 3;
    const titleText = 'Mini Warriors Reborn';

    // Deep shadow layer (furthest back)
    const deepShadow = this.add.text(GAME_WIDTH / 2 + 4, titleY + 4, titleText, {
      fontSize: THEME.typography.title.size,
      color: '#1a0000',
      fontStyle: 'bold',
    });
    deepShadow.setOrigin(0.5);
    deepShadow.setAlpha(0.6);

    // Mid shadow layer
    const midShadow = this.add.text(GAME_WIDTH / 2 + 2, titleY + 2, titleText, {
      fontSize: THEME.typography.title.size,
      color: '#330000',
      fontStyle: 'bold',
    });
    midShadow.setOrigin(0.5);
    midShadow.setAlpha(0.8);

    // Main title with golden color and stroke
    this.titleMain = this.add.text(GAME_WIDTH / 2, titleY, titleText, {
      fontSize: THEME.typography.title.size,
      color: THEME.colors.accent.gold,
      fontStyle: 'bold',
      stroke: THEME.typography.title.stroke,
      strokeThickness: THEME.typography.title.strokeThickness,
    });
    this.titleMain.setOrigin(0.5);

    // Subtle shimmer/glow effect using a duplicate text
    const glow = this.add.text(GAME_WIDTH / 2, titleY, titleText, {
      fontSize: THEME.typography.title.size,
      color: '#ffffff',
      fontStyle: 'bold',
    });
    glow.setOrigin(0.5);
    glow.setAlpha(0);

    // Gentle floating animation for title group
    const titleGroup = [deepShadow, midShadow, this.titleMain, glow];
    this.tweens.add({
      targets: titleGroup,
      y: titleY - 8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Shimmer effect on glow layer
    this.tweens.add({
      targets: glow,
      alpha: 0.3,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 500,
    });
  }

  private createFightingWarriors(): void {
    const centerX = GAME_WIDTH / 2;
    const y = GAME_HEIGHT / 3 + 80;
    const spacing = 40;

    // Player warrior on the left (knight)
    const playerWarrior = this.add.sprite(centerX - spacing, y, 'unit_knight');
    playerWarrior.setScale(2);
    playerWarrior.play('unit_knight_attack');

    // Enemy wizard on the right (troll uses wizard sprite), flipped to face left
    const enemyWizard = this.add.sprite(centerX + spacing, y, 'enemy_troll');
    enemyWizard.setScale(2);
    enemyWizard.setFlipX(true);
    enemyWizard.play('enemy_troll_attack');
  }

  private createAmbientParticles(): void {
    // Create simple floating dust particles using graphics
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.3);

      const particle = this.add.circle(x, y, size, 0xffffff, alpha);

      // Random floating animation
      this.tweens.add({
        targets: particle,
        y: y - Phaser.Math.Between(50, 150),
        x: x + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: Phaser.Math.Between(4000, 8000),
        ease: 'Sine.easeInOut',
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
        onRepeat: () => {
          particle.setPosition(
            Phaser.Math.Between(0, GAME_WIDTH),
            GAME_HEIGHT + 20
          );
          particle.setAlpha(alpha);
        },
      });
    }
  }
}
