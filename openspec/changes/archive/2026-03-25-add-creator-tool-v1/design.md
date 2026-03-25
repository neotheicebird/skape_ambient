## Context
The creator tool is an internal utility for generating high-quality preset JSON files. It prioritizes fast iteration and correctness over polished UX.

## Goals / Non-Goals
- Goals:
  - Real-time preview using shared shader logic.
  - Full authoring controls for all preset parameters.
  - Reliable JSON export compatible with downstream consumption.
  - Reliable JSON import for editing existing presets.
- Non-Goals:
  - Public-facing UI polish.
  - Framer property controls or component packaging in this change.

## Decisions
- Decision: Use React for control surface and canvas orchestration.
- Decision: Keep preset schema strict and explicit with fixed effect enum (`flow|liquid|burn`).
- Decision: Load palettes only from `.hex` palette files in a dedicated project folder (path finalized during implementation, e.g. `/palettes/hex`).
- Decision: Persist presets as one JSON file per preset under `/presets/free` or `/presets/pro`.
- Alternatives considered:
  - Bundled preset file only: rejected for poorer authoring modularity.
  - Runtime-generated presets: rejected to keep outputs deterministic and reviewable.

## Risks / Trade-offs
- Shader preview fidelity may diverge from final consumer if shader code forks.
  - Mitigation: keep core shader logic in shared module.
- Manual preset editing outside tool may introduce invalid values.
  - Mitigation: validate on load and on export.
- Palette-dependent implementation can block when source files are unavailable.
  - Mitigation: add explicit manual-user-input checkpoint; agent requests `.hex` files before validation.

## Migration Plan
1. Land creator-tool implementation behind internal-only entrypoint.
2. Seed initial free preset set via tool exports.
3. Reuse preset contract unchanged in the future Framer component.

## Open Questions
- Should pro presets be authored in the same workspace or separated repository at release time?
