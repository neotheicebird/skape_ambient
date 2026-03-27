## MODIFIED Requirements

### Requirement: Default Runtime Performance Profile
The internal creator runtime renderer SHALL use default performance settings of `30 FPS` target cap and render resolution scale `0.75`.

#### Scenario: Render internal runtime with default performance settings
- **WHEN** internal creator-tool runtime rendering starts with default configuration
- **THEN** frame production is capped to `30 FPS`
- **AND** canvas rendering uses a `0.75` internal resolution scale before display upscaling

## ADDED Requirements

### Requirement: Resolution-Independent Public Framer Rendering
The public Framer component SHALL render as a continuous field, where resizing reveals more or less field content instead of stretching previously sampled output.

#### Scenario: Resize public component frame
- **WHEN** the public Framer component dimensions change
- **THEN** the drawing buffer dimensions are updated to match the component display size
- **AND** rendering reveals more or less horizontal/vertical field area based on frame shape
- **AND** sampled content is not stretched to fit

### Requirement: Public Shader Resolution and UV Basis
The public Framer shader runtime SHALL drive viewport and resolution uniforms from current canvas drawing-buffer dimensions and SHALL use centered field-space UV coordinates.

#### Scenario: Render a frame in public component
- **WHEN** the public Framer component draws a frame
- **THEN** `gl.viewport` uses `canvas.width` and `canvas.height`
- **AND** `u_resolution` is set to `[canvas.width, canvas.height]`
- **AND** UV coordinates are derived from `(gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y`

### Requirement: Public Animation Time Stability Across Sizes
The public Framer component SHALL keep animation progression dependent on elapsed time and not on frame dimensions.

#### Scenario: Resize while animation is running
- **WHEN** the component is resized during active animation
- **THEN** animation timing continues smoothly from elapsed time
- **AND** no resolution-dependent time offsets are introduced
