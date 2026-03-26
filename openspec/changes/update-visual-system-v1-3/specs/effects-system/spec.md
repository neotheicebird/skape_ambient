## RENAMED Requirements
- FROM: `### Requirement: Base Effect Set V1.1`
- TO: `### Requirement: Base Effect Set V1.3`

- FROM: `### Requirement: Preset Schema V1.1`
- TO: `### Requirement: Preset Schema V1.3`

- FROM: `### Requirement: Performance Guardrails V1.1`
- TO: `### Requirement: Performance Guardrails V1.3`

## ADDED Requirements

### Requirement: Noise System Support V1.3
The shader system SHALL support `simplex` noise as primary, `fbm` (with up to 4 iterations), `worley` noise for cellular effects, and optional lightweight `value` noise paths.

#### Scenario: Render cellular effect with worley support
- **WHEN** a preset selects `cellular`
- **THEN** the renderer uses `worley` or equivalent cell-structure noise behavior
- **AND** fbm iteration usage remains capped at `4`

### Requirement: Texture Overlay System
The shader system SHALL support a `textureOverlay` with fields `texture`, `scale`, `intensity`, and optional `distortion`.

#### Scenario: Apply texture overlay in render pipeline
- **WHEN** a preset enables `textureOverlay`
- **THEN** a grayscale texture sample is tiled in UV space
- **AND** the sample is applied as brightness modulation
- **AND** optional distortion is applied only when configured

### Requirement: Grain Identity Layer
The shader system SHALL apply a subtle grain layer for all rendered frames with no end-user toggle.

#### Scenario: Render with always-on grain
- **WHEN** any supported preset renders a frame
- **THEN** grain is applied as a final pass
- **AND** grain intensity is controlled by global configuration constrained to `0.03` through `0.08`

## MODIFIED Requirements

### Requirement: Base Effect Set V1.3
The system SHALL support exactly five base effects in v1.3: `flow`, `gas`, `burn`, `bands`, and `cellular`.

#### Scenario: Select base effect
- **WHEN** a preset chooses a base effect
- **THEN** the value is one of `flow`, `gas`, `burn`, `bands`, or `cellular`

### Requirement: Overlay Effect Types
The system SHALL support overlay types `chromaticAberration`, `pixelGrid`, and `textureOverlay`, and SHALL NOT support deprecated overlays `liquidGlass` and procedural `ribbedGlass` in v1.3.

#### Scenario: Configure overlays in preset
- **WHEN** a preset enables overlays
- **THEN** only `chromaticAberration`, `pixelGrid`, and `textureOverlay` fields are accepted
- **AND** deprecated `liquidGlass` and procedural `ribbedGlass` fields are rejected or migrated

### Requirement: Preset Schema V1.3
Preset JSON SHALL support base effect values `flow|gas|burn|bands|cellular`, required base fields `name|palette|effect|speed|distortion|noise`, and optional `overlays` fields `chromaticAberration|pixelGrid|textureOverlay`.

#### Scenario: Validate preset schema
- **WHEN** a preset is imported or exported
- **THEN** it conforms to the v1.3 effect enum and overlay field contract

### Requirement: Creator Tool Control Model
The creator tool SHALL expose base-effect controls for `flow|gas|burn|bands|cellular` and overlay controls for `chromaticAberration|pixelGrid|textureOverlay`.

#### Scenario: Edit overlays in creator tool
- **WHEN** a developer edits a preset in the creator tool
- **THEN** supported overlay parameters can be enabled and configured from dedicated controls
- **AND** deprecated overlay controls are not shown

### Requirement: Performance Guardrails V1.3
The system SHALL enforce v1.3 performance constraints: fbm iterations <= 4, recommended active overlays <= 2, and grain intensity constrained to `0.03` through `0.08`.

#### Scenario: Validate shader performance constraints
- **WHEN** shader behavior is reviewed for release
- **THEN** implementation stays within the defined iteration, overlay, and grain limits
