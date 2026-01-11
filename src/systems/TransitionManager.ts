import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { THEME } from '../ui/theme';

export type TransitionType = 'fade' | 'slideLeft' | 'slideRight' | 'zoom';

interface TransitionConfig {
  duration?: number;
  color?: number;
}

/**
 * Manages scene transitions with visual effects.
 * Wraps scene.start() calls with fade, slide, or zoom effects.
 */
export class TransitionManager {
  /**
   * Transition to a new scene with a visual effect.
   * @param scene - Current scene initiating the transition
   * @param targetScene - Scene key to transition to
   * @param data - Optional data to pass to the target scene
   * @param type - Type of transition effect
   * @param config - Optional configuration for the transition
   */
  static transition(
    scene: Phaser.Scene,
    targetScene: string,
    data?: object,
    type: TransitionType = 'fade',
    config?: TransitionConfig
  ): void {
    const duration = config?.duration ?? THEME.animation.transition;
    const color = config?.color ?? 0x000000;

    switch (type) {
      case 'fade':
        this.fadeTransition(scene, targetScene, data, duration, color);
        break;
      case 'slideLeft':
        this.slideTransition(scene, targetScene, data, duration, 'left');
        break;
      case 'slideRight':
        this.slideTransition(scene, targetScene, data, duration, 'right');
        break;
      case 'zoom':
        this.zoomTransition(scene, targetScene, data, duration);
        break;
    }
  }

  /**
   * Fade out current scene, switch, fade in new scene.
   */
  private static fadeTransition(
    scene: Phaser.Scene,
    targetScene: string,
    data: object | undefined,
    duration: number,
    color: number
  ): void {
    // Disable input during transition
    scene.input.enabled = false;

    // Fade out
    scene.cameras.main.fadeOut(duration, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff);

    scene.cameras.main.once('camerafadeoutcomplete', () => {
      scene.scene.start(targetScene, data);
    });

    // The new scene will fade in via its create() method or we can set up auto-fade
    // We'll handle this in individual scenes or add a helper
  }

  /**
   * Slide current scene out, slide new scene in.
   */
  private static slideTransition(
    scene: Phaser.Scene,
    targetScene: string,
    data: object | undefined,
    duration: number,
    direction: 'left' | 'right'
  ): void {
    // Disable input during transition
    scene.input.enabled = false;

    const slideDistance = GAME_WIDTH;
    const targetX = direction === 'left' ? -slideDistance : slideDistance;

    // Create a container with all visible elements or use camera scroll
    // Using camera pan for simplicity
    scene.cameras.main.pan(
      GAME_WIDTH / 2 + targetX,
      GAME_HEIGHT / 2,
      duration,
      'Quad.easeInOut',
      true,
      (_camera, progress) => {
        if (progress === 1) {
          scene.scene.start(targetScene, data);
        }
      }
    );
  }

  /**
   * Zoom into center, switch scenes, zoom out.
   */
  private static zoomTransition(
    scene: Phaser.Scene,
    targetScene: string,
    data: object | undefined,
    duration: number
  ): void {
    // Disable input during transition
    scene.input.enabled = false;

    // Flash white briefly for dramatic effect
    scene.cameras.main.flash(duration / 2, 255, 255, 255);

    // Zoom in while fading
    scene.tweens.add({
      targets: scene.cameras.main,
      zoom: 2,
      duration: duration,
      ease: 'Quad.easeIn',
      onComplete: () => {
        scene.scene.start(targetScene, data);
      },
    });
  }

  /**
   * Helper to fade in a scene (call in create() of target scene).
   */
  static fadeIn(scene: Phaser.Scene, duration?: number): void {
    const d = duration ?? THEME.animation.transition;
    scene.cameras.main.fadeIn(d, 0, 0, 0);
  }

  /**
   * Helper to reset camera for scenes that receive slide transitions.
   */
  static resetCamera(scene: Phaser.Scene): void {
    scene.cameras.main.setScroll(0, 0);
    scene.cameras.main.setZoom(1);
  }
}
