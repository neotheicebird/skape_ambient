# creator-tool Specification

## Purpose
TBD - created by archiving change add-creator-tool-v1. Update Purpose after archive.
## Requirements
### Requirement: Internal Creator Workspace
The system SHALL provide an internal creator tool workspace dedicated to authoring Skape Ambient presets.

#### Scenario: Open creator tool workspace
- **WHEN** a developer launches the creator tool
- **THEN** the system presents a workspace for preset authoring
- **AND** the workspace is marked as internal-use, not public-facing

### Requirement: Real-Time Shader Preview
The system SHALL render a live preview canvas that updates immediately when preset parameters change.

#### Scenario: Update preview from control change
- **WHEN** a developer changes any supported preset parameter
- **THEN** the preview updates without requiring a manual refresh

### Requirement: Full Preset Parameter Controls
The system SHALL provide controls for all V1 preset parameters: `palette`, `effect`, `speed`, `distortion`, `noise`, `glass`, and `glassSize`.

#### Scenario: Configure all parameters
- **WHEN** a developer edits a preset
- **THEN** each V1 parameter is editable through a corresponding control
- **AND** the selected values are reflected in the active preview

### Requirement: Hex Palette File Support
The system SHALL load selectable palettes from `.hex` palette files placed in a configured project folder.

#### Scenario: Load palettes from source folder
- **WHEN** `.hex` palette files are present in the configured palette folder
- **THEN** the creator tool discovers them
- **AND** makes parsed colors available in palette selection controls

### Requirement: Effect Mode Support
The system SHALL support exactly three effect modes in V1: `flow`, `liquid`, and `burn`.

#### Scenario: Select an effect mode
- **WHEN** a developer selects an effect mode
- **THEN** the selected mode is one of `flow`, `liquid`, or `burn`
- **AND** preview rendering uses the selected mode

### Requirement: Preset Management Actions
The system SHALL allow creating a preset, editing an existing preset, and renaming a preset before export.

#### Scenario: Create and rename preset
- **WHEN** a developer creates a new preset and renames it
- **THEN** the preset name updates in the editor state
- **AND** the updated name is used for export metadata

### Requirement: Preset Import
The system SHALL allow loading preset JSON files into the creator tool for further editing.

#### Scenario: Import preset JSON
- **WHEN** a developer selects a valid preset JSON file
- **THEN** the tool parses and loads the preset into the active preset library
- **AND** the imported preset becomes selectable and editable

### Requirement: JSON Preset Contract
The system SHALL export presets as human-readable JSON files matching the V1 schema, with optional v1.2 metadata.

#### Scenario: Export valid preset JSON
- **WHEN** a developer exports a preset
- **THEN** output is valid JSON
- **AND** output includes required fields: `name`, `palette`, `effect`, `speed`, `distortion`, `noise`, `glass`, and `glassSize`
- **AND** output may include optional field `performanceScore` when available

### Requirement: One Preset Per File Storage
The system SHALL save each exported preset as a single JSON file under the `/presets/` directory structure.

#### Scenario: Save preset file into library
- **WHEN** a developer saves an exported preset
- **THEN** exactly one JSON file is produced for that preset
- **AND** the file is stored under either `/presets/free` or `/presets/pro`

### Requirement: Preset Validation
The system SHALL validate preset data before save/export and block invalid preset output.

#### Scenario: Block invalid export
- **WHEN** preset data violates schema or supported effect constraints
- **THEN** export is rejected
- **AND** validation feedback is shown to the developer

#### Scenario: Reject invalid hex palette content
- **WHEN** a `.hex` palette file contains invalid color entries
- **THEN** the file is rejected for palette selection
- **AND** validation feedback identifies the invalid palette input

### Requirement: Manual Palette Asset Checkpoint
The system SHALL treat missing external `.hex` palette files as a manual-user-input checkpoint in the implementation workflow.

#### Scenario: Palette assets not yet provided
- **WHEN** the implementation requires palette files and none are available
- **THEN** the agent pauses implementation of palette-dependent steps
- **AND** explicitly requests the user to add `.hex` palette files before continuing validation

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

