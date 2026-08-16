import { describe, expect, it } from "vitest";
import {
  accessiblePrimaryForeground,
  DEFAULT_PALETTE,
  KAWAII_WHITE_PALETTE,
  MINICO_BURGUNDY_PALETTE,
  PALETTE_FIELDS,
  PALETTE_PRESETS,
  getPalettePresets,
  isLightPalette,
  normalizePalette,
  normalizePaletteOverrides,
  paletteToCssVars,
  relativeLuminance,
} from "./palette";

describe("palette overrides", () => {
  it("exposes only Primary as the editable accent", () => {
    expect(PALETTE_FIELDS).toEqual([
      {
        key: "primary",
        label: "Primary",
        hint: "The accent color used for buttons, links, and highlights",
      },
    ]);
  });

  it("normalizes primary and drops every other key", () => {
    expect(
      normalizePaletteOverrides({
        primary: " #F0C ",
        primaryForeground: "#ffffff",
        background: "#ffffff",
        surface: "#ffffff",
        card: "#ffffff",
        foreground: "#ffffff",
        mutedForeground: "#ffffff",
        border: "#ffffff",
      }),
    ).toEqual({ primary: "#ff00cc" });
  });

  it.each([null, [], "#ffffff", { primary: "invalid" }])(
    "drops malformed primary overrides %#",
    (raw) => {
      expect(normalizePaletteOverrides(raw)).toEqual({});
    },
  );

  it("chooses a contrast-safe foreground for primary fills", () => {
    expect(accessiblePrimaryForeground("#ff5c70")).toBe("#050505");
    expect(accessiblePrimaryForeground("#660c23")).toBe("#ffffff");
    expect(accessiblePrimaryForeground("#767676")).toBe("#ffffff");
  });
});

describe("getPalettePresets", () => {
  it("keeps the default palette first and unchanged", () => {
    const presets = getPalettePresets("kawaii-fashion");

    expect(presets[0]).toEqual(PALETTE_PRESETS[0]);
    expect(presets[0].palette).toEqual(DEFAULT_PALETTE);
  });

  it("replaces Daylight with Kawaii White in second place for Kawaii", () => {
    const presets = getPalettePresets("kawaii-fashion");

    expect(presets[1]).toEqual({
      id: "kawaii-white",
      name: "Kawaii White",
      palette: KAWAII_WHITE_PALETTE,
    });
    expect(presets.some((preset) => preset.id === "daylight")).toBe(false);
    expect(KAWAII_WHITE_PALETTE.primary).toBe("#f9287a");
    expect(KAWAII_WHITE_PALETTE.background).toBe("#ffffff");
    expect(isLightPalette(KAWAII_WHITE_PALETTE)).toBe(true);
  });

  it("keeps the global presets unchanged for other themes", () => {
    expect(getPalettePresets("legacy-classic")).toEqual(PALETTE_PRESETS);
    expect(PALETTE_PRESETS.some((preset) => preset.id === "daylight")).toBe(
      true,
    );
  });

  it("preserves the Kawaii palette through normalization and CSS variables", () => {
    const palette = normalizePalette(KAWAII_WHITE_PALETTE);
    const variables = paletteToCssVars(palette);

    expect(palette).toEqual(KAWAII_WHITE_PALETTE);
    expect(variables["--primary"]).toBe("#f9287a");
    expect(variables["--background"]).toBe("#ffffff");
    expect(variables["--surface"]).toBe("#fff5f8");
  });

  it("derives readable small-text accents without changing brand fills", () => {
    const variables = paletteToCssVars(MINICO_BURGUNDY_PALETTE);
    const accentLuminance = relativeLuminance(variables["--primary-readable"]);
    const backgroundLuminance = relativeLuminance(variables["--background"]);
    const contrast =
      (Math.max(accentLuminance, backgroundLuminance) + 0.05) /
      (Math.min(accentLuminance, backgroundLuminance) + 0.05);

    expect(variables["--primary"]).toBe("#660c23");
    expect(variables["--primary-readable"]).not.toBe(variables["--primary"]);
    expect(contrast).toBeGreaterThanOrEqual(4.5);
    expect(paletteToCssVars(DEFAULT_PALETTE)["--primary-readable"]).toBe(
      DEFAULT_PALETTE.primary,
    );
  });
});
