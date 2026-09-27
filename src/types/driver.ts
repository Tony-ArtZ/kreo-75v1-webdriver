export interface KreoState {
  mode: number;
  brightness: number; // 0..4
  speed: number; // 0..4 (0=slowest, 4=fastest)
  direction: number; // 0 or 1
  rgb: [number, number, number]; // [R, G, B] 0..255
  rainbow: boolean;
}

export interface EffectMode {
  id: number;
  name: string;
  category: 'flow' | 'reactive' | 'ambient' | 'custom';
  description: string;
  supportsDirection: boolean;
  supportsRainbow: boolean;
  supportsSpeed: boolean;
  directionLabels?: {
    0: string;
    1: string;
  };
}

export interface PresetProfile {
  id: string;
  name: string;
  description: string;
  state: KreoState;
  badge?: string;
}

export interface DriverLogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warn' | 'error' | 'packet';
  message: string;
  data?: Uint8Array | number[];
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface KreoDeviceInfo {
  vendorId: number;
  productId: number;
  productName: string;
  manufacturerName?: string;
  opened: boolean;
  collectionsCount: number;
  interfaceNumber?: number;
}
