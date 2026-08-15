import { describe, expect, it } from "vitest";
import {
  DEFAULT_PALETTE,
  KAWAII_WHITE_PALETTE,
  PALETTE_FIELDS,
  PALETTE_PRESETS,
  getPalettePresets,
  isLightPalette,
  normalizePalette,
  normalizePaletteOverrides,
  paletteToCssVars,
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
});

describe("getPalettePresets", () => {
  it("keeps the default palette first and unchanged", () => {
    const presets = getPalettePresets("https://kawaii.com.bd");

    expect(presets[0]).toEqual(PALETTE_PRESETS[0]);
    expect(presets[0].palette).toEqual(DEFAULT_PALETTE);
  });

  it("replaces Daylight with Kawaii White in second place for Kawaii", () => {
    const presets = getPalettePresets("https://kawaii.com.bd");

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

  it("keeps the global presets unchanged for other clients", () => {
    expect(getPalettePresets("https://vegear.com.bd")).toEqual(PALETTE_PRESETS);
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
});
