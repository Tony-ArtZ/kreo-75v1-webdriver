# Kreo Hive 75 V1 — Linux Reverse-Engineering Handoff Report

> **CORRECTION (post-handoff, verified against raw pcap bytes):** Two claims
> below are wrong and were the cause of a real bug (RGB never displaying,
> rainbow not toggling correctly).
>
> 1. **RGB/rainbow byte offset.** Section 8's speed byte values, and the
>    "Rainbow selector correction" section's claim that **Normal** mode
>    puts its rainbow selector at byte 12 and RGB at bytes 13-15, is
>    **incorrect**. Decoding the actual USBPcap SET_REPORT payloads in
>    `colors.pcapng` and `cloud_rgb.pcapng` byte-by-byte shows byte 12 is
>    constant `0x00` for Normal (it's simply unused, same as any mode
>    without a direction control) and the rainbow selector is at **byte
>    13** for Normal, exactly like it is for Cloud. RGB is at **bytes
>    14-16** for both modes. See the "VERIFIED" section at the end of this
>    document for the corrected, hardware-confirmed layout.
> 2. **Speed direction.** Section 8's speed byte values are backwards:
>    on real hardware, the UI's "100%" setting is the *fastest* and should
>    map to the *highest* byte value (`0x04`), not `0x00`. See the
>    "VERIFIED" section for the corrected table.
>
> The rest of this document (modes, brightness, direction/submode values,
> checksum) has been confirmed working and is left as-is.

**Project:** Reverse-engineering the Kreo Hive 75 V1 Windows configuration protocol  
**Hardware:** Kreo Hive 75 V1  
**Goal:** Build a Linux userspace implementation/configurator for the proprietary lighting/configuration interface, while leaving normal keyboard input to Linux's HID stack.

---

## 1. Hardware / USB identity

The keyboard exposes:

- VID: `0x320F`
- PID: `0x5055`
- Revision: `0x0101`

Windows Device Manager showed two relevant HID keyboard interfaces:

- `HID\VID_320F&PID_5055&REV_0101&MI_00`
- `HID\VID_320F&PID_5055&REV_0101&MI_01&Col01`

The proprietary configuration traffic identified so far is on:

- **Interface:** `1` (`MI_01`)
- **HID Report ID:** `0x04`
- **Report type:** Output
- **Report size:** 64 bytes

---

# 2. USB/HID transport

The configuration software sends HID `SET_REPORT`.

Observed setup packet:

```text
21 09 04 02 01 00 40 00
```

Interpretation:

```text
0x21  = Host → Device, Class, Interface
0x09  = HID SET_REPORT
wValue = 0x0204
        0x02 = Output report
        0x04 = Report ID
wIndex = 0x0001
        interface 1
wLength = 0x0040
        64 bytes
```

Therefore the Linux implementation should initially target the HID interface/report rather than writing a kernel driver.

A userspace `hidraw` implementation is the preferred first prototype.

---

# 3. Lighting report format

The main lighting command is a 64-byte HID report.

Current model:

```text
Offset    Meaning
------------------------------------------------
0         Report ID = 0x04
1-2       16-bit little-endian checksum
3         0x06
4         0x22
5-8       currently observed as 00 00 00 00
9         lighting mode/effect ID
10        brightness
11        speed
12        direction / effect-specific submode
13        Red
14        Green
15        Blue
16        rainbow flag: 0x00 = explicit RGB, 0x01 = rainbow
17-63     unknown/reserved / additional data
```

Important: bytes 10-12 are **mode-specific parameters**. Their general positions are stable, but their human meaning can vary by effect.

---

# 4. Checksum — high confidence

A major discovery from the complete-mode capture:

```text
bytes 1-2 = little-endian 16-bit sum of bytes 3 through 63
```

Equivalent implementation:

```python
checksum = sum(report[3:64]) & 0xFFFF

report[1] = checksum & 0xFF
report[2] = (checksum >> 8) & 0xFF
```

This explains the apparently changing values previously observed at offsets 1-2.

They are not simply a sequence counter.

The checksum changes whenever report contents change.

This should be treated as a confirmed protocol rule unless future captures contradict it.

---

# 5. Constant header

Lighting commands observed consistently contain:

```text
offset 3 = 0x06
offset 4 = 0x22
offset 5 = 0x00
offset 6 = 0x00
offset 7 = 0x00
offset 8 = 0x00
```

Current implementation should use:

```text
06 22 00 00 00 00
```

