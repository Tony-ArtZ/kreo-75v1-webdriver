import React, { useState } from 'react';
import { KreoState } from '../types/driver';
import { buildReport, formatHexChunks, EFFECT_MODES } from '../driver/protocol';
import { Copy, Check, Terminal, FileCode, Cpu, ShieldCheck } from 'lucide-react';

interface PacketInspectorProps {
  state: KreoState;
  packetsSentCount: number;
}

export const PacketInspector: React.FC<PacketInspectorProps> = ({ state, packetsSentCount }) => {
  const [selectedByteIndex, setSelectedByteIndex] = useState<number | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const report = buildReport(state);
  const hexChunks = formatHexChunks(report);

  // Compute checksum details for explanation
  let rawSum = 0;
  for (let i = 3; i < report.length; i++) {
    rawSum += report[i];
  }
  const checksum16 = rawSum & 0xffff;
  const lowByte = checksum16 & 0xff;
  const highByte = (checksum16 >> 8) & 0xff;

  const currentMode = EFFECT_MODES.find((m) => m.id === state.mode);

  const getByteDescription = (index: number): { label: string; desc: string; valueHex: string } => {
    const valHex = `0x${report[index].toString(16).padStart(2, '0').toUpperCase()}`;

    if (index === 0) {
      return { label: 'Report ID', desc: 'HID Output Report ID 0x04 for Kreo Hive 75 configuration', valueHex: valHex };
    }
    if (index === 1) {
      return {
        label: 'Checksum (Low Byte)',
        desc: `Least significant byte of 16-bit sum(report[3..63]) & 0xFFFF. Current: ${valHex}`,
        valueHex: valHex,
      };
    }
    if (index === 2) {
      return {
        label: 'Checksum (High Byte)',
        desc: `Most significant byte of 16-bit sum(report[3..63]) & 0xFFFF. Current: ${valHex}`,
        valueHex: valHex,
      };
    }
    if (index === 3) {
      return { label: 'Header Byte 0', desc: 'Constant 0x06 command family discriminator', valueHex: valHex };
    }
    if (index === 4) {
      return { label: 'Header Byte 1', desc: 'Constant 0x22 lighting command identifier', valueHex: valHex };
    }
    if (index >= 5 && index <= 8) {
      return {
        label: `Header Byte ${index - 3}`,
        desc: 'Observed constant 0x00 padding in lighting packets',
        valueHex: valHex,
      };
    }
    if (index === 9) {
      return {
        label: 'Lighting Mode ID',
        desc: `Active effect ID: ${currentMode?.name || 'Unknown'} (0x${state.mode.toString(16).padStart(2, '0').toUpperCase()})`,
        valueHex: valHex,
      };
    }
    if (index === 10) {
      return {
        label: 'Brightness Level',
        desc: `Hardware brightness level: ${state.brightness * 25}% (0x00 to 0x04)`,
        valueHex: valHex,
      };
    }
    if (index === 11) {
      return {
        label: 'Speed Level',
        desc: `Hardware speed level: ${state.speed * 25}% (0x00 slowest to 0x04 fastest)`,
        valueHex: valHex,
      };
    }
    if (index === 12) {
      return {
        label: 'Direction / Submode',
        desc: currentMode?.supportsDirection
          ? `Effect direction: 0x0${state.direction} (${currentMode.directionLabels?.[state.direction as 0 | 1] || 'Active'})`
          : 'Reserved / Unused (Constant 0x00 for non-directional effects)',
        valueHex: valHex,
      };
    }
    if (index === 13) {
      return {
        label: 'Color Mode Selector',
        desc: state.rainbow
          ? '0x01 = Rainbow Mode enabled (mode-specific byte 13 layout)'
          : '0x00 = Explicit RGB Mode enabled',
        valueHex: valHex,
      };
    }
    if (index === 14) {
      return { label: 'Red Channel', desc: `Red component: ${report[14]} (0x${report[14].toString(16).padStart(2, '0').toUpperCase()})`, valueHex: valHex };
    }
    if (index === 15) {
      return { label: 'Green Channel', desc: `Green component: ${report[15]} (0x${report[15].toString(16).padStart(2, '0').toUpperCase()})`, valueHex: valHex };
    }
    if (index === 16) {
      return { label: 'Blue Channel', desc: `Blue component: ${report[16]} (0x${report[16].toString(16).padStart(2, '0').toUpperCase()})`, valueHex: valHex };
    }
    return {
      label: `Reserved (Byte ${index})`,
      desc: 'Reserved USB HID report padding (0x00)',
      valueHex: valHex,
    };
  };

  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const getExportString = (fmt: 'hex' | 'python' | 'c' | 'ts'): string => {
    const hexArr = Array.from(report).map((b) => '0x' + b.toString(16).padStart(2, '0'));
    switch (fmt) {
      case 'hex':
        return Array.from(report)
          .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
          .join(' ');
      case 'python':
        return `report = bytearray([\n    ${hexArr.join(', ')}\n])`;
      case 'c':
        return `const uint8_t kreo_report[64] = {\n    ${hexArr.join(', ')}\n};`;
      case 'ts':
        return `const report = new Uint8Array([\n    ${hexArr.join(', ')}\n]);`;
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Banner: Checksum & Transmission Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0f141f] border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-xs text-slate-400 block">Checksum (Bytes 1-2)</span>
              <span className="font-mono text-sm font-semibold text-emerald-300">
                0x{checksum16.toString(16).padStart(4, '0').toUpperCase()}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            [{`0x${lowByte.toString(16).padStart(2, '0')}, 0x${highByte.toString(16).padStart(2, '0')}`}]
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0f141f] border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <div>
              <span className="text-xs text-slate-400 block">Report Size / Endpoint</span>
              <span className="font-mono text-sm font-semibold text-cyan-300">64 Bytes / HID 0x04</span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-500">SET_REPORT</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0f141f] border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-purple-400" />
            <div>
              <span className="text-xs text-slate-400 block">Transmitted Packets</span>
              <span className="font-mono text-sm font-semibold text-purple-300 tabular-nums">
                {packetsSentCount}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Rate ~28Hz</span>
        </div>
      </div>

      {/* Main Hex Inspector & Byte Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hex Grid View (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#0f141f] border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Live HID Output Report</h2>
              <p className="text-xs text-slate-400">Click or hover any byte to decode its protocol function</p>
            </div>

            {/* Quick Copy Action */}
            <div className="flex items-center gap-2">
              {(['hex', 'python', 'c'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => copyToClipboard(getExportString(fmt), fmt)}
                  className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-[#141b29] hover:bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center gap-1 transition-colors uppercase"
                >
                  {copiedFormat === fmt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{fmt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Formatted 64-byte Hex Grid with interactive cells */}
          <div className="p-4 rounded-xl bg-[#0a0d14] border border-slate-900 font-mono text-xs overflow-x-auto">
            {/* Header Offset Bar */}
            <div
              className="grid gap-1 text-[10px] text-slate-600 pb-2 border-b border-slate-900 mb-2 font-semibold min-w-[540px]"
              style={{ gridTemplateColumns: '2.5rem repeat(16, minmax(0, 1fr))' }}
            >
              <span className="text-slate-500">ADDR</span>
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} className="text-center">
                  +{i.toString(16).toUpperCase()}
                </span>
              ))}
            </div>

            {/* 4 Rows of 16 Bytes */}
            {Array.from({ length: 4 }).map((_, rowIdx) => {
              const startIdx = rowIdx * 16;
              const rowBytes = Array.from(report.slice(startIdx, startIdx + 16));

              return (
                <div
                  key={rowIdx}
                  className="grid gap-1 py-1 items-center min-w-[540px]"
                  style={{ gridTemplateColumns: '2.5rem repeat(16, minmax(0, 1fr))' }}
                >
                  {/* Row address */}
                  <span className="text-slate-500 text-[10px]">{startIdx.toString(16).padStart(2, '0').toUpperCase()}</span>

                  {/* 16 bytes */}
                  {rowBytes.map((byte, colIdx) => {
                    const absIdx = startIdx + colIdx;
                    const isSelected = selectedByteIndex === absIdx;

                    // Color code crucial protocol fields
                    let byteColor = 'text-slate-400';
                    let byteBg = 'hover:bg-slate-800';

                    if (absIdx === 0) {
                      byteColor = 'text-cyan-400 font-bold';
                      byteBg = 'bg-cyan-950/30 hover:bg-cyan-950/60';
                    } else if (absIdx === 1 || absIdx === 2) {
                      byteColor = 'text-emerald-400 font-bold';
                      byteBg = 'bg-emerald-950/30 hover:bg-emerald-950/60';
                    } else if (absIdx === 3 || absIdx === 4) {
                      byteColor = 'text-indigo-400';
                    } else if (absIdx === 9) {
                      byteColor = 'text-amber-400 font-bold';
                      byteBg = 'bg-amber-950/30 hover:bg-amber-950/60';
                    } else if (absIdx === 10) {
                      byteColor = 'text-yellow-400 font-bold';
                    } else if (absIdx === 11) {
                      byteColor = 'text-green-400 font-bold';
                    } else if (absIdx === 12) {
                      byteColor = 'text-purple-400 font-bold';
                    } else if (absIdx === 13) {
                      byteColor = 'text-pink-400 font-bold';
                    } else if (absIdx >= 14 && absIdx <= 16) {
                      byteColor = absIdx === 14 ? 'text-rose-400' : absIdx === 15 ? 'text-emerald-400' : 'text-blue-400';
                    }

                    if (isSelected) {
                      byteBg = 'ring-2 ring-cyan-400 bg-cyan-900/50';
                    }

                    return (
                      <button
                        key={colIdx}
                        type="button"
                        onClick={() => setSelectedByteIndex(absIdx)}
                        onMouseEnter={() => setSelectedByteIndex(absIdx)}
                        className={`py-1 rounded text-center transition-all ${byteColor} ${byteBg}`}
                      >
                        {byte.toString(16).padStart(2, '0').toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* ASCII & Chunk Text Breakdown */}
          <div className="flex flex-col gap-1 text-[11px] font-mono text-slate-500 bg-[#0a0d14] p-3 rounded-xl border border-slate-900">
            {hexChunks.map((chunk) => (
              <div key={chunk.offset} className="flex justify-between items-center">
                <span className="text-slate-400">{chunk.offset}:</span>
                <span className="text-slate-300 font-medium">{chunk.hex}</span>
                <span className="text-slate-600 hidden sm:inline">{chunk.ascii}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Byte Inspector & Explanation (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#0f141f] border border-slate-800 flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-100">Protocol Spec Breakdown</h2>
            <span className="text-xs text-slate-400 font-mono">
              Byte {selectedByteIndex !== null ? selectedByteIndex : 'Select'}
            </span>
          </div>

          {selectedByteIndex !== null ? (
            (() => {
              const info = getByteDescription(selectedByteIndex);
              return (
                <div className="p-4 rounded-xl bg-[#141b29] border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-cyan-300">{info.label}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-white font-bold">
                      {info.valueHex}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{info.desc}</p>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Index in 64-byte array: byte[{selectedByteIndex}]
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="p-4 rounded-xl bg-[#141b29] border border-slate-800/80 text-xs text-slate-400 text-center py-8">
              Click or hover any byte in the report hex grid to inspect its role.
            </div>
          )}

          {/* Key Byte Mapping Reference Card */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-300">Verified Packet Layout</span>
            <div className="flex flex-col gap-1.5 text-xs font-mono">
              <div className="p-2 rounded-lg bg-[#141b29] border border-slate-800/80 flex justify-between items-center">
                <span className="text-cyan-400">Byte 0</span>
                <span className="text-slate-300">0x04 (Report ID)</span>
              </div>
              <div className="p-2 rounded-lg bg-[#141b29] border border-slate-800/80 flex justify-between items-center">
                <span className="text-emerald-400">Bytes 1-2</span>
                <span className="text-slate-300">Little-Endian Checksum</span>
              </div>
              <div className="p-2 rounded-lg bg-[#141b29] border border-slate-800/80 flex justify-between items-center">
                <span className="text-indigo-400">Bytes 3-8</span>
                <span className="text-slate-300">06 22 00 00 00 00 (Header)</span>
              </div>
              <div className="p-2 rounded-lg bg-[#141b29] border border-slate-800/80 flex justify-between items-center">
                <span className="text-amber-400">Byte 9</span>
                <span className="text-slate-300">Effect ID</span>
              </div>
              <div className="p-2 rounded-lg bg-[#141b29] border border-slate-800/80 flex justify-between items-center">
                <span className="text-yellow-400">Bytes 10-12</span>
                <span className="text-slate-300">Brightness, Speed, Direction</span>
              </div>
              <div className="p-2 rounded-lg bg-[#141b29] border border-slate-800/80 flex justify-between items-center">
                <span className="text-pink-400">Byte 13</span>
                <span className="text-slate-300">Color Mode (0=RGB, 1=Rainbow)</span>
              </div>
              <div className="p-2 rounded-lg bg-[#141b29] border border-slate-800/80 flex justify-between items-center">
                <span className="text-rose-400">Bytes 14-16</span>
                <span className="text-slate-300">Red, Green, Blue</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
