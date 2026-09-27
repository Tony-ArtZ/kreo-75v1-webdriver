import React, { useState, useEffect } from 'react';
import { KreoState, PresetProfile } from '../types/driver';
import { DEFAULT_PRESETS } from '../driver/presets';
import { rgbToHex, EFFECT_MODES } from '../driver/protocol';
import { Bookmark, Plus, Trash2, Download, Upload, Check, Sparkles } from 'lucide-react';

interface ProfilePresetsProps {
  currentState: KreoState;
  onApplyPreset: (state: KreoState) => void;
}

const STORAGE_KEY = 'kreo_hive75_user_presets';

export const ProfilePresets: React.FC<ProfilePresetsProps> = ({ currentState, onApplyPreset }) => {
  const [userPresets, setUserPresets] = useState<PresetProfile[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setUserPresets(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveToStorage = (presets: PresetProfile[]) => {
    setUserPresets(presets);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch {
      // ignore
    }
  };

  const handleCreatePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const newProfile: PresetProfile = {
      id: 'custom-' + Date.now(),
      name: newPresetName.trim(),
      description: newPresetDesc.trim() || 'Custom lighting configuration',
      state: { ...currentState },
      badge: 'Custom',
    };

    saveToStorage([newProfile, ...userPresets]);
    setNewPresetName('');
    setNewPresetDesc('');
    setIsAdding(false);
    showNotice(`Saved profile "${newProfile.name}"`);
  };

  const handleDeletePreset = (id: string, name: string) => {
    saveToStorage(userPresets.filter((p) => p.id !== id));
    showNotice(`Deleted profile "${name}"`);
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExportJson = () => {
    const allPresets = [...userPresets, ...DEFAULT_PRESETS];
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allPresets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'kreo_hive75_presets.json');
    downloadAnchor.click();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            const valid = parsed.filter((p) => p && p.state && typeof p.state.mode === 'number');
            saveToStorage([...valid, ...userPresets]);
            showNotice(`Imported ${valid.length} profiles successfully!`);
          }
        } catch {
          showNotice('Error parsing presets file.');
        }
      };
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0f141f] border border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Lighting Profiles & Presets</h2>
          <p className="text-xs text-slate-400">Apply curated factory configurations or save custom scenes</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Current Profile</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            title="Export JSON"
            className="p-1.5 rounded-lg bg-[#141b29] hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          <label
            title="Import JSON"
            className="p-1.5 rounded-lg bg-[#141b29] hover:bg-slate-800 text-slate-300 border border-slate-700/80 cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>
        </div>
      </div>

      {notification && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Save Profile Form Modal/Drawer */}
      {isAdding && (
        <form
          onSubmit={handleCreatePreset}
          className="p-5 rounded-2xl bg-[#141b29] border border-cyan-500/40 flex flex-col gap-4 shadow-lg shadow-black/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-300">Save Snapshot of Active Lighting</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Preset Name (e.g. Midnight Cyan Wave)"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#0a0d14] border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
            />
            <input
              type="text"
              placeholder="Short Description"
              value={newPresetDesc}
              onChange={(e) => setNewPresetDesc(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#0a0d14] border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
            >
              Confirm & Save
            </button>
          </div>
        </form>
      )}

      {/* User Profiles Section (if any) */}
      {userPresets.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold text-slate-300">Your Saved Profiles</span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {userPresets.map((preset) => {
              const modeName = EFFECT_MODES.find((m) => m.id === preset.state.mode)?.name || 'Custom';
              const hex = rgbToHex(preset.state.rgb);

              return (
                <div
                  key={preset.id}
                  className="p-4 rounded-xl bg-[#0f141f] border border-slate-800 hover:border-slate-700 flex flex-col justify-between gap-3 group transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: preset.state.rainbow ? '#f43f5e' : hex }}
                      />
                      <span className="text-xs font-semibold text-slate-200">{preset.name}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePreset(preset.id, preset.name)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 truncate">{preset.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
                    <span>
                      {modeName} · {preset.state.brightness * 25}%
                    </span>
                    <button
                      type="button"
                      onClick={() => onApplyPreset(preset.state)}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-[#141b29] hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-slate-700/60 transition-colors"
                    >
                      Load
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Built-in Factory Presets */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold text-slate-300">Factory Decoded Presets</span>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {DEFAULT_PRESETS.map((preset) => {
            const modeName = EFFECT_MODES.find((m) => m.id === preset.state.mode)?.name || 'Custom';
            const hex = rgbToHex(preset.state.rgb);

            return (
              <div
                key={preset.id}
                className="p-4 rounded-xl bg-[#0f141f] border border-slate-800/80 hover:border-cyan-500/40 flex flex-col justify-between gap-3 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: preset.state.rainbow ? '#f43f5e' : hex }}
                    />
                    <span className="text-xs font-semibold text-slate-200">{preset.name}</span>
                  </div>
                  {preset.badge && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {preset.badge}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2">{preset.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
                  <span>
                    {modeName} · {preset.state.speed * 25}%
                  </span>
                  <button
                    type="button"
                    onClick={() => onApplyPreset(preset.state)}
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-[#141b29] hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-slate-700/60 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