for the lighting command family.

The exact semantic meaning of bytes 3-8 is not yet known.

---

# 6. Complete lighting mode mapping

The user's Windows software mode sequence produced the following IDs:

| Mode | ID |
|---|---:|
| Corrugated | `0x01` |
| Cloud | `0x02` |
| Serpentine | `0x03` |
| Spectrum | `0x04` |
| Breath | `0x05` |
| Normal | `0x06` |
| Reaction | `0x07` |
| Ripples | `0x08` |
| Traverse | `0x09` |
| Stars | `0x0A` |
| Flowers | `0x0B` |
| Roll | `0x0C` |
| Wave | `0x0D` |
| Cartoon | `0x0E` |
| Rain | `0x0F` |
| Scan | `0x10` |
| Unknown/reserved | `0x11` |
| Speed | `0x12` |
| Unknown/reserved | `0x13` |
| Custom | `0x14` |

Previously isolated captures independently confirmed:

- Normal = `0x06`
- Star/Stars = `0x0A`
- Rain = `0x0F`
- Cloud = `0x02`

The complete capture provides the contiguous mapping above.

---

# 7. Brightness

Brightness was experimentally confirmed using the software's five discrete positions:

```text
100% = 0x04
75%  = 0x03
50%  = 0x02
25%  = 0x01
0%   = 0x00
```

Therefore:

```text
byte 10 = brightness
```

for Cloud and the current lighting command family.

---

# 8. Speed

The user independently tested and confirmed:

```text
byte 11 = speed
```

This was verified using an effect with a speed control (Cloud).

The Windows UI uses five discrete speed positions, analogous to:

```text
100%
75%
50%
25%
0%
```

The exact byte value corresponding to each speed position has not been preserved with sufficient confidence from the earlier capture and should be re-captured cleanly before documenting the numeric mapping.

Important:

> Do not infer that speed is byte 10. The confirmed speed field is byte 11.

---

# 9. Direction / submode

Byte 12 has been experimentally demonstrated to control direction/submode.

## Cloud

From the direction capture:

```text
Cloud = 0x02

byte 12:
0x00 = Left → Right
0x01 = Right → Left
```

## Corrugated

Corrugated (`0x01`) is confirmed to be one of the effects using byte 12 as its direction/submode field. The two values `0x00` and `0x01` are used, but the human-readable names for those two directions have not yet been decoded.

```text
Corrugated:
byte 12 = 0x00 or 0x01
```

## Serpentine

The user's sequence:

```text
Anticlockwise
Clockwise
Anticlockwise
```

corresponded to:

```text
byte 12:
0x00
0x01
0x00
```

Therefore:

```text
Serpentine:
0x00 = Anticlockwise
0x01 = Clockwise
```

## Roll

The user's sequence:

```text
Down To
Bottom Up
Down To
```

corresponded to:

```text
byte 12:
0x00
0x01
0x00
```

Therefore:

```text
Roll:
0x00 = Down To
0x01 = Bottom Up
```

## Speed effect

The user's sequence:

```text
From Inside
Outside
From Inside
```

corresponded to:

```text
byte 12:
0x00
0x01
0x00
```

Therefore:

```text
Speed:
0x00 = From Inside
0x01 = Outside
```

This shows that byte 12 is better named:

> **direction / effect-specific submode**

rather than globally calling it "direction."

---

# 10. RGB

RGB was independently confirmed with controlled changes.

Example:

```text
R = 0x11
G = 0x22
B = 0x33
```

produced:

```text
byte 13 = 0x11
byte 14 = 0x22
byte 15 = 0x33
```

A second test using:

```text
R = 0x44
G = 0x55
B = 0x66
```

showed live updates:

```text
R change → 44 FF FF
G change → 44 55 FF
B change → 44 55 66
```

Therefore:

```text
byte 13 = R
byte 14 = G
byte 15 = B
```

High confidence.

---

# 11. Current generic command model

The best current abstraction is:

```text
report[0]  = 0x04

report[3]  = 0x06
report[4]  = 0x22
report[5]  = 0x00
report[6]  = 0x00
report[7]  = 0x00
report[8]  = 0x00

report[9]  = effect_id
report[10] = brightness
report[11] = speed
report[12] = direction_or_submode
report[13] = red
report[14] = green
report[15] = blue

report[1:3] = checksum(sum(report[3:64]))
```

This is sufficient to attempt a first custom implementation.

---

# 12. Effect parameter support currently known

