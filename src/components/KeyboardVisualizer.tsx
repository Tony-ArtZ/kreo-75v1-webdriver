import React, { useEffect, useRef, useState, memo } from 'react';
import { KreoState } from '../types/driver';
import { Volume2, VolumeX } from 'lucide-react';

interface KeyDef {
  id: string;
  label: string;
  subLabel?: string;
  width?: number;
  row: number;
  col: number;
  isKnob?: boolean;
}

const KEYBOARD_ROWS: KeyDef[][] = [
  [
    { id: 'Escape', label: 'ESC', row: 0, col: 0 },
    { id: 'F1', label: 'F1', row: 0, col: 1.5 },
    { id: 'F2', label: 'F2', row: 0, col: 2.5 },
    { id: 'F3', label: 'F3', row: 0, col: 3.5 },
    { id: 'F4', label: 'F4', row: 0, col: 4.5 },
    { id: 'F5', label: 'F5', row: 0, col: 6 },
    { id: 'F6', label: 'F6', row: 0, col: 7 },
    { id: 'F7', label: 'F7', row: 0, col: 8 },
    { id: 'F8', label: 'F8', row: 0, col: 9 },
    { id: 'F9', label: 'F9', row: 0, col: 10.5 },
    { id: 'F10', label: 'F10', row: 0, col: 11.5 },
    { id: 'F11', label: 'F11', row: 0, col: 12.5 },
    { id: 'F12', label: 'F12', row: 0, col: 13.5 },
    { id: 'Delete', label: 'DEL', row: 0, col: 14.75 },
    { id: 'Knob', label: '', isKnob: true, row: 0, col: 16 },
  ],
  [
    { id: 'Backquote', label: '~', subLabel: '`', row: 1, col: 0 },
    { id: 'Digit1', label: '!', subLabel: '1', row: 1, col: 1 },
    { id: 'Digit2', label: '@', subLabel: '2', row: 1, col: 2 },
    { id: 'Digit3', label: '#', subLabel: '3', row: 1, col: 3 },
    { id: 'Digit4', label: '$', subLabel: '4', row: 1, col: 4 },
    { id: 'Digit5', label: '%', subLabel: '5', row: 1, col: 5 },
    { id: 'Digit6', label: '^', subLabel: '6', row: 1, col: 6 },
    { id: 'Digit7', label: '&', subLabel: '7', row: 1, col: 7 },
    { id: 'Digit8', label: '*', subLabel: '8', row: 1, col: 8 },
    { id: 'Digit9', label: '(', subLabel: '9', row: 1, col: 9 },
    { id: 'Digit0', label: ')', subLabel: '0', row: 1, col: 10 },
    { id: 'Minus', label: '_', subLabel: '-', row: 1, col: 11 },
    { id: 'Equal', label: '+', subLabel: '=', row: 1, col: 12 },
    { id: 'Backspace', label: 'BKSP', width: 2, row: 1, col: 13 },
    { id: 'Home', label: 'HOME', row: 1, col: 15 },
  ],
  [
    { id: 'Tab', label: 'TAB', width: 1.5, row: 2, col: 0 },
    { id: 'KeyQ', label: 'Q', row: 2, col: 1.5 },
    { id: 'KeyW', label: 'W', row: 2, col: 2.5 },
    { id: 'KeyE', label: 'E', row: 2, col: 3.5 },
    { id: 'KeyR', label: 'R', row: 2, col: 4.5 },
    { id: 'KeyT', label: 'T', row: 2, col: 5.5 },
    { id: 'KeyY', label: 'Y', row: 2, col: 6.5 },
    { id: 'KeyU', label: 'U', row: 2, col: 7.5 },
    { id: 'KeyI', label: 'I', row: 2, col: 8.5 },
    { id: 'KeyO', label: 'O', row: 2, col: 9.5 },
    { id: 'KeyP', label: 'P', row: 2, col: 10.5 },
    { id: 'BracketLeft', label: '{', subLabel: '[', row: 2, col: 11.5 },
    { id: 'BracketRight', label: '}', subLabel: ']', row: 2, col: 12.5 },
    { id: 'Backslash', label: '|', subLabel: '\\', width: 1.5, row: 2, col: 13.5 },
    { id: 'PageUp', label: 'PGUP', row: 2, col: 15 },
  ],
  [
    { id: 'CapsLock', label: 'CAPS', width: 1.75, row: 3, col: 0 },
    { id: 'KeyA', label: 'A', row: 3, col: 1.75 },
    { id: 'KeyS', label: 'S', row: 3, col: 2.75 },
    { id: 'KeyD', label: 'D', row: 3, col: 3.75 },
    { id: 'KeyF', label: 'F', row: 3, col: 4.75 },
    { id: 'KeyG', label: 'G', row: 3, col: 5.75 },
    { id: 'KeyH', label: 'H', row: 3, col: 6.75 },
    { id: 'KeyJ', label: 'J', row: 3, col: 7.75 },
    { id: 'KeyK', label: 'K', row: 3, col: 8.75 },
    { id: 'KeyL', label: 'L', row: 3, col: 9.75 },
    { id: 'Semicolon', label: ':', subLabel: ';', row: 3, col: 10.75 },
    { id: 'Quote', label: '"', subLabel: "'", row: 3, col: 11.75 },
    { id: 'Enter', label: 'ENTER', width: 2.25, row: 3, col: 12.75 },
    { id: 'PageDown', label: 'PGDN', row: 3, col: 15 },
  ],
  [
    { id: 'ShiftLeft', label: 'SHIFT', width: 2.25, row: 4, col: 0 },
    { id: 'KeyZ', label: 'Z', row: 4, col: 2.25 },
    { id: 'KeyX', label: 'X', row: 4, col: 3.25 },
    { id: 'KeyC', label: 'C', row: 4, col: 4.25 },
    { id: 'KeyV', label: 'V', row: 4, col: 5.25 },
    { id: 'KeyB', label: 'B', row: 4, col: 6.25 },
    { id: 'KeyN', label: 'N', row: 4, col: 7.25 },
    { id: 'KeyM', label: 'M', row: 4, col: 8.25 },
    { id: 'Comma', label: '<', subLabel: ',', row: 4, col: 9.25 },
    { id: 'Period', label: '>', subLabel: '.', row: 4, col: 10.25 },
    { id: 'Slash', label: '?', subLabel: '/', row: 4, col: 11.25 },
    { id: 'ShiftRight', label: 'SHIFT', width: 1.75, row: 4, col: 12.25 },
    { id: 'ArrowUp', label: '▲', row: 4, col: 14 },
    { id: 'End', label: 'END', row: 4, col: 15 },
  ],
  [
    { id: 'ControlLeft', label: 'CTRL', width: 1.25, row: 5, col: 0 },
    { id: 'MetaLeft', label: 'WIN', width: 1.25, row: 5, col: 1.25 },
    { id: 'AltLeft', label: 'ALT', width: 1.25, row: 5, col: 2.5 },
    { id: 'Space', label: 'KREO HIVE 75', width: 6.25, row: 5, col: 3.75 },
    { id: 'AltRight', label: 'ALT', row: 5, col: 10 },
    { id: 'Fn', label: 'FN', row: 5, col: 11 },
    { id: 'ControlRight', label: 'CTRL', row: 5, col: 12 },
    { id: 'ArrowLeft', label: '◀', row: 5, col: 13 },
    { id: 'ArrowDown', label: '▼', row: 5, col: 14 },
    { id: 'ArrowRight', label: '▶', row: 5, col: 15 },
  ],
];

