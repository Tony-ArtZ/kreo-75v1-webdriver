import React from 'react';
import { KreoState } from '../types/driver';
import {
  EFFECT_MODES,
  BRIGHTNESS_LEVELS,
  SPEED_LEVELS,
  COLOR_SWATCHES,
  CUSTOM_MODE_ID,
  rgbToHex,
  hexToRgb,
} from '../driver/protocol';
import { Sun, Gauge, Compass, Palette, AlertTriangle, Check } from 'lucide-react';

interface LightingStudioProps {
  state: KreoState;
  onChange: (newState: KreoState) => void;
  disabled?: boolean;
}

export const LightingStudio: React.FC<LightingStudioProps> = ({ state, onChange, disabled }) => {
  const currentMode = EFFECT_MODES.find((m) => m.id === state.mode) || EFFECT_MODES[1];
  const isCustomMode = state.mode === CUSTOM_MODE_ID;
  const currentHex = rgbToHex(state.rgb);

  const handleModeChange = (modeId: number) => {
    const targetMode = EFFECT_MODES.find((m) => m.id === modeId);
    if (!targetMode) return;

    onChange({
      ...state,
      mode: modeId,
      // Reset rainbow and direction on mode change to avoid corrupting mode parameters
      rainbow: false,
      direction: targetMode.supportsDirection ? state.direction : 0x00,
    });
  };

  const handleBrightnessChange = (val: number) => {
    onChange({ ...state, brightness: val });
  };

  const handleSpeedChange = (val: number) => {
    onChange({ ...state, speed: val });
  };

  const handleDirectionChange = (dir: number) => {
    onChange({ ...state, direction: dir });
  };

  const handleRainbowToggle = () => {
    onChange({ ...state, rainbow: !state.rainbow });
  };

  const handleColorChange = (newRgb: [number, number, number]) => {
    onChange({
      ...state,
      rgb: newRgb,
      rainbow: false, // selecting a color switches to explicit RGB mode
    });
  };

  const handleHexInput = (hex: string) => {
    const parsed = hexToRgb(hex);
    if (parsed) {
      handleColorChange(parsed);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Custom Mode Guard Banner */}
      {isCustomMode && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200 leading-relaxed">
            <strong className="font-semibold block text-amber-300">Custom Mode Active (Safety Guard Engaged)</strong>
            Custom per-key lighting uses a completely separate vendor packet family (see handoff documentation Section 13).
            Transmission is locked in custom mode to protect your onboard per-key EEPROM configuration. Select another effect mode to transmit updates.
          </div>
        </div>
      )}

      {/* Grid: Modes & Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Lighting Modes Selector (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4 p-5 rounded-2xl bg-[#0f141f] border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Lighting Effects</h2>
              <p className="text-xs text-slate-400">18 hardware-decoded lighting profiles</p>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
              0x{state.mode.toString(16).padStart(2, '0').toUpperCase()}
            </span>
          </div>

          {/* Mode Category Sections */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EFFECT_MODES.map((mode) => {
              const isSelected = mode.id === state.mode;
              return (
                <button
                  key={mode.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleModeChange(mode.id)}
                  className={`p-3 rounded-xl text-left transition-all relative flex flex-col justify-between h-20 ${
                    isSelected
                      ? 'bg-cyan-950/40 border border-cyan-500/60 shadow-md shadow-cyan-950/50'
                      : 'bg-[#141b29] border border-slate-800/80 hover:border-slate-700 hover:bg-[#182030]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono text-slate-500">
                      0x{mode.id.toString(16).padStart(2, '0').toUpperCase()}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>

                  <div>
                    <span className={`text-xs font-semibold block truncate ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {mode.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">{mode.category}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-1 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Current effect:</span>
            <span className="text-slate-200 font-medium">{currentMode.description}</span>
          </div>
        </div>

        {/* Right Column: Parameters & Color Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Hardware Parameters: Brightness, Speed, Direction */}
          <div className="p-5 rounded-2xl bg-[#0f141f] border border-slate-800 flex flex-col gap-5">
            <h2 className="text-sm font-semibold text-slate-100 pb-3 border-b border-slate-800">
              Hardware Parameters
            </h2>

            {/* Brightness Control */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Brightness</span>
                </div>
                <span className="font-mono text-cyan-400 tabular-nums">
                  {state.brightness * 25}% (0x0{state.brightness})
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#141b29] rounded-xl border border-slate-800">
                {BRIGHTNESS_LEVELS.map((lvl) => {
                  const active = state.brightness === lvl.value;
                  return (
                    <button
                      key={lvl.value}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleBrightnessChange(lvl.value)}
                      className={`py-1.5 text-xs font-mono font-medium rounded-lg transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      {lvl.percentage}%
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Speed Control */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  <span>Speed</span>
                  {!currentMode.supportsSpeed && (
                    <span className="text-[10px] text-slate-500 italic">(Locked in this effect)</span>
                  )}
                </div>
                <span className="font-mono text-cyan-400 tabular-nums">
                  {state.speed * 25}% (0x0{state.speed})
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#141b29] rounded-xl border border-slate-800">
                {SPEED_LEVELS.map((lvl) => {
                  const active = state.speed === lvl.value;
                  return (
                    <button
                      key={lvl.value}
                      type="button"
                      disabled={disabled || !currentMode.supportsSpeed}
                      onClick={() => handleSpeedChange(lvl.value)}
                      className={`py-1.5 text-xs font-mono font-medium rounded-lg transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 disabled:opacity-40 disabled:hover:bg-transparent'
                      }`}
                    >
                      {lvl.percentage}%
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direction / Submode Control */}
            {currentMode.supportsDirection && currentMode.directionLabels && (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <Compass className="w-4 h-4 text-purple-400" />
                    <span>Direction / Submode</span>
                  </div>
                  <span className="font-mono text-cyan-400">Byte 12 = 0x0{state.direction}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-1 bg-[#141b29] rounded-xl border border-slate-800">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleDirectionChange(0)}
                    className={`py-2 px-3 text-xs font-medium rounded-lg transition-colors text-center ${
                      state.direction === 0
                        ? 'bg-purple-600 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {currentMode.directionLabels[0]}
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleDirectionChange(1)}
                    className={`py-2 px-3 text-xs font-medium rounded-lg transition-colors text-center ${
                      state.direction === 1
                        ? 'bg-purple-600 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {currentMode.directionLabels[1]}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Color & Spectrum Selector */}
          <div className="p-5 rounded-2xl bg-[#0f141f] border border-slate-800 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-slate-100">Color System</h2>
              </div>

              {/* Rainbow Toggle (Byte 13) */}
              <button
                type="button"
                disabled={disabled || !currentMode.supportsRainbow}
                onClick={handleRainbowToggle}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  state.rainbow
                    ? 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white shadow-md'
                    : 'bg-[#182030] text-slate-300 border border-slate-700 hover:border-slate-600'
                }`}
              >
                <span>{state.rainbow ? 'Rainbow Active (0x01)' : 'Explicit RGB (0x00)'}</span>
              </button>
            </div>

            {/* Presets & Swatches */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-slate-400">Curated Color Palettes</span>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_SWATCHES.map((swatch) => {
                  const isActive = !state.rainbow && currentHex.toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.name}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleColorChange(swatch.rgb)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                        isActive
                          ? 'border-cyan-400 bg-cyan-950/30'
                          : 'border-slate-800/80 bg-[#141b29] hover:border-slate-700'
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full shadow-inner border border-white/20"
                        style={{ backgroundColor: swatch.hex }}
                      />
                      <span className="text-[10px] text-slate-300 truncate w-full text-center">{swatch.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Color Picker & RGB Slider Inputs */}
            <div className="flex flex-col gap-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={currentHex}
                  disabled={disabled}
                  onChange={(e) => handleHexInput(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                />
                <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-lg bg-[#141b29] border border-slate-800">
                  <span className="text-xs text-slate-400">Hex Code:</span>
                  <input
                    type="text"
                    value={currentHex.toUpperCase()}
                    disabled={disabled}
                    onChange={(e) => handleHexInput(e.target.value)}
                    className="w-24 text-right font-mono text-xs text-cyan-400 bg-transparent focus:outline-none uppercase"
                  />
                </div>
              </div>

              {/* RGB Channel Breakdown */}
              <div className="grid grid-cols-3 gap-2">
                {(['R', 'G', 'B'] as const).map((channel, idx) => {
                  const val = state.rgb[idx];
                  return (
                    <div key={channel} className="p-2 rounded-lg bg-[#141b29] border border-slate-800/80 flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                        <span className={idx === 0 ? 'text-rose-400' : idx === 1 ? 'text-emerald-400' : 'text-blue-400'}>
                          {channel}
                        </span>
                        <span className="text-slate-200">{val}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={val}
                        disabled={disabled}
                        onChange={(e) => {
                          const next = [...state.rgb] as [number, number, number];
                          next[idx] = parseInt(e.target.value, 10);
                          handleColorChange(next);
                        }}
                        className="w-full accent-cyan-400 h-1 cursor-pointer bg-slate-700 rounded-lg"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
