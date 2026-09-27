import React from 'react';
import { ConnectionStatus, KreoDeviceInfo } from '../types/driver';
import { Usb, RefreshCw, CheckCircle2, AlertCircle, Loader } from 'lucide-react';

interface HeaderProps {
  activeTab: 'studio' | 'presets' | 'bridge';
  onTabChange: (tab: 'studio' | 'presets' | 'bridge') => void;
  status: ConnectionStatus;
  deviceInfo: KreoDeviceInfo | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onResync: () => void;
}

const TABS: { id: 'studio' | 'presets' | 'bridge'; label: string }[] = [
  { id: 'studio', label: 'Lighting Studio' },
  { id: 'presets', label: 'Profiles' },
  { id: 'bridge', label: 'Platform & udev' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  status,
  onConnect,
  onDisconnect,
  onResync,
}) => {
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0b0f17]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d7ff]" />
          <span className="text-base sm:text-lg font-bold tracking-tight text-white">Kreo Hive 75</span>
        </div>

        {/* Tab nav */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-[#121721] rounded-xl border border-slate-800">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#1b2333] text-cyan-300 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isConnected && (
            <button
              type="button"
              onClick={onResync}
              title="Resend full state packet to keyboard"
              className="p-2 text-slate-300 hover:text-white bg-[#141b29] hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {isConnected ? (
            <button
              type="button"
              onClick={onDisconnect}
              className="px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/50 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Connected</span>
            </button>
          ) : isConnecting ? (
            <button
              type="button"
              disabled
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 bg-slate-800 rounded-lg flex items-center gap-1.5 whitespace-nowrap"
            >
              <Loader className="w-3.5 h-3.5 animate-spin" />
              <span>Connecting…</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-sm"
            >
              <Usb className="w-3.5 h-3.5" />
              <span>Connect Keyboard</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="flex md:hidden items-center justify-around overflow-x-auto gap-1 pt-2.5 mt-2 border-t border-slate-800/60 text-xs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`py-1 px-2.5 rounded-lg whitespace-nowrap ${
              activeTab === tab.id ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60' : 'text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
