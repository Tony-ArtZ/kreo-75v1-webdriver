import { KREO_VID, KREO_PID, REPORT_ID, buildReport } from './protocol';
import { ConnectionStatus, DriverLogEntry, KreoDeviceInfo, KreoState } from '../types/driver';

export interface WebHIDListener {
  onStatusChange: (status: ConnectionStatus) => void;
  onDeviceInfoChange: (info: KreoDeviceInfo | null) => void;
  onLog: (entry: DriverLogEntry) => void;
  onPacketSent: (report: Uint8Array) => void;
}

export class KreoWebDriver {
  private device: HIDDevice | null = null;
  private status: ConnectionStatus = 'disconnected';
  private listeners: WebHIDListener[] = [];
  private pendingState: KreoState | null = null;
  private isSending = false;
  private sendTimeout: ReturnType<typeof setTimeout> | null = null;
  private packetsSentCount = 0;
  private lastSentTime = 0;
  private minIntervalMs = 35; // ~28 packets/sec throttle limit to prevent USB saturation

  /**
   * Cached report ID after first successful probe so subsequent sends skip the
   * probe loop and go directly to the correct ID.
   */
  private workingReportId: number | null = null;

  constructor() {
    this.setupBrowserListeners();
    this.checkExistingPermissions();
  }

  public subscribe(listener: WebHIDListener): () => void {
    this.listeners.push(listener);
    // Push initial status
    listener.onStatusChange(this.status);
    listener.onDeviceInfoChange(this.getDeviceInfo());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getDeviceInfo(): KreoDeviceInfo | null {
    if (!this.device) return null;
    return {
      vendorId: this.device.vendorId,
      productId: this.device.productId,
      productName: this.device.productName || 'Kreo Hive 75 Keyboard',
      opened: this.device.opened,
      collectionsCount: this.device.collections?.length || 0,
    };
  }

  public getPacketsCount(): number {
    return this.packetsSentCount;
  }

  public isWebHIDSupported(): boolean {
    return typeof navigator !== 'undefined' && 'hid' in navigator;
  }

  private notifyStatus(status: ConnectionStatus) {
    this.status = status;
    this.listeners.forEach((l) => l.onStatusChange(status));
  }

  private notifyDeviceInfo() {
    const info = this.getDeviceInfo();
    this.listeners.forEach((l) => l.onDeviceInfoChange(info));
  }

  private log(type: DriverLogEntry['type'], message: string, data?: Uint8Array | number[]) {
    const entry: DriverLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      type,
      message,
      data,
    };
    this.listeners.forEach((l) => l.onLog(entry));
  }

  // ---------------------------------------------------------------------------
  // HID descriptor introspection helpers
  // ---------------------------------------------------------------------------

  /**
   * Walks the device's HID collection tree and returns every output report ID
   * defined in the descriptor.  Returns [0] (no report ID) when empty.
   */
  private getOutputReportIds(device: HIDDevice): number[] {
    const ids: number[] = [];
    const traverse = (cols: readonly HIDCollectionInfo[]) => {
      for (const col of cols) {
        for (const r of col.outputReports ?? []) {
          if (r.reportId !== undefined && !ids.includes(r.reportId)) ids.push(r.reportId);
        }
        traverse(col.children ?? []);
      }
    };
    try {
      traverse(device.collections ?? []);
    } catch {
      /* ignore – collections may be unavailable on some platforms */
    }
    return ids;
  }

  /**
   * Returns the top-level usage pages exposed by this device interface.
   * Vendor-specific pages (≥ 0xFF00) indicate a lighting / config interface.
   */
  private getUsagePages(device: HIDDevice): number[] {
    const pages: number[] = [];
    try {
      for (const col of device.collections ?? []) {
        if (col.usagePage !== undefined && !pages.includes(col.usagePage)) pages.push(col.usagePage);
      }
    } catch {
      /* ignore */
    }
    return pages;
  }

  /**
   * Given a list of candidate Kreo HID devices (one per interface), returns
   * them sorted so that the lighting / configuration interface (Interface 1)
   * comes first.
   *
   * Heuristic: prefer devices whose top-level collection is a vendor-specific
   * usage page (0xFF00–0xFFFF).  If none qualify, keep original order.
   */
  private sortByLightingInterface(devices: HIDDevice[]): HIDDevice[] {
    return [...devices].sort((a, b) => {
      const aVendor = this.getUsagePages(a).some((p) => p >= 0xff00) ? 0 : 1;
      const bVendor = this.getUsagePages(b).some((p) => p >= 0xff00) ? 0 : 1;
      return aVendor - bVendor;
    });
  }

  // ---------------------------------------------------------------------------
  // Browser event listeners
  // ---------------------------------------------------------------------------

