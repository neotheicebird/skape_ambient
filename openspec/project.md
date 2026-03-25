# Project Context

## Purpose

Skape Ambient repository baseline. This project follows spec-first development using OpenSpec.

## Tech Stack

- TBD (define per approved OpenSpec change proposal)

## Project Conventions

### Code Style

- Keep implementations simple and explicit.
- Prefer small, reviewable changes.
- Add comments only for non-obvious logic.

### Architecture Patterns

- Define architecture decisions in OpenSpec `design.md` when changes are cross-cutting or complex.
- Keep capabilities isolated and documented in `openspec/specs/<capability>/spec.md`.

### Testing Strategy

- Every implementation change should include verification steps in the related change `tasks.md`.
- Add or update tests for behavior introduced or modified by approved proposals.

### Git Workflow

- Work from small, focused branches.
- Use descriptive commit messages with context.
- Do not implement before proposal approval.

## Important Constraints

- Spec-first workflow is mandatory.
- No implementation work starts until the corresponding OpenSpec proposal is approved.
- Keep `openspec/specs/` (built behavior) and `openspec/changes/` (proposed behavior) in sync.

## External Dependencies

- OpenSpec CLI available in developer environment.
