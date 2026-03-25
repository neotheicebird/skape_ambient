# Change: Add Creator Tool V1

## Why
Skape Ambient needs an internal, spec-first tool to create and refine ambient presets before exposing them through the public component. This change establishes the creator workflow and preset contract so preset production can start immediately.

## What Changes
- Add a new `creator-tool` capability for internal preset authoring.
- Define live shader preview behavior and full parameter controls.
- Define palette ingestion from `.hex` palette files stored in a project folder.
- Define preset create/edit/rename/import/export flow.
- Define JSON preset contract and storage rules under `/presets/`.
- Define guardrails so creator output remains compatible with the future component.
- Define manual input checkpoints where the agent must request user action for adding new `.hex` palette files.

## Impact
- Affected specs: `creator-tool` (new)
- Affected code:
  - Creator app scaffold (React + WebGL)
  - Shared preset schema/types
  - Palette loader/parser for `.hex` palette files
  - Preset file IO utilities
