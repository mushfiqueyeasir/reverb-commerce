import { describe, expect, it } from "vitest";
import {
  formatImageSize,
  IMAGE_COMPRESSION_OPTIONS,
  IMAGE_MAX_DIMENSION,
  IMAGE_MAX_SOURCE_BYTES,
  IMAGE_WEBP_QUALITY,
  optimizedImageName,
  validateImageSource,
} from "./optimizeImage";

const jpegBytes = [0xff, 0xd8, 0xff, 0xdb];
const pngBytes = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const webpBytes = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];

describe("image source validation", () => {
  it.each([
    ["photo.jpg", "image/jpeg", jpegBytes, "image/jpeg"],
    ["photo.png", "image/png", pngBytes, "image/png"],
    ["photo.webp", "image/webp", webpBytes, "image/webp"],
  ])("accepts a valid %s", async (name, type, bytes, expected) => {
    const file = new File([new Uint8Array(bytes as number[])], name, { type });
    await expect(validateImageSource(file)).resolves.toBe(expected);
  });

  it("rejects an original larger than 4 MiB", async () => {
    const file = new File(
      [new Uint8Array(jpegBytes), new Uint8Array(IMAGE_MAX_SOURCE_BYTES)],
      "large.jpg",
      { type: "image/jpeg" },
    );
    await expect(validateImageSource(file)).rejects.toThrow("larger than 4 MB");
  });

  it("accepts an original exactly 4 MiB", async () => {
    const file = new File(
      [
        new Uint8Array(jpegBytes),
        new Uint8Array(IMAGE_MAX_SOURCE_BYTES - jpegBytes.length),
      ],
      "limit.jpg",
      { type: "image/jpeg" },
    );
    await expect(validateImageSource(file)).resolves.toBe("image/jpeg");
  });

  it("rejects HEIC with a clear conversion message", async () => {
    const file = new File([new Uint8Array(16)], "phone.heic", {
      type: "image/heic",
    });
    await expect(validateImageSource(file)).rejects.toThrow(
      "Convert the image to JPG, PNG, or WebP",
    );
  });

  it("rejects a MIME type that does not match the bytes", async () => {
    const file = new File([new Uint8Array(pngBytes)], "fake.jpg", {
      type: "image/jpeg",
    });
    await expect(validateImageSource(file)).rejects.toThrow(
      "does not match its declared image type",
    );
  });
});

describe("image optimization settings", () => {
  it("uses a quality-first WebP preset", () => {
    expect(IMAGE_WEBP_QUALITY).toBe(0.9);
    expect(IMAGE_MAX_DIMENSION).toBe(2200);
    expect(IMAGE_COMPRESSION_OPTIONS).toMatchObject({
      mimeType: "image/webp",
      maxWidth: 2200,
      maxHeight: 2200,
      quality: 0.9,
      retainExif: false,
      strict: false,
    });
    expect(IMAGE_COMPRESSION_OPTIONS).not.toHaveProperty("maxSizeMB");
  });

  it("creates safe WebP names", () => {
    expect(optimizedImageName("Café Racer / Black", 2)).toBe(
      "cafe-racer-black-2.webp",
    );
    expect(optimizedImageName("***")).toBe("image.webp");
  });

  it("formats source and output sizes", () => {
    expect(formatImageSize(820 * 1024)).toBe("820 KB");
    expect(formatImageSize(3.4 * 1024 * 1024)).toBe("3.4 MB");
  });
});
