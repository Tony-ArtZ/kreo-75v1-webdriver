import React, { useState, useEffect, useCallback } from 'react';
import { KreoState, ConnectionStatus, KreoDeviceInfo, DriverLogEntry } from './types/driver';
import { DEFAULT_STATE, EFFECT_MODES, buildReport, rgbToHex } from './driver/protocol';
import { driverSingleton } from './driver/webhid';
import { Header } from './components/Header';
import { KeyboardVisualizer } from './components/KeyboardVisualizer';
import { LightingStudio } from './components/LightingStudio';
import { PlatformBridge } from './components/PlatformBridge';
import { ProfilePresets } from './components/ProfilePresets';
import { Check } from 'lucide-react';

const STATE_CACHE_KEY = 'kreo_hive75_active_state';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'presets' | 'bridge'>('studio');
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [deviceInfo, setDeviceInfo] = useState<KreoDeviceInfo | null>(null);
  const [logs, setLogs] = useState<DriverLogEntry[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [state, setState] = useState<KreoState>(() => {
    try {
      const cached = localStorage.getItem(STATE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (typeof parsed.mode === 'number' && Array.isArray(parsed.rgb)) return parsed;
      }
    } catch { /* ignore */ }
    return DEFAULT_STATE;
  });

  useEffect(() => {
    const unsubscribe = driverSingleton.subscribe({
      onStatusChange: (s) => setStatus(s),
      onDeviceInfoChange: (info) => setDeviceInfo(info),
      onLog: (entry) => setLogs((prev) => [entry, ...prev.slice(0, 99)]),
      onPacketSent: () => {},
    });
    return () => unsubscribe();
  }, []);

  const handleStateChange = useCallback((newState: KreoState) => {
    setState(newState);
    try { localStorage.setItem(STATE_CACHE_KEY, JSON.stringify(newState)); } catch { /* ignore */ }
    driverSingleton.sendState(newState);
  }, []);

  const handleConnect = async () => {
    const success = await driverSingleton.requestAndConnect();
    if (success) {
      showToast('Kreo Hive 75 connected!');
      driverSingleton.sendState(state);
    }
  };

  const handleDisconnect = async () => {
    await driverSingleton.disconnect();
    showToast('Device disconnected.');
  };

  const handleResync = () => {
    driverSingleton.sendState(state);
    showToast('State re-sent to keyboard.');
  };

  const handleKnobRotate = (delta: number) => {
    setState((prev) => {
      const next = { ...prev, brightness: Math.min(4, Math.max(0, prev.brightness + (delta > 0 ? 1 : -1))) };
      driverSingleton.sendState(next);
      return next;
    });
  };

  const handleKnobClick = () => {
    setState((prev) => {
      const next = { ...prev, brightness: prev.brightness > 0 ? 0 : 4 };
      driverSingleton.sendState(next);
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentMode = EFFECT_MODES.find((m) => m.id === state.mode);

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        status={status}
        deviceInfo={deviceInfo}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onResync={handleResync}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {toastMessage && (
          <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs flex items-center justify-between shadow-lg shadow-black/40">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" />
              <span>{toastMessage}</span>
            </div>
            <button type="button" onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>
        )}

        {/* Status strip + keyboard visual */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">Hardware Target:</span>
              <span className="font-mono text-cyan-400">Kreo Hive 75 (VID: 0x320F PID: 0x5055)</span>
              <span className="text-slate-600">·</span>
              <span>Interface 1</span>
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <div><span className="text-slate-500">Mode: </span><span className="text-cyan-300 font-semibold">{currentMode?.name}</span></div>
              <div><span className="text-slate-500">Brightness: </span><span className="text-amber-300">{state.brightness * 25}%</span></div>
              <div><span className="text-slate-500">Speed: </span><span className="text-emerald-300">{state.speed * 25}%</span></div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Color: </span>
                <div className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: state.rainbow ? '#f43f5e' : rgbToHex(state.rgb) }} />
                <span className="text-slate-300">{state.rainbow ? 'Rainbow' : rgbToHex(state.rgb)}</span>
              </div>
            </div>
          </div>

          <div className="w-full flex justify-center py-2">
            <KeyboardVisualizer state={state} onKnobRotate={handleKnobRotate} onKnobClick={handleKnobClick} />
          </div>
        </section>

        {/* Tab content */}
        <section className="mt-2">
          {activeTab === 'studio' && <LightingStudio state={state} onChange={handleStateChange} />}
          {activeTab === 'presets' && <ProfilePresets currentState={state} onApplyPreset={handleStateChange} />}
          {activeTab === 'bridge' && (
            <PlatformBridge
              logs={logs}
              onClearLogs={() => setLogs([])}
              onRetryConnection={handleConnect}
            />
          )}
        </section>
      </main>

      <footer className="border-t border-slate-800/80 bg-[#090d14] py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-slate-400">Kreo Hive 75 Driver</span>
          <span className="font-mono text-cyan-400">Interface 1 (MI_01) · Report ID 0x04</span>
        </div>
      </footer>
    </div>
  );
}
