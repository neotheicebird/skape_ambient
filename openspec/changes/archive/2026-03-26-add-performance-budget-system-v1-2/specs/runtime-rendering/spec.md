## ADDED Requirements

### Requirement: Default Runtime Performance Profile
The runtime renderer SHALL use default performance settings of `30 FPS` target cap and render resolution scale `0.75`.

#### Scenario: Render with default performance settings
- **WHEN** runtime rendering starts with default configuration
- **THEN** frame production is capped to `30 FPS`
- **AND** canvas rendering uses a `0.75` internal resolution scale before display upscaling

### Requirement: Optional Internal High-Quality Mode
The runtime renderer SHALL allow an internal high-quality mode with `45 FPS` cap and render scale `1.0`, while keeping defaults unchanged.

#### Scenario: Enable high-quality internal mode
- **WHEN** internal configuration enables high-quality mode
- **THEN** frame production uses a cap of `45 FPS`
- **AND** canvas rendering uses scale `1.0`
- **AND** this mode is optional and not the default

### Requirement: Frame Loop Time Gating
The runtime renderer SHALL implement FPS throttling using `requestAnimationFrame` with elapsed-time gating.

#### Scenario: Skip frame when budgeted frame interval has not elapsed
- **WHEN** a `requestAnimationFrame` callback occurs before the configured frame interval is reached
- **THEN** the renderer skips draw work for that callback
- **AND** waits for a subsequent callback that satisfies the interval

### Requirement: Visibility-Aware Rendering Pause
The runtime renderer SHALL pause draw work when the browser tab is inactive or when the component is offscreen.

#### Scenario: Pause on inactive tab
- **WHEN** page visibility changes to hidden
- **THEN** the renderer pauses draw execution until visibility returns

#### Scenario: Pause when component is offscreen
- **WHEN** component visibility detection reports the render surface is offscreen
- **THEN** the renderer pauses draw execution until the surface returns onscreen

### Requirement: Public API Performance Guard
The public component SHALL enforce runtime performance constraints internally and SHALL NOT expose end-user performance controls in v1.2.

#### Scenario: Configure public component
- **WHEN** a website author configures the public component
- **THEN** performance runtime settings are not exposed as user-facing props
- **AND** internal defaults remain enforced by the component runtime
