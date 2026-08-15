export interface ThemePalette {
  primary: string;
  primaryForeground: string;
  background: string;
  surface: string;
  card: string;
  foreground: string;
  mutedForeground: string;
  border: string;
}

export const DEFAULT_PALETTE: ThemePalette = {
  primary: "#ff5c70",
  primaryForeground: "#050505",
  background: "#050505",
  surface: "#111111",
  card: "#161616",
  foreground: "#f5f3ef",
  mutedForeground: "#9a9a9a",
  border: "#2a2a2a",
};

export type ThemePaletteOverrides = Partial<Pick<ThemePalette, "primary">>;

export interface PalettePreset {
  id: string;
  name: string;
  palette: ThemePalette;
}

export const KAWAII_WHITE_PALETTE: ThemePalette = {
  primary: "#f9287a",
  primaryForeground: "#050505",
  background: "#ffffff",
  surface: "#fff5f8",
  card: "#ffffff",
  foreground: "#241018",
  mutedForeground: "#73545f",
  border: "#f2d9e2",
};

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: "default",
    name: "Default",
    palette: { ...DEFAULT_PALETTE },
  },
  {
    id: "midnight",
    name: "Midnight",
    palette: {
      primary: "#5b8cff",
      primaryForeground: "#050505",
      background: "#06080f",
      surface: "#101522",
      card: "#161d2e",
      foreground: "#eef2ff",
      mutedForeground: "#8b95b0",
      border: "#2a3348",
    },
  },
  {
    id: "ember",
    name: "Ember",
    palette: {
      primary: "#ff7a3d",
      primaryForeground: "#050505",
      background: "#0a0705",
      surface: "#16100c",
      card: "#1c1410",
      foreground: "#f7efe8",
      mutedForeground: "#a89888",
      border: "#332820",
    },
  },
  {
    id: "moss",
    name: "Moss",
    palette: {
      primary: "#6fbf7a",
      primaryForeground: "#050505",
      background: "#060806",
      surface: "#101610",
      card: "#151c15",
      foreground: "#eef5ee",
      mutedForeground: "#8fa08f",
      border: "#283028",
    },
  },
  {
    id: "daylight",
    name: "Daylight",
    palette: {
      primary: "#e11d48",
      primaryForeground: "#ffffff",
      background: "#f6f5f2",
      surface: "#ffffff",
      card: "#ffffff",
      foreground: "#171717",
      mutedForeground: "#6b6b6b",
      border: "#e2e0db",
    },
  },
];

