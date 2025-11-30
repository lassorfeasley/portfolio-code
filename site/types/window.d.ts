/**
 * Type definitions for global window extensions used by retro window interactions.
 * These are added by legacy JavaScript files in the public/js directory.
 */
interface Window {
  /**
   * Update breathing shadow effect for retro windows.
   * Called after drag operations complete.
   */
  updateBreathingShadow?: () => void;

  /**
   * Float a legacy retro window element.
   * Used to integrate with legacy window positioning system.
   */
  retroFloatWindow?: (element: HTMLElement) => void;

  /**
   * Apply scatter effect to retro windows in cluttered desktop containers.
   * Randomly positions and sizes windows for a cluttered desktop aesthetic.
   */
  retroApplyScatterEffect?: () => void;

  /**
   * Reinitialize the pixel-image loading effect, exported by visual-effects.js.
   * React surfaces call this when new retro windows render.
   */
  __pixelImageEffectReinit?: () => void;

  /**
   * Optional debug flag that enables verbose pixel effect logging.
   */
  __pixelEffectDebug?: boolean;
}