| Effect | ID | Byte 10 | Byte 11 | Byte 12 |
|---|---:|---|---|---|
| Corrugated | `01` | likely brightness | likely speed | direction |
| Cloud | `02` | brightness | speed | Left/Right; byte 13 = RGB/Rainbow selector |
| Serpentine | `03` | likely brightness | likely speed | Anti/Clockwise |
| Spectrum | `04` | likely brightness | likely speed | unknown |
| Breath | `05` | likely brightness | likely speed | unknown |
| Normal | `06` | brightness | no user speed control | no direction control |
| Reaction | `07` | likely brightness | likely speed | unknown |
| Ripples | `08` | likely brightness | likely speed | unknown |
| Traverse | `09` | likely brightness | likely speed | unknown |
| Stars | `0A` | likely brightness | likely speed | unknown |
| Flowers | `0B` | likely brightness | likely speed | unknown |
| Roll | `0C` | likely brightness | likely speed | Down/Bottom |
| Wave | `0D` | likely brightness | likely speed | unknown |
| Cartoon | `0E` | likely brightness | likely speed | unknown |
| Rain | `0F` | likely brightness | likely speed | unknown |
| Scan | `10` | likely brightness | likely speed | unknown |
| Speed | `12` | likely brightness | likely speed | Inside/Outside |
| Custom | `14` | special | special | special |

Rows marked "likely" need isolated differential captures before being considered confirmed.

---

# 13. Custom mode

Custom/key-wise configuration produced a different-looking command family.

Observed reports included patterns resembling:

```text
04 43 00 0B 38 00 00 ...
04 7B 00 0B 38 38 00 ...
04 B3 00 0B 38 70 00 ...
04 EB 00 0B 38 A8 00 ...
04 23 01 0B 38 E0 00 ...
04 5C 00 0B 38 18 01 ...
04 8C 00 0B 30 50 01 ...
```

These are not yet decoded.

Custom/key-wise mapping should remain a separate reverse-engineering task.

---

# 14. Other protocol traffic

Other reports were observed around configuration operations, including patterns resembling:

```text
04 01 00 01 ...
04 02 00 02 ...
```

Their exact direction/meaning has not yet been established.

Do not assume these are unnecessary.

The main lighting `SET_REPORT` command is sufficiently understood to begin a controlled write test, but initialization/state synchronization may matter for some commands.

---

# 15. Recommended first implementation

Use Linux userspace HID rather than a kernel driver initially.

Target:

```text
/dev/hidrawX
VID = 0x320F
PID = 0x5055
interface = 1
report ID = 0x04
report length = 64
```

First prototype should expose a simple function:

```python
def make_lighting_report(
    mode,
    brightness,
    speed,
    direction,
    r,
    g,
    b,
):
    report = bytearray(64)

    report[0] = 0x04
    report[3] = 0x06
    report[4] = 0x22

    report[9]  = mode
    report[10] = brightness
    report[11] = speed
    report[12] = direction
    report[13] = r
    report[14] = g
    report[15] = b

    checksum = sum(report[3:64]) & 0xFFFF
    report[1] = checksum & 0xFF
    report[2] = (checksum >> 8) & 0xFF

    return report
```

This is a protocol hypothesis to test against the real keyboard, not yet a production driver.

---

# 16. Safe testing strategy

Do not immediately build the complete GUI.

Start with:

1. Identify the correct `/dev/hidrawX`.
2. Verify its USB VID/PID.
3. Confirm it corresponds to interface 1.
4. Open it from a small userspace program.
5. Generate a known-safe lighting report.
6. Start with the current/default mode and RGB values.
7. Send one report.
8. Observe whether the keyboard changes.
9. Capture the exchange with USBPcap/Wireshark on Windows for comparison.

The first write should ideally reproduce an exact report already generated by the official Windows application.

For example, reproduce a known Cloud state rather than inventing a new combination.

---

# 17. What is confirmed vs unknown

## High confidence / confirmed

- VID/PID: `320F:5055`
- Relevant configuration interface: interface 1
- Report ID: `04`
- Output report: 64 bytes
- Transport: HID SET_REPORT
- Lighting header: `06 22 00 00 00 00`
- bytes 1-2: little-endian sum of bytes 3-63
- byte 9: effect ID
- byte 10: brightness
- byte 11: speed
- byte 12: mode-specific parameter
- Normal: byte 12 is the color selector (`0x00` RGB, `0x01` Rainbow); RGB is bytes 13-15
- Cloud: byte 12 is direction; byte 13 is the color selector (`0x00` RGB, `0x01` Rainbow); RGB is bytes 14-16
- brightness mapping: `0..4`
- complete effect ID table `01..10`, `12`, `14`
- Cloud direction
- Serpentine direction
- Roll direction
- Speed-effect direction