export function getPalettePresets(themeId: string): PalettePreset[] {
  if (themeId !== "kawaii-fashion") return PALETTE_PRESETS;
  return [
    PALETTE_PRESETS[0],
    {
      id: "kawaii-white",
      name: "Kawaii White",
      palette: { ...KAWAII_WHITE_PALETTE },
    },
    ...PALETTE_PRESETS.slice(1).filter((preset) => preset.id !== "daylight"),
  ];
}

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function normalizeHex(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const v = value.trim();
  if (!HEX_RE.test(v)) return fallback;
  if (v.length === 4) {
    const [, r, g, b] = v;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return v.toLowerCase();
}

export function normalizePaletteOverrides(raw: unknown): ThemePaletteOverrides {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const primary = (raw as Record<string, unknown>).primary;
  if (typeof primary !== "string" || !HEX_RE.test(primary.trim())) return {};
  return { primary: normalizeHex(primary, DEFAULT_PALETTE.primary) };
}

export function normalizePalette(raw: unknown): ThemePalette {
  const o =
    raw && typeof raw === "object" ? (raw as Partial<ThemePalette>) : {};
  return {
    primary: normalizeHex(o.primary, DEFAULT_PALETTE.primary),
    primaryForeground: normalizeHex(
      o.primaryForeground,
      DEFAULT_PALETTE.primaryForeground,
    ),
    background: normalizeHex(o.background, DEFAULT_PALETTE.background),
    surface: normalizeHex(o.surface, DEFAULT_PALETTE.surface),
    card: normalizeHex(o.card, DEFAULT_PALETTE.card),
    foreground: normalizeHex(o.foreground, DEFAULT_PALETTE.foreground),
    mutedForeground: normalizeHex(
      o.mutedForeground,
      DEFAULT_PALETTE.mutedForeground,
    ),
    border: normalizeHex(o.border, DEFAULT_PALETTE.border),
  };
}

/** Convert `#rrggbb` → `"r, g, b"` for `rgb(var(--x) / a)` usage. */
export function hexToRgbChannels(hex: string): string {
  const normalized = normalizeHex(hex, DEFAULT_PALETTE.primary).slice(1);
  const n = Number.parseInt(normalized, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `${r}, ${g}, ${b}`;
}

/** Relative luminance 0–1 (WCAG). */
export function relativeLuminance(hex: string): number {
  const normalized = normalizeHex(hex, DEFAULT_PALETTE.background).slice(1);
  const n = Number.parseInt(normalized, 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** True when the palette background is light (e.g. Daylight). */
export function isLightPalette(
  palette: ThemePalette | null | undefined,
): boolean {
  return relativeLuminance(normalizePalette(palette).background) > 0.45;
}

/** CSS custom properties applied on `:root` for the whole app. */
export function paletteToCssVars(
  palette: ThemePalette,
): Record<string, string> {
  const p = normalizePalette(palette);
  const primaryRgb = hexToRgbChannels(p.primary);
  const foregroundRgb = hexToRgbChannels(p.foreground);
  const backgroundRgb = hexToRgbChannels(p.background);
  const v2PrimaryRgb = primaryRgb.replaceAll(",", "");
  const v2ForegroundRgb = foregroundRgb.replaceAll(",", "");
  const v2BackgroundRgb = backgroundRgb.replaceAll(",", "");
  return {
    "--background": p.background,
    "--surface": p.surface,
    "--foreground": p.foreground,
    "--muted-fg": p.mutedForeground,
    "--accent-coral": p.primary,
    "--border-soft": p.border,
    "--primary": p.primary,
    "--primary-rgb": primaryRgb,
    "--foreground-rgb": foregroundRgb,
    "--background-rgb": backgroundRgb,
    "--v2-primary-rgb": v2PrimaryRgb,
    "--v2-foreground-rgb": v2ForegroundRgb,
    "--v2-background-rgb": v2BackgroundRgb,
    "--color-primary-base": p.primary,
    "--color-primary-foreground-base": p.primaryForeground,
    "--primary-foreground": p.primaryForeground,
    "--secondary": p.surface,
    "--secondary-foreground": p.foreground,
    "--card": p.card,
    "--card-foreground": p.foreground,
    "--popover": p.card,
    "--popover-foreground": p.foreground,
    "--muted": p.surface,
    "--muted-foreground": p.mutedForeground,
    "--accent": p.primary,
    "--accent-foreground": p.primaryForeground,
    "--border": p.border,
    "--input": p.surface,
    "--ring": p.primary,
    "--chart-1": p.primary,
    "--chart-2": p.foreground,
    "--chart-3": p.mutedForeground,
    "--chart-4": p.border,
    "--chart-5": p.card,
    // Surface gives the sidebar slight contrast vs page background on every preset
    // (including Daylight: cream page + white sidebar).
    "--sidebar": p.surface,
    "--sidebar-foreground": p.foreground,
    "--sidebar-primary": p.primary,
    "--sidebar-primary-foreground": p.primaryForeground,
    "--sidebar-accent": p.card,
    "--sidebar-accent-foreground": p.foreground,
    "--sidebar-border": p.border,
    "--sidebar-ring": p.primary,
    "--color-coral": p.primary,
  };
}

export const PALETTE_FIELDS: {
  key: keyof ThemePaletteOverrides;
  label: string;
  hint: string;
}[] = [
  {
    key: "primary",
    label: "Primary",
    hint: "The accent color used for buttons, links, and highlights",
  },
];
