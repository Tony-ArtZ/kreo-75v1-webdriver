import { PresetProfile } from '../types/driver';

export const DEFAULT_PRESETS: PresetProfile[] = [
  {
    id: 'cyberpunk-cloud',
    name: 'Cyberpunk Cloud',
    description: 'Electric cyan horizontal wave wash across keycaps',
    badge: 'Popular',
    state: {
      mode: 0x02, // Cloud
      brightness: 0x04, // 100%
      speed: 0x03, // 75%
      direction: 0x00, // Left -> Right
      rgb: [0, 215, 255], // Kreo Cyan
      rainbow: false,
    },
  },
  {
    id: 'matrix-rain',
    name: 'Matrix Rain',
    description: 'Digital cascades dripping along keyboard columns',
    badge: 'Dynamic',
    state: {
      mode: 0x0f, // Rain
      brightness: 0x04, // 100%
      speed: 0x04, // 100%
      direction: 0x00,
      rgb: [16, 217, 120], // Matrix Emerald
      rainbow: false,
    },
  },
  {
    id: 'spectrum-rainbow',
    name: 'Chroma Spectrum',
    description: 'Continuous chromatic rainbow color shift',
    badge: 'Rainbow',
    state: {
      mode: 0x04, // Spectrum
      brightness: 0x04, // 100%
      speed: 0x02, // 50%
      direction: 0x00,
      rgb: [255, 0, 0],
      rainbow: true,
    },
  },
  {
    id: 'deep-focus-stealth',
    name: 'Night Coding Stealth',
    description: 'Subtle 25% arctic white glow for zero distraction',
    badge: 'Work',
    state: {
      mode: 0x06, // Normal
      brightness: 0x01, // 25%
      speed: 0x00,
      direction: 0x00,
      rgb: [224, 242, 254], // Arctic Ice
      rainbow: false,
    },
  },
  {
    id: 'tactile-reaction',
    name: 'Kinetic Reaction',
    description: 'Keys ignite in neon coral on actuation and fade',
    badge: 'Tactile',
    state: {
      mode: 0x07, // Reaction
      brightness: 0x04, // 100%
      speed: 0x03, // 75%
      direction: 0x00,
      rgb: [255, 64, 96], // Neon Coral
      rainbow: false,
    },
  },
  {
    id: 'solar-breath',
    name: 'Solar Breath',
    description: 'Warm pulsing rhythmic glow like ambient sunlight',
    badge: 'Ambient',
    state: {
      mode: 0x05, // Breath
      brightness: 0x03, // 75%
      speed: 0x01, // 25%
      direction: 0x00,
      rgb: [249, 115, 22], // Solar Flare
      rainbow: false,
    },
  },
  {
    id: 'orbital-serpentine',
    name: 'Orbital Serpentine',
    description: 'Clockwise rotating beam circling the 75% perimeter',
    badge: 'Motion',
    state: {
      mode: 0x03, // Serpentine
      brightness: 0x04, // 100%
      speed: 0x03, // 75%
      direction: 0x01, // Clockwise
      rgb: [168, 85, 247], // Cyber Violet
      rainbow: false,
    },
  },
  {
    id: 'waterfall-roll',
    name: 'Cascading Roll',
    description: 'Fluid vertical downward waterfall light roll',
    badge: 'Flow',
    state: {
      mode: 0x0c, // Roll
      brightness: 0x04, // 100%
      speed: 0x02, // 50%
      direction: 0x00, // Downward
      rgb: [0, 215, 255],
      rainbow: false,
    },
  },
];
