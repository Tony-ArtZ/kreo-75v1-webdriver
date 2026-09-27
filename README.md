# Kreo Hive 75 USB HID Protocol Specification

Technical documentation and reverse-engineered protocol reference for the Kreo Hive 75 mechanical keyboard lighting and configuration interface.

---

## 1. Hardware Identification

The Kreo Hive 75 keyboard enumerates across two composite USB HID interfaces under a single device descriptor:

| Parameter | Value |
|---|---|
| Vendor ID (VID) | `0x320F` (Evision) |
| Product ID (PID) | `0x5055` |
| USB Revision | `0x0101` |
| Interface 0 (`MI_00`) | Standard HID Keyboard & Consumer Media Control |
| Interface 1 (`MI_01`) | Proprietary Vendor Configuration & LED Controller |
| HID Collection Usage Page | Vendor-Defined (`0xFF00` - `0xFFFF`) |
| Linux Node Mapping | Typically `/dev/hidraw3` (IF 0) and `/dev/hidraw4` (IF 1) |

All configuration, effect profile selection, and lighting parameters are transmitted exclusively over **Interface 1**. Keyboard keystroke input remains isolated on Interface 0 and is processed by the standard operating system HID keyboard stack.

---

## 2. USB Transport & Transfer Architecture

Lighting configurations are issued as USB HID `SET_REPORT` control transfers directed to Interface 1:

### Setup Packet
```
21 09 04 02 01 00 40 00
```

### Field Dissection
* `bmRequestType = 0x21`: Host-to-device, Class-specific request, targeted at an Interface.
* `bRequest = 0x09`: HID `SET_REPORT`.
* `wValue = 0x0204`:
  * High byte `0x02`: Report Type = Output Report (`HID_REPORT_TYPE_OUTPUT`).
  * Low byte `0x04`: Report ID = `0x04`.
* `wIndex = 0x0001`: Target Interface = 1 (`MI_01`).
* `wLength = 0x0040`: 64 bytes total transfer length.

When communicating via the Linux userspace `hidraw` API, writing a 64-byte buffer (starting with Report ID `0x04`) directly to `/dev/hidraw*` triggers this exact control transfer. In the WebHID API, invoking `device.sendReport(0x04, data)` submits the 63-byte payload succeeding the Report ID byte.

---

## 3. 64-Byte Output Report Layout

The primary lighting command packet adheres to a fixed 64-byte structure:

| Byte Offset | Field | Type | Permitted Values | Description |
|---|---|---|---|---|
| `0` | Report ID | `uint8` | `0x04` | HID Output Report Identifier. |
| `1` | Checksum Low | `uint8` | `0x00 - 0xFF` | Least significant byte of 16-bit little-endian checksum. |
| `2` | Checksum High | `uint8` | `0x00 - 0xFF` | Most significant byte of 16-bit little-endian checksum. |
| `3` | Command Code 0 | `uint8` | `0x06` | Constant protocol command family header. |
| `4` | Command Code 1 | `uint8` | `0x22` | Constant protocol command sub-identifier. |
| `5` | Reserved | `uint8` | `0x00` | Constant padding byte. |
| `6` | Reserved | `uint8` | `0x00` | Constant padding byte. |
| `7` | Reserved | `uint8` | `0x00` | Constant padding byte. |
| `8` | Reserved | `uint8` | `0x00` | Constant padding byte. |
| `9` | Effect Mode ID | `uint8` | `0x01 - 0x14` | Lighting effect profile identifier. |
| `10` | Brightness | `uint8` | `0x00 - 0x04` | Discrete 5-level brightness scale. |
| `11` | Speed | `uint8` | `0x00 - 0x04` | Discrete 5-level animation speed scale. |
| `12` | Direction / Submode | `uint8` | `0x00`, `0x01` | Directional flow or pattern variant; `0x00` if unused. |
| `13` | Color Mode Selector | `uint8` | `0x00`, `0x01` | `0x00` = Explicit RGB; `0x01` = Dynamic Rainbow cycle. |
| `14` | Red Component | `uint8` | `0x00 - 0xFF` | Red channel intensity (0-255). |
| `15` | Green Component | `uint8` | `0x00 - 0xFF` | Green channel intensity (0-255). |
| `16` | Blue Component | `uint8` | `0x00 - 0xFF` | Blue channel intensity (0-255). |
| `17 - 63` | Reserved Payload | `uint8[47]` | `0x00` | Reserved by firmware; zero-padded. |

---

## 4. Checksum Calculation

