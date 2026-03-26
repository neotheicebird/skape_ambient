## ADDED Requirements

### Requirement: Texture Overlay Authoring Controls
The creator tool SHALL provide controls for `textureOverlay` including `texture` selection, `scale`, `intensity`, and optional `distortion`.

#### Scenario: Configure texture overlay
- **WHEN** a developer enables texture overlay for a preset
- **THEN** the UI provides texture dropdown and numeric controls for supported fields
- **AND** control changes update preview output in real time

### Requirement: Global Grain Control
The creator tool SHALL provide a global grain-intensity control and SHALL NOT provide a grain enable/disable toggle.

#### Scenario: Adjust global grain intensity
- **WHEN** a developer adjusts grain intensity
- **THEN** preview output updates with the new global grain value
- **AND** the value is constrained to `0.03` through `0.08`

## MODIFIED Requirements

### Requirement: Full Preset Parameter Controls
The system SHALL provide controls for all v1.3 preset parameters: `palette`, `effect`, `speed`, `distortion`, `noise`, and `overlays` (`chromaticAberration`, `pixelGrid`, `textureOverlay`), plus global grain intensity controls.

#### Scenario: Configure all parameters
- **WHEN** a developer edits a preset
- **THEN** each v1.3 preset parameter is editable through a corresponding control
- **AND** global grain intensity is editable through a dedicated control
- **AND** selected values are reflected in the active preview

### Requirement: Effect Mode Support
The system SHALL support exactly five effect modes in v1.3: `flow`, `gas`, `burn`, `bands`, and `cellular`.

#### Scenario: Select an effect mode
- **WHEN** a developer selects an effect mode
- **THEN** the selected mode is one of `flow`, `gas`, `burn`, `bands`, or `cellular`
- **AND** preview rendering uses the selected mode

### Requirement: JSON Preset Contract
The system SHALL export presets as human-readable JSON files matching the v1.3 schema with optional metadata.

#### Scenario: Export valid preset JSON
- **WHEN** a developer exports a preset
- **THEN** output is valid JSON
- **AND** output includes required fields: `name`, `palette`, `effect`, `speed`, `distortion`, and `noise`
- **AND** output may include optional `overlays` and optional `performanceScore` when available

### Requirement: Preset Performance Budget Model
The creator tool SHALL compute a preset performance score using static costs and a fixed maximum budget of `5` aligned to the v1.3 effect and overlay model.

#### Scenario: Compute performance score from selected options
- **WHEN** a developer configures a preset with one base effect and any enabled overlays
- **THEN** the tool computes `totalCost = baseEffectCost + sum(activeOverlayCosts)`
- **AND** base effect costs are `flow=1`, `gas=3`, `burn=2`, `bands=2`, `cellular=3`
- **AND** overlay costs are `chromaticAberration=2`, `pixelGrid=1`, `textureOverlay=1`
