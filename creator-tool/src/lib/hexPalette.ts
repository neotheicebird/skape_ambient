import type { Palette } from "../types";

export function normalizeHexToken(token: string): string {
  const compact = token.trim().replace(/^\uFEFF/, "").replace(/^#/, "").toUpperCase();
  if (/^[0-9A-F]{3}$/.test(compact)) {
    return `#${compact
      .split("")
      .map((char) => char + char)
      .join("")}`;
  }
  if (/^[0-9A-F]{6}$/.test(compact)) {
    return `#${compact}`;
  }
  throw new Error(`Invalid hex color token: ${token}`);
}

export function parseHexPalette(content: string, paletteName: string): Palette {
  const tokens: string[] = [];
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.split("//")[0]?.split(";")[0]?.trim() ?? "";
    if (!line) {
      continue;
    }

    const pieces = line.split(/[\s,]+/).map((part) => part.trim()).filter(Boolean);
    tokens.push(...pieces);
  }

  if (tokens.length === 0) {
    throw new Error(`Palette ${paletteName} has no colors.`);
  }

  const colors = tokens.map(normalizeHexToken);

  return {
    name: paletteName,
    colors
  };
}

export async function loadProjectHexPalettes(): Promise<{ palettes: Palette[]; errors: string[] }> {
  const files = {
    ...(import.meta.glob("../../palettes/hex/*.hex", {
      eager: true,
      query: "?raw",
      import: "default"
    }) as Record<string, string>),
    ...(import.meta.glob("../../palettes/hex/*.HEX", {
      eager: true,
      query: "?raw",
      import: "default"
    }) as Record<string, string>),
    ...(import.meta.glob("/palettes/hex/*.hex", {
      eager: true,
      query: "?raw",
      import: "default"
    }) as Record<string, string>),
    ...(import.meta.glob("/palettes/hex/*.HEX", {
      eager: true,
      query: "?raw",
      import: "default"
    }) as Record<string, string>)
  };

  const errors: string[] = [];
  const palettes: Palette[] = [];

  for (const [path, raw] of Object.entries(files)) {
    const lastSegment = path.split("/").pop() ?? path;
    const fileName = lastSegment.split("?")[0] ?? lastSegment;
    const paletteName = fileName.replace(/\.hex$/i, "");
    try {
      palettes.push(parseHexPalette(raw, paletteName));
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown parse error";
      errors.push(`${fileName}: ${reason}`);
    }
  }

  palettes.sort((a, b) => a.name.localeCompare(b.name));

  if (palettes.length === 0) {
    errors.push(
      "No .hex palettes found in creator-tool/palettes/hex. Checked relative and absolute palette globs. Restart dev server after adding files."
    );
  }

  return { palettes, errors };
}