Bytes 1 and 2 store an unsigned 16-bit little-endian checksum calculated as the cumulative sum of all report bytes from **Byte 3 through Byte 63**:

$$\text{Checksum} = \left( \sum_{i=3}^{63} \text{report}[i] \right) \ \& \ \text{0xFFFF}$$

The Report ID (`byte 0`) and the checksum fields (`bytes 1-2`) are excluded from the summation.

### Reference Implementations

#### C
```c
#include <stdint.h>

void calculate_checksum(uint8_t report[64]) {
    uint16_t checksum = 0;
    for (int i = 3; i < 64; i++) {
        checksum += report[i];
    }
    report[1] = (uint8_t)(checksum & 0xFF);
    report[2] = (uint8_t)((checksum >> 8) & 0xFF);
}
```

#### Python
```python
def apply_checksum(report: bytearray) -> bytearray:
    checksum = sum(report[3:64]) & 0xFFFF
    report[1] = checksum & 0xFF
    report[2] = (checksum >> 8) & 0xFF
    return report
```

#### TypeScript
```typescript
function applyChecksum(report: Uint8Array): void {
  let checksum = 0;
  for (let i = 3; i < 64; i++) {
    checksum += report[i];
  }
  checksum &= 0xffff;
  report[1] = checksum & 0xff;
  report[2] = (checksum >> 8) & 0xff;
}
```

---

## 5. Parameter Definitions & Value Ranges

### 5.1 Brightness (Byte 10)
Brightness operates across five discrete states mapping linearly to PWM duty cycles:

| Byte Value | UI Value | Description |
|---|---|---|
| `0x00` | 0% | Backlight fully disabled (Off) |
| `0x01` | 25% | Minimum illumination |
| `0x02` | 50% | Half illumination |
| `0x03` | 75% | Medium-high illumination |
| `0x04` | 100% | Maximum illumination |

### 5.2 Speed (Byte 11)
Speed operates across five discrete states scaling monotonically with effect frequency:

| Byte Value | UI Value | Relative Speed |
|---|---|---|
| `0x00` | 0% | Lowest frequency / slowest transition |
| `0x01` | 25% | Low frequency |
| `0x02` | 50% | Nominal speed |
| `0x03` | 75% | Fast frequency |
| `0x04` | 100% | Highest frequency / fastest transition |

*Note: For static modes where animation is absent (such as Normal `0x06`), byte 11 remains constant `0x00`.*

### 5.3 Direction / Submode (Byte 12)
Byte 12 controls trajectory, directionality, or pattern variant depending on the active effect mode:

| Effect ID | Effect Name | Byte 12 = `0x00` | Byte 12 = `0x01` |
|---|---|---|---|
| `0x01` | Corrugated | Channel A | Channel B |
| `0x02` | Cloud | Left to Right | Right to Left |
| `0x03` | Serpentine | Counter-Clockwise | Clockwise |
| `0x0C` | Roll | Downward | Upward |
| `0x12` | Speed | Center Outward (From Inside) | Perimeter Inward (Outside) |

For effects without directional or submode controls, Byte 12 must be set to `0x00`.

### 5.4 Color Mode & RGB Layout (Bytes 13-16)
Empirical analysis of packet captures (`colors.pcapng` and `cloud_rgb.pcapng`) confirms that the color-mode selector and RGB channels occupy uniform byte positions across modes:

* **Byte 13 (Color Mode)**:
  * `0x00`: Explicit static RGB mode using channels defined in bytes 14-16.
  * `0x01`: Internal rainbow cycle mode (bytes 14-16 retain their last values but are ignored by firmware rendering).
* **Bytes 14, 15, 16 (RGB Channels)**:
  * Byte 14: 8-bit Red component (`0x00 - 0xFF`).
  * Byte 15: 8-bit Green component (`0x00 - 0xFF`).
  * Byte 16: 8-bit Blue component (`0x00 - 0xFF`).

---

## 6. Complete Lighting Effect Mode Table