// Flat key list for fast iteration in RAF loop
const ALL_KEYS: KeyDef[] = KEYBOARD_ROWS.flat().filter((k) => !k.isKnob);

const SPEED_FACTORS = [0.2, 0.5, 1.0, 1.8, 2.8];

interface KeyboardVisualizerProps {
  state: KreoState;
  onKnobRotate?: (delta: number) => void;
  onKnobClick?: () => void;
}

export const KeyboardVisualizer: React.FC<KeyboardVisualizerProps> = memo(({
  state,
  onKnobRotate,
  onKnobClick,
}) => {
  const [knobRotation, setKnobRotation] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // References to key glow elements and containers for direct DOM updates (0 React re-renders)
  const glowRefs = useRef<{ [keyId: string]: HTMLDivElement | null }>({});
  const containerRefs = useRef<{ [keyId: string]: HTMLDivElement | null }>({});

  // Keep state in a ref so the animation loop always sees the freshest state without re-attaching
  const stateRef = useRef<KreoState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // High-performance animation loop: Mutates DOM styles directly, React re-renders 0 times
  useEffect(() => {
    let animId: number;

    const renderFrame = (now: number) => {
      const curState = stateRef.current;
      const { mode, brightness, speed, direction, rgb, rainbow } = curState;
      const bm = brightness / 4;

      if (bm === 0) {
        // Lights off
        for (let i = 0; i < ALL_KEYS.length; i++) {
          const k = ALL_KEYS[i];
          const glow = glowRefs.current[k.id];
          const cont = containerRefs.current[k.id];
          if (glow) glow.style.backgroundColor = 'transparent';
          if (cont) cont.style.boxShadow = 'none';
        }
        animId = requestAnimationFrame(renderFrame);
        return;
      }

      const speedFactor = SPEED_FACTORS[speed] || 1.0;
      const t = (now / 1000) * speedFactor;
      const isRainbowMode = rainbow || mode === 0x04;

      for (let i = 0; i < ALL_KEYS.length; i++) {
        const key = ALL_KEYS[i];
        let baseR = rgb[0];
        let baseG = rgb[1];
        let baseB = rgb[2];

        if (isRainbowMode) {
          let hueOffset = 0;
          if (mode === 0x02) {
            // Cloud
            hueOffset = (direction === 0 ? key.col : 16 - key.col) * 15;
          } else if (mode === 0x0c) {
            // Roll
            hueOffset = (direction === 0 ? key.row : 5 - key.row) * 45;
          } else if (mode === 0x03) {
            // Serpentine
            const dx = key.col - 8;
            const dy = key.row - 2.5;
            const angle = Math.atan2(dy, dx);
            hueOffset = ((angle * 180) / Math.PI + (direction === 1 ? 0 : 180)) % 360;
          } else {
            hueOffset = (key.col * 14 + key.row * 20) % 360;
          }

          const hue = ((t * 120 + hueOffset) % 360 + 360) % 360;
          const c = 1;
          const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
          let r1 = 0, g1 = 0, b1 = 0;
          if (hue < 60) [r1, g1, b1] = [c, x, 0];
          else if (hue < 120) [r1, g1, b1] = [x, c, 0];
          else if (hue < 180) [r1, g1, b1] = [0, c, x];
          else if (hue < 240) [r1, g1, b1] = [0, x, c];
          else if (hue < 300) [r1, g1, b1] = [x, 0, c];
          else [r1, g1, b1] = [c, 0, x];

          baseR = Math.round(r1 * 255);
          baseG = Math.round(g1 * 255);
          baseB = Math.round(b1 * 255);
        }

        let intensity = 1.0;
        switch (mode) {
          case 0x01: {
            // Corrugated
            const wavePhase = (direction === 0 ? key.col + key.row : key.col - key.row) * 0.8;
            intensity = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 3 + wavePhase));
            break;
          }
          case 0x02: {
            // Cloud
            const phase = (direction === 0 ? key.col : 16 - key.col) * 0.45;
            intensity = 0.3 + 0.7 * Math.max(0, Math.sin(t * 2.8 - phase));
            break;
          }
          case 0x03: {
            // Serpentine
            const centerCol = 8;
            const centerRow = 2.5;
            const angle = Math.atan2(key.row - centerRow, key.col - centerCol);
            const sweep = (t * 3.5 * (direction === 1 ? 1 : -1)) % (Math.PI * 2);
            const diff = Math.abs(Math.sin((angle - sweep) / 2));
            intensity = Math.pow(diff, 4) * 0.9 + 0.1;
            break;
          }
          case 0x04: {
            // Spectrum
            intensity = 1.0;
            break;
          }
          case 0x05: {
            // Breath
            intensity = 0.15 + 0.85 * (0.5 + 0.5 * Math.sin(t * 2.2));
            break;
          }
          case 0x06: {
            // Normal
            intensity = 1.0;
            break;
          }
          case 0x07: {
            // Reaction preview
            intensity = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * 3.5 + key.col * 0.7));
            break;
          }
          case 0x08: {
            // Ripples
            const dist = Math.hypot(key.col - 8, (key.row - 2.5) * 1.5);
            intensity = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * 4 - dist * 0.9));
            break;
          }
          case 0x09: {
            // Traverse
            const diagPos = key.col * 0.7 + key.row * 1.5;
            const sweep = (t * 5) % 20;
            const dist = Math.abs(diagPos - sweep);
            intensity = dist < 2.5 ? 1 - dist / 2.5 : 0.15;
            break;
          }
          case 0x0a: {
            // Stars
            const seed = key.row * 17 + key.col * 31;
            const twinkle = Math.sin(t * 3.5 + seed);
            intensity = twinkle > 0.4 ? (twinkle - 0.4) / 0.6 : 0.15;
            break;
          }
          case 0x0b: {
            // Flowers
            const distFromCenter = Math.hypot(key.col - 8, (key.row - 2.5) * 1.8);
            const bloom = Math.sin(t * 3 - distFromCenter * 0.6);
            intensity = 0.2 + 0.8 * Math.max(0, bloom);
            break;
          }
          case 0x0c: {
            // Roll
            const yPos = direction === 0 ? key.row : 5 - key.row;
            const phase = (t * 4 - yPos * 0.8) % (Math.PI * 2);
            intensity = 0.25 + 0.75 * Math.max(0, Math.sin(phase));
            break;
          }
          case 0x0d: {
            // Wave
            intensity = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 3.5 + key.col * 0.5 + key.row * 0.3));
            break;
          }
          case 0x0e: {
            // Cartoon
            const stepVal = Math.floor((t * 6 + key.col) % 6);
            intensity = stepVal === 0 ? 1.0 : stepVal === 1 ? 0.6 : 0.2;
            break;
          }
          case 0x0f: {
            // Rain
            const colSeed = Math.sin(key.col * 77 + Math.floor(t * 2)) * 10;
            const rainY = (t * 6 + colSeed) % 8;
            const dist = Math.abs(key.row - rainY);
            intensity = dist < 1.2 ? 1 - dist / 1.2 : 0.12;
            break;
          }
          case 0x10: {
            // Scan
            const scanX = (t * 7) % 17;
            const diff = Math.abs(key.col - scanX);
            intensity = diff < 1.8 ? 1 - diff / 1.8 : 0.15;
            break;
          }
          case 0x12: {
            // Speed
            const dist = Math.hypot(key.col - 8, (key.row - 2.5) * 1.5);
            const r = direction === 0 ? (t * 8) % 12 : 12 - ((t * 8) % 12);
            const delta = Math.abs(dist - r);
            intensity = delta < 2.0 ? 1 - delta / 2.0 : 0.2;
            break;
          }
          default:
            intensity = 0.9;
        }

        const alpha = Math.min(1.0, intensity * bm);
        const glowAlpha = alpha * 0.8;

        const glowEl = glowRefs.current[key.id];
        const contEl = containerRefs.current[key.id];

        if (glowEl) {
          glowEl.style.backgroundColor = `rgba(${baseR}, ${baseG}, ${baseB}, ${alpha})`;
        }
        if (contEl) {
          contEl.style.boxShadow = `0 0 12px rgba(${baseR}, ${baseG}, ${baseB}, ${glowAlpha})`;
        }
      }

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleKnobWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 15 : -15;
    setKnobRotation((p) => p + delta);
    onKnobRotate?.(delta > 0 ? 1 : -1);
  };

  const handleKnobPress = () => {
    setIsMuted((p) => !p);
    onKnobClick?.();
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Keyboard Case & Plate */}
      <div className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#151a24] to-[#0c1017] border border-slate-800/80 shadow-2xl shadow-black/80 max-w-full overflow-x-auto select-none">
        <div className="absolute top-2 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#090d14] border border-slate-900 shadow-inner">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex gap-1.5 items-center">
              {row.map((k) => {
                if (k.isKnob) {
                  return (
                    <div
                      key={k.id}
                      onWheel={handleKnobWheel}
                      onClick={handleKnobPress}
                      title="Rotary Encoder — scroll to adjust brightness"
                      className="ml-auto relative w-10 h-10 rounded-full cursor-pointer flex items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 border border-slate-600/60 shadow-lg hover:border-cyan-400/60 active:scale-95 transition-transform"
                      style={{ transform: `rotate(${knobRotation}deg)` }}
                    >
                      <div className="absolute top-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00d7ff]" />
                      <div className="text-[9px] text-slate-400">
                        {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                }

                const styleWidth = k.width ? `${k.width * 2.8}rem` : '2.8rem';

                return (
                  <div
                    key={k.id}
                    ref={(el) => { containerRefs.current[k.id] = el; }}
                    style={{
                      width: styleWidth,
                      minWidth: styleWidth,
                      height: '2.8rem',
                    }}
                    className="relative rounded-md flex flex-col items-center justify-center p-1 text-[11px] font-medium bg-[#121721] border border-slate-800/80 text-slate-300"
                  >
                    {/* RGB under-glow layer updated directly via direct DOM ref in RAF */}
                    <div
                      ref={(el) => { glowRefs.current[k.id] = el; }}
                      className="absolute inset-0 rounded-md pointer-events-none"
                    />

                    {/* Keycap label */}
                    <div className="relative z-10 flex flex-col items-center justify-center leading-none">
                      {k.label && <span className="font-mono tracking-tighter">{k.label}</span>}
                      {k.subLabel && <span className="text-[8px] text-slate-500 font-mono mt-0.5">{k.subLabel}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
