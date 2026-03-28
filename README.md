# Skape Ambient

Skape Ambient is a WebGL gradient system with:

- an internal preset authoring app (`creator-tool/`)
- a public Framer code component (`SkapeAmbient.tsx`)

This repository is intended to let you edit presets locally and ship the public component from GitHub.

## Repository Layout

- `SkapeAmbient.tsx`: public Framer component (drop-in file)
- `creator-tool/`: internal React + Vite tool for authoring presets
- `presets/`: exported preset JSON files
- `creator-tool/palettes/hex/`: `.hex` palette sources
- `releases/public-component-v1.0.0/`: release bundle for public component distribution

## Use The Public Component In Framer

1. Open your Framer project.
2. Create a new Code File.
3. Paste `SkapeAmbient.tsx` from this repo.
4. Insert `SkapeAmbient` from Assets.
5. Select a preset from the `Preset` dropdown.

Expected behavior:

- default frame size is `400x400`
- frame is resizable (not fit-content locked)
- component fills the assigned frame

## Build The Creator Tool Locally

Requirements:

- Node.js 18+
- npm 9+

Commands:

```bash
cd creator-tool
npm install
npm run dev
```

Other commands:

```bash
npm run build
npm run test
```

## Presets And Palettes

Palette files:

- place `.hex` files in `creator-tool/palettes/hex/`
- reload palettes from the creator tool UI

Preset files:

- free tier: `presets/free/`
- pro tier: `presets/pro/`

## Public Component Release Bundle

Current public release bundle:

- `releases/public-component-v1.0.0/SkapeAmbient.tsx`
- `releases/public-component-v1.0.0/RELEASE_NOTES.md`

For marketplace release updates:

1. Update `SkapeAmbient.tsx`.
2. Create a new `releases/public-component-vX.Y.Z/` folder.
3. Copy the component file and add release notes.
4. Tag the commit in git (example: `public-component-vX.Y.Z`).

