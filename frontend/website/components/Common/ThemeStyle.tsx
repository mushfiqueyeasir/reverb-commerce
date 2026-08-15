import type { ThemeSemanticTokens } from "@/lib/theme/manifest";
import {
  isLightPalette,
  normalizePalette,
  paletteToCssVars,
} from "@/lib/theme/palette";

export function themeTokensToCssVars(
  tokens: ThemeSemanticTokens,
): Record<string, string> {
  return {
    ...paletteToCssVars(tokens.palette),
    "--theme-radius-sm": tokens.shape.radius.sm,
    "--theme-radius-md": tokens.shape.radius.md,
    "--theme-radius-lg": tokens.shape.radius.lg,
    "--theme-radius-xl": tokens.shape.radius.xl,
    "--theme-radius-2xl": tokens.shape.radius["2xl"],
    "--theme-radius-3xl": tokens.shape.radius["3xl"],
    "--theme-radius-full": tokens.shape.radius.full,
  };
}

export default function ThemeStyle({
  tokens,
}: {
  tokens: ThemeSemanticTokens;
}) {
  const normalized = normalizePalette(tokens.palette);
  const vars = themeTokensToCssVars({ ...tokens, palette: normalized });
  const scheme = isLightPalette(normalized) ? "light" : "dark";
  const css = Object.entries(vars)
    .map(([key, value]) => `${key}:${value}`)
    .join(";");

  return (
    <style
      // Applied globally — must stay in <head>/<body> for cascade into all trees
      dangerouslySetInnerHTML={{
        __html: `:root{color-scheme:${scheme};${css}}`,
      }}
    />
  );
}