## Still unknown

- Whether every effect uses byte 10 exactly as brightness
- Whether every effect uses byte 11 exactly as speed
- Whether the Normal/Cloud color-mode selector semantics are shared by any other effect
- Direction/submode values for effects not yet tested
- Meaning of bytes 5-8 beyond their observed zero values
- Meaning of bytes 16-63
- Initialization/state-sync/ack traffic
- Custom/key-wise protocol
- Whether other color-capable modes expose the same explicit-RGB/Rainbow selector
- Any effect-specific parameters beyond the currently observed fields
- Whether the keyboard requires a particular initialization sequence before accepting arbitrary commands

---

# 18. Immediate next milestone

The next experiment should be an **exact report replay**.

Rather than reverse-engineering everything first, take one known-good Cloud command from the Windows software and recreate it byte-for-byte in Linux.

If the keyboard responds, we have proven:

```text
Linux userspace
      ↓
hidraw
      ↓
interface 1
      ↓
report 0x04
      ↓
Kreo Hive 75 V1 firmware
```

Then we can incrementally modify one field at a time.

This turns the project from passive reverse engineering into an actual working Linux implementation.

---

# 19. Capture files

Important captures collected during the project include:

- `hive75-red.pcapng`
- `rain2normal.pcapng`
- `normal2rain.pcapng`
- `rain2star2normal.pcapng`
- `17_34_51.pcapng`
- `68_85_102.pcapng`
- `255all_2_rainbow.pcapng`
- `brightness.pcapng`
- `speed.pcapng`
- `cloud-brightness-speed.pcapng`
- `direction.pcapng`
- `all modes.pcapng`

These captures are the experimental source material for the mappings above.

---

# 20. One-line project state

**We have reverse-engineered enough of the Hive 75 V1 lighting protocol to attempt a Linux userspace HID implementation: interface 1, report 0x04, 64 bytes, checksum, effect IDs, brightness, speed, direction/submode, and RGB are mapped; custom mode and several effect-specific parameters remain.**

## Rainbow selector correction — authoritative

The RGB/Rainbow captures were re-evaluated byte-for-byte. The important distinction is that the Rainbow selector is mode-specific.

### Normal (`0x06`)

```text
byte 12 = 0x00  explicit RGB
byte 12 = 0x01  Rainbow
byte 13 = R
byte 14 = G
byte 15 = B
```

The `colors.pcapng` sequence is direct evidence: the explicit-color packets keep bytes 13–15 unchanged while byte 12 toggles between `00` and `01` when Rainbow is selected.

### Cloud (`0x02`)

```text
byte 12 = direction
             0x00 = Left -> Right
             0x01 = Right -> Left

byte 13 = 0x00  explicit RGB
byte 13 = 0x01  Rainbow
byte 14 = R
byte 15 = G
byte 16 = B
```

The `cloud rgb.pcapng` capture is direct evidence: for the same RGB value `31 53 FF`, byte 13 changes from `00` to `01`, while direction is independently changed later by byte 12. Therefore byte 13 is the Cloud Rainbow selector, and bytes 14–16 are Cloud RGB.

### Important implementation rule

Do not use one universal Rainbow byte. The controller must build the complete mode-specific packet. When switching modes, Rainbow state is reset so a selector from one mode is never accidentally carried into another mode.

Rainbow is currently decoded only for Normal and Cloud. Other modes must not receive a guessed Rainbow packet.

> **⚠ Superseded — see the VERIFIED section below.** Both "Normal" and
> "Cloud" turn out to use the exact same byte 13 / bytes 14-16 layout.
> There is no per-mode shift; the RGB fields above for Normal were
> mis-numbered by one byte.

---

# 21. VERIFIED — corrected RGB/rainbow layout and speed direction

This section replaces Section 7 ("Rainbow selector correction") above, and
corrects Section 8's speed direction. It was produced by parsing the raw
USBPcap capture files (`colors.pcapng`, `cloud_rgb.pcapng`) directly:
decoding each USB `SET_REPORT` control transfer's setup+data payload,
extracting the 64-byte HID reports, and diffing them field-by-field against
the recorded UI actions (color picks, rainbow toggles, direction changes).
21 lighting reports across both captures were checked; the model below
reproduces all 21 byte-for-byte.

