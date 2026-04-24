---
title: AV System Update
date: 2026-03-16
category: Audio
tags: [RF, Antennas, Frequencies, Microphones, Power]
published: true
relatedFiles:
  - section: diagrams
    name: Antenna Diagramming.pdf
---

### RF / Antenna System

- Linked top (singer handheld) and middle (bodypack) receiver banks
- Enabled shared diversity using two passive directional antennas
- Bottom receiver bank remains unlinked
- Implemented diversity on bottom bank using two dedicated antennas (including previously unused antenna)
- Result: full passive directional antenna diversity across all receivers

### Frequency Coordination

- Updated frequencies on:
  - Yellow handheld
  - White handheld
- Change driven by detected RF activity while transmitters were idle

### Power Distribution

- Decommissioned faulty bottom power strip (previously taped and unstable)
- Re-routed splitter power for bottom bank to middle power strip
- Planned removal of faulty strip
- Clarification:
  - Splitters provide power to individual receivers
  - Bottom bank now powered exclusively via splitter (not strip)

### Microphone Configuration

- Standardized mic sensitivity settings across all units (baseline pass)
- Adjustments still open for refinement per use case
- Labeled gray handheld as **Procell-only** (rechargeables incompatible)

### System Validation

- Completed walk test across space
- RF performance and audio quality verified as stable

### Documentation / Resources

- Created shared folder for mic and receiver diagrams
- Folder access set to open via link (pending access validation)
- Plan to expand with additional tech documentation
- Dante patch list to be added and maintained

### Mic Sensitivity (Current Baseline)

- Singing handhelds:
  - Mic gain: -24
  - AF output: +6
- Remaining mics: pending full calibration

### Amplification

- Additional amp adjustments completed
- Current levels considered stable; monitoring for edge cases

### Aviom System Status

#### Mixback-Capable Distributor (Jacks 1–6, 9, 10)

- Supports wireless IEM mixback
- Jack #3:
  - Non-functional at floor box
  - Functional at distributor
  - Likely floor box connection issue (pending repair)
- Jack #10:
  - Functional only with external power (wall wart required)
  - Cause: failed distributor power supply
  - Transmitter currently patched to Rio rack
  - May revert to Aviom distributor depending on use case

#### Non-Mixback Distributor (Jacks 7–8)

- Does not support wireless mixback
- Requires headphones plugged directly into Aviom personal mixer
- Jack #8 currently assigned to drums