| Hex ID | Name | Category | Directional Support | Rainbow Support | Speed Support |
|---|---|---|---|---|---|
| `0x01` | Corrugated | Flow | Yes (`0x00`, `0x01`) | Yes | Yes |
| `0x02` | Cloud | Flow | Yes (`0x00`, `0x01`) | Yes | Yes |
| `0x03` | Serpentine | Flow | Yes (`0x00`, `0x01`) | Yes | Yes |
| `0x04` | Spectrum | Ambient | No (`0x00`) | Yes (Locked) | Yes |
| `0x05` | Breath | Ambient | No (`0x00`) | Yes | Yes |
| `0x06` | Normal | Static | No (`0x00`) | Yes | No (`0x00`) |
| `0x07` | Reaction | Reactive | No (`0x00`) | Yes | Yes |
| `0x08` | Ripples | Reactive | No (`0x00`) | Yes | Yes |
| `0x09` | Traverse | Flow | No (`0x00`) | Yes | Yes |
| `0x0A` | Stars | Reactive | No (`0x00`) | Yes | Yes |
| `0x0B` | Flowers | Reactive | No (`0x00`) | Yes | Yes |
| `0x0C` | Roll | Flow | Yes (`0x00`, `0x01`) | Yes | Yes |
| `0x0D` | Wave | Flow | No (`0x00`) | Yes | Yes |
| `0x0E` | Cartoon | Reactive | No (`0x00`) | Yes | Yes |
| `0x0F` | Rain | Reactive | No (`0x00`) | Yes | Yes |
| `0x10` | Scan | Reactive | No (`0x00`) | Yes | Yes |
| `0x11` | Reserved | — | — | — | — |
| `0x12` | Speed | Flow | Yes (`0x00`, `0x01`) | Yes | Yes |
| `0x13` | Reserved | — | — | — | — |
| `0x14` | Custom | Matrix | Custom Packet Family | Custom Packet Family | Custom Packet Family |

---

## 7. Custom Mode Protocol Divergence (`0x14`)

Per-key custom lighting (`0x14`) does not utilize the standard `0x06 0x22` single-report format. Instead, per-key programming transmits a multi-packet sequence that writes coordinate and color buffers directly to microcontroller EEPROM storage.

Observed report headers for custom configuration:
```text
04 43 00 0B 38 00 00 ...
04 7B 00 0B 38 38 00 ...
04 B3 00 0B 38 70 00 ...
04 EB 00 0B 38 A8 00 ...
04 23 01 0B 38 E0 00 ...
04 5C 00 0B 38 18 01 ...
04 8C 00 0B 30 50 01 ...
```

Transmitting single-packet `0x06 0x22` commands with mode set to `0x14` is invalid and ignored by the device firmware.

---

## 8. Ancillary Protocol Traffic

During initial device enumeration and official software startup, auxiliary status inquiries and acknowledgement exchanges occur:

```text
04 01 00 01 ...
04 02 00 02 ...
```

These packets function as state synchronizations or handshake queries. Standard lighting updates can be applied independently without requiring explicit handshake exchanges prior to issuing `0x06 0x22` reports.

---

## 9. Linux Subsystem & Permissions (`udev`)

On Linux distributions, kernel `hidraw` nodes default to access mode `0600` (root exclusive). Userspace processes without superuser privileges will receive `EACCES` (`Permission denied`) or browser `Failed to open device` errors.

### Udev Rule Specification

File: `/etc/udev/rules.d/99-kreo-hive75.rules`
```udev
SUBSYSTEM=="hidraw", ATTRS{idVendor}=="320f", ATTRS{idProduct}=="5055", MODE="0666", TAG+="uaccess"
```

### Application Commands
```bash
sudo udevadm control --reload-rules
sudo udevadm trigger --attr-match=idVendor=320f --attr-match=idProduct=5055
```

Following rule reloading and device re-plugging, the character device nodes `/dev/hidraw*` receive `0666` permissions:
```text
crw-rw-rw- 1 root root 243, 3 /dev/hidraw3
crw-rw-rw- 1 root root 243, 4 /dev/hidraw4
```

---

## 10. WebHID Driver Considerations

When interacting with the device through the W3C WebHID API:

1. **Interface Discrimination**:
   * Calling `navigator.hid.requestDevice({ filters: [{ vendorId: 0x320F, productId: 0x5055 }] })` returns multiple `HIDDevice` objects corresponding to `MI_00` and `MI_01`.
   * The driver must inspect `device.collections`. Interface 1 exposes a top-level collection with `usagePage >= 0xFF00` (Vendor-Defined), distinguishing it from the standard keyboard collection (`usagePage = 0x01`, Generic Desktop).
2. **Report ID Argument**:
   * When invoking `HIDDevice.prototype.sendReport(reportId, data)`, `reportId` must be passed as `4` (`0x04`), and `data` must contain bytes 1 through 63 (63 bytes total, excluding byte 0).
3. **Endpoint Throttling**:
   * Continuous reports must be metered to an interval no smaller than **35 ms** (~28 reports/second) to prevent USB full-speed endpoint buffer exhaustion and packet drops.
