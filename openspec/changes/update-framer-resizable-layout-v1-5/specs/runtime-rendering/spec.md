## ADDED Requirements

### Requirement: Public Framer Layout Resizability
The public Framer component SHALL declare support for arbitrary layout width and height with fixed-size preference metadata and SHALL behave as a layout-driven container component.

#### Scenario: Add component to Framer canvas
- **WHEN** a website author inserts the public Framer component
- **THEN** the component supports free width and height resizing
- **AND** layout metadata prefers fixed sizing on insert rather than intrinsic fit-content
- **AND** the component is not constrained to intrinsic `fit content` sizing behavior

### Requirement: Public Framer Default Frame Dimensions
The public Framer component SHALL provide default dimensions of approximately `400x400` when first inserted using default props and intrinsic metadata.

#### Scenario: Insert component with defaults
- **WHEN** a website author adds the public Framer component without custom sizing
- **THEN** default width is `400`
- **AND** default height is `400`

### Requirement: Style-Forwarded Container Composition
The public Framer component SHALL render through a wrapper container that forwards Framer style props and owns layout sizing, while the canvas fills that container.

#### Scenario: Parent layout controls component size
- **WHEN** Framer applies layout styles to the component
- **THEN** the wrapper container applies incoming style props
- **AND** wrapper dimensions resolve to `100%` width and `100%` height of the assigned frame
- **AND** the canvas fills the wrapper without introducing intrinsic component sizing
