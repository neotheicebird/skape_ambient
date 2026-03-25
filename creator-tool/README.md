# Creator Tool

Internal React + WebGL utility for building Skape Ambient presets.

## Manual checkpoint

Before validating palettes in the app, add one or more `.hex` files to:

- `creator-tool/palettes/hex/`

Then reload the app and click **Reload .hex palettes**.

## Local run

```bash
cd creator-tool
npm install
npm run dev
```

## Export workflow

1. Edit a preset in the tool.
2. Choose `free` or `pro` tier.
3. Click **Select presets directory** and choose project `presets/`.
4. Click **Export selected preset JSON**.
5. If browser direct save is unavailable, use downloaded fallback and move file into:
   - `presets/free/` or
   - `presets/pro/`

## Load existing presets

- Click **Load preset JSON** in Preset Library.
- Choose a preset JSON file.
- The tool imports it into the current session and selects it for editing.
