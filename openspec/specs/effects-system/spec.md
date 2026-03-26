# effects-system Specification

## Purpose
TBD - created by archiving change effects-system-upgrade-v1-1. Update Purpose after archive.
## Requirements
### Requirement: Base Effect Set V1.1
The system SHALL support exactly three base effects in v1.1: `flow`, `burn`, and `gas`.

#### Scenario: Select base effect
- **WHEN** a preset chooses a base effect
- **THEN** the value is one of `flow`, `burn`, or `gas`

### Requirement: Layered Shader Pipeline
The shader pipeline SHALL execute as `BaseEffect -> OverlayEffects`.

#### Scenario: Apply overlays after base generation
- **WHEN** a frame is rendered
- **THEN** base effect structure/motion is generated first
- **AND** overlay effects are applied after base generation

### Requirement: Overlay Effect Types
The system SHALL support overlay types `liquidGlass`, `ribbedGlass`, `chromaticAberration`, and `pixelGrid`.

#### Scenario: Configure overlays in preset
- **WHEN** a preset enables overlays
- **THEN** only defined overlay types and fields are accepted

### Requirement: Preset Schema V1.1
Preset JSON SHALL support base effect values `flow|burn|gas` and optional `overlays` configuration as defined in v1.1.

#### Scenario: Validate preset schema
- **WHEN** a preset is imported or exported
- **THEN** it conforms to the v1.1 schema fields and effect enum

### Requirement: Creator Tool Control Model
The creator tool SHALL expose base-effect controls for `flow|burn|gas` and overlay toggles/controls for all supported overlays.

#### Scenario: Edit overlays in creator tool
- **WHEN** a developer edits a preset in the creator tool
- **THEN** overlay parameters can be enabled and configured from dedicated overlay controls

### Requirement: Framer API Constraint
The public Framer component SHALL remain preset-driven with API surface `preset: string` and SHALL NOT expose direct overlay controls.

#### Scenario: Configure component in Framer
- **WHEN** a user configures the public component
- **THEN** they select a preset identifier
- **AND** overlay internals are not exposed as direct controls

### Requirement: Performance Guardrails V1.1
The system SHALL enforce v1.1 performance constraints: fbm iterations <= 4, recommended active overlays <= 3, and no nested shader loops.

#### Scenario: Validate shader performance constraints
- **WHEN** shader behavior is reviewed for release
- **THEN** implementation stays within the defined iteration and complexity constraints

