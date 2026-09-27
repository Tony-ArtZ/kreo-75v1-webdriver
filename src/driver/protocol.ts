import { EffectMode, KreoState } from '../types/driver';

export const KREO_VID = 0x320f;
export const KREO_PID = 0x5055;
export const REPORT_ID = 0x04;
export const REPORT_SIZE = 64;

export const CUSTOM_MODE_ID = 0x14;

export const EFFECT_MODES: EffectMode[] = [
  {
    id: 0x01,
    name: 'Corrugated',
    category: 'flow',
    description: 'Alternating ripple channels flowing across keys',
    supportsDirection: true,
    supportsRainbow: true,
    supportsSpeed: true,
    directionLabels: { 0: 'Channel A', 1: 'Channel B' },
  },
  {
    id: 0x02,
    name: 'Cloud',
    category: 'flow',
    description: 'Horizontal light stream washing smoothly across keyboard',
    supportsDirection: true,
    supportsRainbow: true,
    supportsSpeed: true,
    directionLabels: { 0: 'Left → Right', 1: 'Right → Left' },
  },
  {
    id: 0x03,
    name: 'Serpentine',
    category: 'flow',
    description: 'Circular orbital beam tracking around perimeter and cluster',
    supportsDirection: true,
    supportsRainbow: true,
    supportsSpeed: true,
    directionLabels: { 0: 'Counter-Clockwise', 1: 'Clockwise' },
  },
  {
    id: 0x04,
    name: 'Spectrum',
    category: 'ambient',
    description: 'Continuous chromatic cycle shifting through color space',
    supportsDirection: false,
    supportsRainbow: true,
    supportsSpeed: true,
  },
  {
    id: 0x05,
    name: 'Breath',
    category: 'ambient',
    description: 'Gentle pulsating glow fading in and out dynamically',
    supportsDirection: false,
    supportsRainbow: true,
    supportsSpeed: true,
  },
  {
    id: 0x06,
    name: 'Normal',
    category: 'ambient',
    description: 'Consistent static illumination in chosen color or rainbow',
    supportsDirection: false,
    supportsRainbow: true,
    supportsSpeed: false,
  },
  {
    id: 0x07,
    name: 'Reaction',
    category: 'reactive',
    description: 'Key glows bright on press and smoothly fades to black',
    supportsDirection: false,
    supportsRainbow: true,
    supportsSpeed: true,
  },
  {
    id: 0x08,
    name: 'Ripples',
    category: 'reactive',
    description: 'Pressing a key generates radial light wave rings outwards',
    supportsDirection: false,
    supportsRainbow: true,
    supportsSpeed: true,
  },
  {
    id: 0x09,
    name: 'Traverse',
    category: 'flow',
    description: 'Diagonal light beams traversing across the key matrix',
    supportsDirection: false,
    supportsRainbow: true,
    supportsSpeed: true,
  },
  {
    id: 0x0a,
    name: 'Stars',
    category: 'reactive',
    description: 'Starlight effect with keys twinkling softly at random',
    supportsDirection: false,
    supportsRainbow: true,
    supportsSpeed: true,
  },
  {
    id: 0x0b,
    name: 'Flowers',
    category: 'reactive',
    description: 'Geometric blossoming pattern radiating from key strokes',
    supportsDirection: false,
    supportsRainbow: true,
    supportsSpeed: true,
  },
  {
    id: 0x0c,
    name: 'Roll',
    category: 'flow',
    description: 'Vertical cascading waterfall wave moving down or up',
    supportsDirection: true,
    supportsRainbow: true,
    supportsSpeed: true,
    directionLabels: { 0: 'Downward', 1: 'Upward' },
  },
  {
    id: 0x0d,
    name: 'Wave',
    category: 'flow',
    description: 'Harmonic undulating light wave spanning the entire board',
    supportsDirection: false,
    supportsRainbow: true,
    supportsSpeed: true,
  },
  {
    id: 0x0e,
    name: 'Cartoon',
    category: 'reactive',
    description: 'Playful bouncy multi-color pulses bouncing on actuation',
    supportsDirection: false,
    supportsRainbow: true,
    supportsSpeed: true,
  },
  {
    id: 0x0f,
    name: 'Rain',
    category: 'reactive',
    description: 'Random streaks of light dripping down key columns',
    supportsDirection: false,
    supportsRainbow: true,
    supportsSpeed: true,
  },
  {
    id: 0x10,
    name: 'Scan',
    category: 'reactive',
    description: 'Horizontal radar sweep line tracing across the key rows',
    supportsDirection: false,
    supportsRainbow: true,
    supportsSpeed: true,
  },
  {
    id: 0x12,
    name: 'Speed',
    category: 'flow',
    description: 'Dynamic velocity bursts expanding outward from the center',
    supportsDirection: true,
    supportsRainbow: true,
    supportsSpeed: true,
    directionLabels: { 0: 'Inside → Out', 1: 'Outside → In' },
  },
  {
    id: 0x14,
    name: 'Custom',
    category: 'custom',
    description: 'Per-key custom matrix (Separate vendor packet structure)',
    supportsDirection: false,
    supportsRainbow: false,
    supportsSpeed: false,
  },
];

