import React, { useState } from 'react';
import { DriverLogEntry } from '../types/driver';
import { Terminal, Shield, Copy, Check, RefreshCw } from 'lucide-react';

interface PlatformBridgeProps {
  logs: DriverLogEntry[];
  onClearLogs: () => void;
  onRetryConnection: () => void;
}

const UDEV_CMD = `sudo tee /etc/udev/rules.d/99-kreo-hive75.rules << 'EOF'
SUBSYSTEM=="hidraw", ATTRS{idVendor}=="320f", ATTRS{idProduct}=="5055", MODE="0666", TAG+="uaccess"
EOF
sudo udevadm control --reload-rules && sudo udevadm trigger`;

export const PlatformBridge: React.FC<PlatformBridgeProps> = ({ logs, onClearLogs, onRetryConnection }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(UDEV_CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* udev Rule */}
      <div className="p-5 rounded-2xl bg-[#0f141f] border border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-100">Linux udev Permission Rule</h2>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-mono rounded-lg bg-[#141b29] hover:bg-slate-800 text-cyan-300 border border-slate-700/80 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Command'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          On Linux, <code className="text-cyan-400 font-mono">/dev/hidraw*</code> nodes default to root-only access.
          Run this once in a terminal to grant your browser permanent access to the Kreo Hive 75.
          Then unplug and replug the keyboard.
        </p>

        <div className="p-3 rounded-xl bg-[#090d14] border border-slate-900 font-mono text-xs text-slate-300 overflow-x-auto">
          <pre>{UDEV_CMD}</pre>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <span className="text-emerald-400 font-mono">✓</span>
          Windows, macOS, and ChromeOS require no extra setup — WebHID works out of the box.
        </div>
      </div>

      {/* Event Log */}
      <div className="p-5 rounded-2xl bg-[#0f141f] border border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-slate-100">Driver Event Log</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRetryConnection}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-[#141b29] hover:bg-slate-800 rounded-lg border border-slate-800 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-cyan-400" />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={onClearLogs}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-[#141b29] hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#090d14] border border-slate-900 font-mono text-xs h-64 overflow-y-auto flex flex-col gap-1.5">
          {logs.length === 0 ? (
            <div className="text-slate-600 text-center py-10">No events logged yet.</div>
          ) : (
            logs.map((log) => {
              const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
                hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
              });
              const color =
                log.type === 'error' ? 'text-rose-400' :
                log.type === 'warn'  ? 'text-amber-400' :
                log.type === 'success' ? 'text-emerald-400' :
                log.type === 'packet' ? 'text-cyan-400/80' : 'text-slate-300';

              return (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-600 shrink-0">[{timeStr}]</span>
                  <span className={`uppercase text-[10px] shrink-0 font-bold ${color}`}>[{log.type}]</span>
                  <span className={`${color} break-all`}>{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
