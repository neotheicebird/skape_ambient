## ADDED Requirements

### Requirement: Preset Performance Budget Model
The creator tool SHALL compute a preset performance score using static costs and a fixed maximum budget of `5`.

#### Scenario: Compute performance score from selected options
- **WHEN** a developer configures a preset with one base effect and any enabled overlays
- **THEN** the tool computes `totalCost = baseEffectCost + sum(activeOverlayCosts)`
- **AND** base effect costs are `flow=1`, `burn=2`, `gas=3`
- **AND** overlay costs are `liquidGlass=1`, `ribbedGlass=1`, `pixelGrid=1`, `chromaticAberration=2`

### Requirement: Live Performance Feedback UI
The creator tool SHALL display a performance indicator that is visible during editing and updates in real time.

#### Scenario: Update indicator after parameter change
- **WHEN** a developer changes base effect or overlay configuration
- **THEN** the performance indicator updates immediately
- **AND** it shows both current score and maximum budget (for example `3/5`)

#### Scenario: Show performance level color coding
- **WHEN** the performance score is calculated
- **THEN** score `1-2` is shown as `Light`
- **AND** score `3-4` is shown as `Balanced`
- **AND** score `5` is shown as `Heavy`

### Requirement: Heavy Preset Advisory Warning
The creator tool SHALL warn when a preset exceeds the maximum budget and SHALL NOT block authoring or export solely for budget excess.

#### Scenario: Exceed budget threshold
- **WHEN** the calculated performance score is greater than `5`
- **THEN** the tool shows a warning that the preset may impact performance on some devices
- **AND** the preset remains editable and exportable if otherwise valid

### Requirement: Preset Composition Guidance
The creator tool SHALL provide guidance for recommended composition of one base effect with zero to two overlays.

#### Scenario: Configure beyond recommended overlay count
- **WHEN** a preset enables more than two overlays
- **THEN** the tool highlights that the configuration is beyond recommended composition guidance
- **AND** it keeps the configuration editable as an advisory-only rule

## MODIFIED Requirements

### Requirement: JSON Preset Contract
The system SHALL export presets as human-readable JSON files matching the V1 schema, with optional v1.2 metadata.

#### Scenario: Export valid preset JSON
- **WHEN** a developer exports a preset
- **THEN** output is valid JSON
- **AND** output includes required fields: `name`, `palette`, `effect`, `speed`, `distortion`, `noise`, `glass`, and `glassSize`
- **AND** output may include optional field `performanceScore` when available