  private setupBrowserListeners() {
    if (!this.isWebHIDSupported()) return;

    navigator.hid.addEventListener('connect', (event: HIDConnectionEvent) => {
      this.log('info', `USB device connected: ${event.device.productName || 'Unknown Device'}`);
      if (event.device.vendorId === KREO_VID && event.device.productId === KREO_PID) {
        this.log('success', 'Detected Kreo Hive 75 reconnection. Ready to bind.');
      }
    });

    navigator.hid.addEventListener('disconnect', (event: HIDConnectionEvent) => {
      this.log('warn', `USB device disconnected: ${event.device.productName || 'Device'}`);
      if (this.device === event.device) {
        this.device = null;
        this.workingReportId = null;
        this.notifyStatus('disconnected');
        this.notifyDeviceInfo();
      }
    });
  }

  private async checkExistingPermissions() {
    if (!this.isWebHIDSupported()) {
      this.log('warn', 'WebHID API not available. Use Chrome or Edge.');
      return;
    }

    try {
      const devices = await navigator.hid.getDevices();
      const kreoDevices = devices.filter((d) => d.vendorId === KREO_VID && d.productId === KREO_PID);
      if (kreoDevices.length > 0) {
        const sorted = this.sortByLightingInterface(kreoDevices);
        this.log(
          'info',
          `Found ${kreoDevices.length} previously paired Kreo interface(s). Auto-connecting to lighting interface...`,
        );
        await this.attachDevice(sorted[0]);
      } else {
        this.log('info', 'No previously paired Kreo Hive 75 found. Click "Connect Keyboard" to authorize.');
      }
    } catch {
      // Ignore background check failure
    }
  }

  // ---------------------------------------------------------------------------
  // Public connection API
  // ---------------------------------------------------------------------------

