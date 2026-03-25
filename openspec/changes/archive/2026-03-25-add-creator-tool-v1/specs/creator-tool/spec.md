## ADDED Requirements

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
The system SHALL export presets as human-readable JSON files matching the V1 schema.

#### Scenario: Export valid preset JSON
- **WHEN** a developer exports a preset
- **THEN** output is valid JSON
- **AND** output includes required fields: `name`, `palette`, `effect`, `speed`, `distortion`, `noise`, `glass`, and `glassSize`

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