## Corrected report layout (same for every mode)

```text
byte 9  = effect id
byte 10 = brightness
byte 11 = speed
byte 12 = direction/submode — 0x00 when the effect has no direction
          control (confirmed constant 0x00 across every Normal-mode
          capture; varies 0x00/0x01 for Cloud exactly as Section 9
          describes)
byte 13 = color-mode selector — 0x00 explicit RGB, 0x01 Rainbow
byte 14 = R
byte 15 = G
byte 16 = B
```

This is identical for Normal and Cloud — there is no per-mode shift. The
byte 12/13/14 numbering in Section 3 and the Section 7 "correction" for
Normal mode (byte 12 = rainbow, bytes 13-15 = RGB) was wrong by one byte.
Writing RGB starting at byte 13 clobbers the real color-mode selector byte
with the red channel value, which is why RGB never displayed correctly and
rainbow didn't toggle right in Normal mode.

Evidence (`colors.pcapng`, Normal mode, decoded from raw USBPcap bytes,
report id/checksum stripped, showing bytes 9-16):

```text
mode  bright  speed  dir   rainbow  R   G   B     meaning
0x06  0x04    0x00   0x00  0x00     ff  00  00    Red, explicit
0x06  0x04    0x00   0x00  0x01     ff  00  00    Red, rainbow (RGB retained)
0x06  0x04    0x00   0x00  0x00     00  d7  0f    Green, explicit
0x06  0x04    0x00   0x00  0x01     00  d7  0f    Green, rainbow (retained)
0x06  0x04    0x00   0x00  0x00     31  53  ff    Blue, explicit
0x06  0x04    0x00   0x00  0x01     31  53  ff    Blue, rainbow (retained)
0x06  0x04    0x00   0x00  0x00     00  48  91    Custom (0,72,145), explicit
0x06  0x04    0x00   0x00  0x01     00  48  91    Custom, rainbow (retained)
```

Byte 12 is `0x00` in every single Normal-mode report in the capture — it is
never touched by color or rainbow changes. This is the direct evidence that
byte 12 is not part of the RGB/rainbow fields for Normal mode.

`cloud_rgb.pcapng` shows the identical byte 13/14-16 layout for Cloud, plus
byte 12 changing between `0x00` and `0x01` only when direction is changed
— consistent with Section 9's Cloud direction findings and confirming
direction and color-mode selector are two independent bytes (12 and 13),
not one shared byte as Section 7 assumed for Normal.

Rainbow is still empirically confirmed only for Normal and Cloud. Other
modes should keep byte 13 forced to `0x00` (explicit) until captured and
confirmed individually — but their RGB, if they support explicit color,
should be written at bytes 14-16, not 13-15.

> **Update:** the controller now extrapolates this layout to every
> non-Custom mode rather than forcing byte 13 to `0x00` for anything but
> Normal/Cloud. The grouping matches the two patterns already confirmed
> here: **Corrugated, Cloud, Serpentine, Roll, Speed** (i.e. `DIRECTION_MODES`
> — every mode with a decoded direction control) follow the Cloud pattern
> (byte 12 = direction, byte 13 = rainbow); every other non-Custom mode
> (Spectrum, Breath, Normal, Reaction, Ripples, Traverse, Stars, Flowers,
> Wave, Cartoon, Rain, Scan) follows the Normal pattern (byte 12 = `0x00`,
> byte 13 = rainbow). This is only hardware-verified for Normal and Cloud
> themselves — the rest is the same layout extrapolated on the reasonable
> assumption that the firmware doesn't special-case the field per effect.
> Treat rainbow (and RGB) on modes outside Normal/Cloud as untested until
> you've confirmed each one against your own hardware; Custom (`0x14`)
> is explicitly excluded since it uses a wholly different packet family
> (Section 13) that this tool does not attempt to generate.

## Corrected speed direction

Section 8 above documents that byte 11 is the speed field but leaves its
value direction unconfirmed. On real hardware, the UI's percentage labels
scale the same direction as brightness:

```text
0%   = 0x00  (slowest)
25%  = 0x01
50%  = 0x02
75%  = 0x03
100% = 0x04  (fastest)
```

An earlier implementation had this backwards (100% → `0x00`, 0% → `0x04`),
which is why selecting "100%" ran the effect slowly and "0%" ran it fast.