  /**
   * Request device selection from user via WebHID browser dialog.
   * If the browser returns multiple Kreo interfaces, tries each in order
   * (lighting interface first) until one successfully sends a report.
   */
  public async requestAndConnect(forceAnyDevice = false): Promise<boolean> {
    if (!this.isWebHIDSupported()) {
      this.log('warn', 'WebHID not supported. Use Chrome or Edge.');
      return false;
    }

    try {
      this.notifyStatus('connecting');
      this.log('info', 'Requesting WebHID device authorization...');

      const filters = forceAnyDevice
        ? []
        : [{ vendorId: KREO_VID, productId: KREO_PID }];

      const devices = await navigator.hid.requestDevice({ filters });

      if (!devices || devices.length === 0) {
        this.notifyStatus(this.device ? 'connected' : 'disconnected');
        this.log('warn', 'No device selected in WebHID dialog.');
        return false;
      }

      // Sort so the lighting interface (vendor usage page) comes first
      const sorted = this.sortByLightingInterface(devices);

      if (sorted.length > 1) {
        this.log(
          'info',
          `${sorted.length} Kreo HID interfaces returned. Preferring vendor-specific lighting interface.`,
        );
      }

      return await this.attachDevice(sorted[0]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log('error', `Connection failed: ${msg}`);
      this.notifyStatus(this.device ? 'connected' : 'disconnected');
      return false;
    }
  }

  /**
   * Opens the HID device and logs its HID descriptor summary for diagnostics.
   * Resets the cached working report ID so the probe runs fresh.
   */
  public async attachDevice(dev: HIDDevice): Promise<boolean> {
    try {
      this.device = dev;
      this.workingReportId = null; // reset probe cache for new device
      this.notifyStatus('connecting');

      if (!this.device.opened) {
        this.log('info', `Opening HID communication channel for ${this.device.productName || 'Hive 75'}...`);
        await this.device.open();
      }

      // Log HID descriptor summary so users can diagnose interface issues
      const usagePages = this.getUsagePages(dev);
      const outputIds = this.getOutputReportIds(dev);
      this.log(
        'info',
        `HID descriptor: ${dev.collections?.length ?? 0} collection(s), ` +
          `usage pages: [${usagePages.map((p) => '0x' + p.toString(16).toUpperCase()).join(', ')}], ` +
          `output report IDs: [${outputIds.length ? outputIds.map((id) => '0x' + id.toString(16).padStart(2, '0')).join(', ') : 'none defined'}]`,
      );

      this.notifyStatus('connected');
      this.notifyDeviceInfo();
      this.log(
        'success',
        `Connected to Kreo Hive 75 (VID: 0x${dev.vendorId.toString(16).toUpperCase()} PID: 0x${dev.productId.toString(16).toUpperCase()})`,
      );
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log('error', `Could not open device interface: ${msg}`);
      this.log(
        'warn',
        'On Linux: ensure /dev/hidraw* has 0666 permissions (udev rule). On Windows/Mac: no extra setup needed.',
      );
      this.notifyStatus('disconnected');
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.device) {
      try {
        if (this.device.opened) {
          await this.device.close();
        }
      } catch (err) {
        console.error('Error closing device', err);
      }
      this.device = null;
      this.workingReportId = null;
    }
    this.notifyStatus('disconnected');
    this.notifyDeviceInfo();
    this.log('info', 'Disconnected from Kreo Hive 75.');
  }


  // ---------------------------------------------------------------------------
  // Send queue
  // ---------------------------------------------------------------------------

  /**
   * Queue and dispatch state report with throttling and fault-tolerant retry
   */
  public sendState(state: KreoState): void {
    this.pendingState = { ...state };

    const now = Date.now();
    const elapsed = now - this.lastSentTime;

    if (this.isSending || elapsed < this.minIntervalMs) {
      if (!this.sendTimeout) {
        const wait = Math.max(0, this.minIntervalMs - elapsed);
        this.sendTimeout = setTimeout(() => {
          this.sendTimeout = null;
          this.processQueue();
        }, wait);
      }
      return;
    }

    this.processQueue();
  }

  private async processQueue() {
    if (!this.pendingState || this.isSending) return;

    const stateToSend = this.pendingState;
    this.pendingState = null;
    this.isSending = true;

    try {
      const report = buildReport(stateToSend);

      // Notify packet sent for live UI inspector & keyboard visualizer
      this.listeners.forEach((l) => l.onPacketSent(report));
      this.packetsSentCount++;
      this.lastSentTime = Date.now();

      // If physical device is connected and opened, send report over USB
      if (this.device && this.device.opened) {
        await this.dispatchUSBReport(report);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log('error', `Packet transmission error: ${msg}`);
    } finally {
      this.isSending = false;
      // If a newer state arrived while sending, process it immediately
      if (this.pendingState) {
        this.processQueue();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // USB dispatch with report ID probing
  // ---------------------------------------------------------------------------

  /**
   * Sends a 64-byte HID output report to the keyboard.
   *
   * On first call: probes all candidate report IDs in priority order and caches
   * the first one that succeeds.  Subsequent calls use the cached ID directly.
   *
   * Candidate order:
   *   1. REPORT_ID (0x04) – from reverse-engineered protocol
   *   2. IDs declared in the HID output report descriptors of this interface
   *   3. 0x00 – raw write without a report ID prefix (some vendor interfaces)
   */
  private async dispatchUSBReport(report: Uint8Array): Promise<void> {
    if (!this.device || !this.device.opened) return;

    // Payload without the leading report-ID byte (bytes 1–63)
    const reportData = new Uint8Array(report.subarray(1));

    // --- Fast path: use previously discovered working report ID ---
    if (this.workingReportId !== null) {
      const rid = this.workingReportId;
      // For rid=0 we send the full 64-byte buffer; otherwise the 63-byte payload
      const payload = rid === 0 ? report : reportData;
      await this.device.sendReport(rid, payload.buffer as ArrayBuffer);
      this.log(
        'packet',
        `TX[ID:0x${rid.toString(16).padStart(2, '0')}] 64-byte report ` +
          `(CRC: 0x${report[2].toString(16).padStart(2, '0')}${report[1].toString(16).padStart(2, '0')})`,
        report,
      );
      return;
    }

    // --- Probe phase: find a working report ID ---
    const descriptorIds = this.getOutputReportIds(this.device);
    const candidates: number[] = [REPORT_ID];
    for (const id of descriptorIds) {
      if (!candidates.includes(id)) candidates.push(id);
    }
    if (!candidates.includes(0)) candidates.push(0);

    this.log(
      'info',
      `Probing report IDs [${candidates.map((id) => '0x' + id.toString(16).padStart(2, '0')).join(', ')}] ` +
        `(HID descriptor output IDs: [${descriptorIds.length ? descriptorIds.map((id) => '0x' + id.toString(16).padStart(2, '0')).join(', ') : 'none'}])`,
    );

    for (const rid of candidates) {
      try {
        const payload = rid === 0 ? report : reportData;
        await this.device.sendReport(rid, payload.buffer as ArrayBuffer);
        // Cache and log the winner
        this.workingReportId = rid;
        this.log(
          'success',
          `Report ID 0x${rid.toString(16).padStart(2, '0')} accepted ✓ — cached for subsequent sends.`,
        );
        this.log(
          'packet',
          `TX[ID:0x${rid.toString(16).padStart(2, '0')}] 64-byte report ` +
            `(CRC: 0x${report[2].toString(16).padStart(2, '0')}${report[1].toString(16).padStart(2, '0')})`,
          report,
        );
        return;
      } catch {
        // Continue to next candidate
      }
    }

    // All candidates exhausted — throw a descriptive error
    throw new Error(
      `All report IDs failed: [${candidates.map((id) => '0x' + id.toString(16).padStart(2, '0')).join(', ')}]. ` +
        `You may have selected Interface 0 (keyboard) instead of Interface 1 (lighting). ` +
        `Disconnect and reconnect — if the picker shows two "Kreo Hive RGB" entries, select the second one.`,
    );
  }
}

export const driverSingleton = new KreoWebDriver();
