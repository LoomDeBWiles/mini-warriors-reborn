/**
 * Centralized theme configuration for all UI components.
 * All colors, typography, spacing, and animation timings should reference this file.
 */

export const THEME = {
  colors: {
    // Primary action buttons (green for positive actions)
    primary: {
      base: 0x4a7a4a,
      hover: 0x5a9a5a,
      active: 0x3a5a3a,
      text: '#ffffff',
    },
    // Secondary buttons (neutral gray)
    secondary: {
      base: 0x4a4a4a,
      hover: 0x6a6a6a,
      active: 0x3a3a3a,
      text: '#ffffff',
    },
    // Tertiary/text-only buttons
    tertiary: {
      base: 0x000000, // transparent
      hover: 0x333333,
      active: 0x222222,
      text: '#4a90d9',
      textHover: '#6ab0f9',
    },
    // Accent colors
    accent: {
      gold: '#ffd700',
      goldHex: 0xffd700,
      blue: '#4a90d9',
      blueHex: 0x4a90d9,
      blueLight: '#6ab0f9',
      danger: '#ef4444',
      dangerHex: 0xef4444,
      success: '#4ade80',
      successHex: 0x4ade80,
    },
    // Text colors
    text: {
      primary: '#ffffff',
      secondary: '#aaaaaa',
      disabled: '#666666',
      dark: '#222222',
    },
    // Background colors
    background: {
      dark: 0x1a1a2e,
      panel: 0x222222,
      panelLight: 0x333333,
      card: 0x3a3a4a,
      cardHover: 0x4a4a5a,
      cardSelected: 0x4a6a4a,
      overlay: 0x000000,
      overlayAlpha: 0.7,
    },
    // Border/stroke colors
    border: {
      normal: 0x6a6a7a,
      dim: 0x5a5a5a,
      disabled: 0x555555,
      highlight: 0x8a8a9a,
    },
    // Game-specific colors
    game: {
      playerHp: 0x4ade80,
      enemyHp: 0xef4444,
      hpBarBg: 0x333333,
      offense: 0xd94a4a,
      defense: 0x4a90d9,
      utility: 0x4ad99a,
    },
    // Role colors for unit cards
    role: {
      melee: 0xd94a4a,
      ranged: 0x4ad99a,
      tank: 0x4a90d9,
      support: 0xd9d94a,
    },
  },

  typography: {
    title: {
      size: '52px',
      weight: 'bold',
      stroke: '#8b4513',
      strokeThickness: 4,
    },
    heading: {
      size: '36px',
      weight: 'bold',
    },
    subheading: {
      size: '28px',
      weight: 'bold',
    },
    button: {
      size: '24px',
      weight: 'normal',
    },
    body: {
      size: '18px',
      weight: 'normal',
    },
    small: {
      size: '14px',
      weight: 'normal',
    },
    tiny: {
      size: '12px',
      weight: 'normal',
    },
  },

  animation: {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
    transition: 400,
    // Easing functions
    ease: {
      bounce: 'Back.easeOut',
      smooth: 'Quad.easeOut',
      elastic: 'Elastic.easeOut',
      sine: 'Sine.easeInOut',
    },
  },

  spacing: {
    xs: 5,
    sm: 10,
    md: 20,
    lg: 40,
    xl: 60,
  },

  // Button sizing
  button: {
    padding: { x: 24, y: 12 },
    minWidth: 120,
    borderRadius: 8,
    // Hover/press effects
    hoverScale: 1.03,
    pressScale: 0.95,
  },

  // Card sizing
  card: {
    width: 120,
    height: 140,
    spacing: 15,
    borderWidth: 2,
  },

  // Z-depth layers
  depth: {
    background: 0,
    content: 100,
    hud: 1000,
    overlay: 2000,
    tooltip: 3000,
    modal: 4000,
  },
} as const;

// Type exports for strict typing
export type ThemeColors = typeof THEME.colors;
export type ThemeTypography = typeof THEME.typography;
export type ThemeAnimation = typeof THEME.animation;
