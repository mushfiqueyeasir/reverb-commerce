import { describe, expect, it } from "vitest";
import { getInvoicePrintColors } from "./invoicePdf";

function luminance(rgb: [number, number, number]) {
  const channels = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: [number, number, number], b: [number, number, number]) {
  const light = Math.max(luminance(a), luminance(b));
  const dark = Math.min(luminance(a), luminance(b));
  return (light + 0.05) / (dark + 0.05);
}

describe("invoice print colors", () => {
  it("always uses a white page and dark print text", () => {
    const colors = getInvoicePrintColors("#ff5c70");

    expect(colors.background).toEqual([255, 255, 255]);
    expect(colors.foreground).toEqual([17, 24, 39]);
    expect(colors.surface.every((channel) => channel >= 247)).toBe(true);
  });

  it("darkens bright theme colors to a printable contrast", () => {
    const colors = getInvoicePrintColors("#ffff00");

    expect(contrast(colors.primary, colors.background)).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(colors.primaryForeground).toEqual([255, 255, 255]);
  });

  it("preserves an already print-safe dark accent", () => {
    expect(getInvoicePrintColors("#1d4ed8").primary).toEqual([29, 78, 216]);
  });
});