export const BRIGHTNESS_LEVELS = [
  { value: 0x00, percentage: 0, label: '0% (Off)' },
  { value: 0x01, percentage: 25, label: '25%' },
  { value: 0x02, percentage: 50, label: '50%' },
  { value: 0x03, percentage: 75, label: '75%' },
  { value: 0x04, percentage: 100, label: '100% (Max)' },
];

export const SPEED_LEVELS = [
  { value: 0x00, percentage: 0, label: '0% (Slowest)' },
  { value: 0x01, percentage: 25, label: '25%' },
  { value: 0x02, percentage: 50, label: '50%' },
  { value: 0x03, percentage: 75, label: '75%' },
  { value: 0x04, percentage: 100, label: '100% (Fastest)' },
];

export const DEFAULT_STATE: KreoState = {
  mode: 0x02, // Cloud
  brightness: 0x04, // 100%
  speed: 0x02, // 50%
  direction: 0x00, // Left -> Right
  rgb: [0, 215, 255], // Kreo Electric Cyan
  rainbow: false,
};

export const COLOR_SWATCHES: { name: string; rgb: [number, number, number]; hex: string }[] = [
  { name: 'Kreo Cyan', rgb: [0, 215, 255], hex: '#00d7ff' },
  { name: 'Neon Coral', rgb: [255, 64, 96], hex: '#ff4060' },
  { name: 'Matrix Emerald', rgb: [16, 217, 120], hex: '#10d978' },
  { name: 'Cyber Violet', rgb: [168, 85, 247], hex: '#a855f7' },
  { name: 'Amber Gold', rgb: [255, 170, 0], hex: '#ffaa00' },
  { name: 'Arctic Ice', rgb: [224, 242, 254], hex: '#e0f2fe' },
  { name: 'Crimson Red', rgb: [239, 68, 68], hex: '#ef4444' },
  { name: 'Solar Flare', rgb: [249, 115, 22], hex: '#f97316' },
];

/**
 * Builds the 64-byte HID output report according to confirmed reverse-engineering data:
 * - byte 0:  0x04 (Report ID)
 * - byte 1-2: 16-bit little-endian checksum = sum(report[3..63]) & 0xFFFF
 * - byte 3:  0x06
 * - byte 4:  0x22
 * - byte 5-8: 0x00 (constant)
 * - byte 9:  mode / effect ID
 * - byte 10: brightness (0x00..0x04)
 * - byte 11: speed (0x00..0x04)
 * - byte 12: direction / submode (0x00 or 0x01)
 * - byte 13: color mode selector (0x00 = explicit RGB, 0x01 = rainbow)
 * - byte 14: Red (0..255)
 * - byte 15: Green (0..255)
 * - byte 16: Blue (0..255)
 * - byte 17-63: 0x00 (reserved)
 */
export function buildReport(state: KreoState): Uint8Array {
  const report = new Uint8Array(REPORT_SIZE);

  report[0] = REPORT_ID;
  report[3] = 0x06;
  report[4] = 0x22;

  report[9] = state.mode & 0xff;
  report[10] = Math.min(Math.max(0, state.brightness), 0x04);
  report[11] = Math.min(Math.max(0, state.speed), 0x04);

  const modeDef = EFFECT_MODES.find((m) => m.id === state.mode);
  report[12] = modeDef?.supportsDirection ? (state.direction ? 0x01 : 0x00) : 0x00;

  // Rainbow color-mode selector at byte 13 (verified against pcap captures)
  const isRainbow = state.rainbow && state.mode !== CUSTOM_MODE_ID;
  report[13] = isRainbow ? 0x01 : 0x00;

  // RGB channels at bytes 14, 15, 16
  report[14] = Math.min(Math.max(0, state.rgb[0]), 255);
  report[15] = Math.min(Math.max(0, state.rgb[1]), 255);
  report[16] = Math.min(Math.max(0, state.rgb[2]), 255);

  // Calculate 16-bit little-endian checksum of bytes 3 through 63
  let checksum = 0;
  for (let i = 3; i < REPORT_SIZE; i++) {
    checksum += report[i];
  }
  checksum &= 0xffff;

  report[1] = checksum & 0xff;
  report[2] = (checksum >> 8) & 0xff;

  return report;
}

/**
 * Returns formatted 16-byte chunks in hexadecimal notation for debugging & verification
 */
export function formatHexChunks(report: Uint8Array): { offset: string; hex: string; ascii: string }[] {
  const chunks: { offset: string; hex: string; ascii: string }[] = [];

  for (let start = 0; start < report.length; start += 16) {
    const slice = report.slice(start, start + 16);
    const hex = Array.from(slice)
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');

    const ascii = Array.from(slice)
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '·'))
      .join('');

    chunks.push({
      offset: start.toString(16).padStart(2, '0').toUpperCase(),
      hex,
      ascii,
    });
  }

  return chunks;
}

export function rgbToHex(rgb: [number, number, number]): string {
  return '#' + rgb.map((x) => x.toString(16).padStart(2, '0')).join('');
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r, g, b];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r, g, b];
  }
  return null;
}
