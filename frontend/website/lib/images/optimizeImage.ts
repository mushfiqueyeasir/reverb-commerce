export const IMAGE_MAX_SOURCE_BYTES = 4 * 1024 * 1024;
export const IMAGE_MAX_OUTPUT_BYTES = 4 * 1024 * 1024;
export const IMAGE_MAX_DIMENSION = 2200;
export const IMAGE_WEBP_QUALITY = 0.9;
export const OPTIMIZED_IMAGE_MIME = "image/webp";

const HEIC_TYPES = new Set(["image/heic", "image/heif"]);
const HEIC_EXTENSIONS = new Set(["heic", "heif"]);

export const IMAGE_COMPRESSION_OPTIONS = {
  quality: IMAGE_WEBP_QUALITY,
  maxWidth: IMAGE_MAX_DIMENSION,
  maxHeight: IMAGE_MAX_DIMENSION,
  mimeType: OPTIMIZED_IMAGE_MIME,
  checkOrientation: true,
  retainExif: false,
  strict: false,
  convertSize: Number.POSITIVE_INFINITY,
} as const;

type SupportedImageMime = "image/jpeg" | "image/png" | "image/webp";

export interface OptimizeImageOptions {
  outputName: string;
}

export interface OptimizedImage {
  file: File;
  originalSize: number;
  optimizedSize: number;
}

export class ImageOptimizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageOptimizationError";
  }
}

const extensionOf = (name: string) =>
  name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";

const ascii = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.slice(start, end));

async function detectImageMime(
  file: File,
): Promise<SupportedImageMime | "heic" | null> {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") {
    return "image/webp";
  }
  if (ascii(bytes, 4, 8) === "ftyp") {
    const brand = ascii(bytes, 8, 12).toLowerCase();
    if (["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(brand)) {
      return "heic";
    }
  }
  return null;
}

export async function validateImageSource(
  file: File,
): Promise<SupportedImageMime> {
  if (!file.size) {
    throw new ImageOptimizationError(`${file.name || "The image"} is empty.`);
  }
  if (file.size > IMAGE_MAX_SOURCE_BYTES) {
    throw new ImageOptimizationError(
      `${file.name} is larger than 4 MB. Choose a smaller image.`,
    );
  }

  const extension = extensionOf(file.name);
  if (
    HEIC_TYPES.has(file.type.toLowerCase()) ||
    HEIC_EXTENSIONS.has(extension)
  ) {
    throw new ImageOptimizationError(
      "HEIC/HEIF images are not supported reliably. Convert the image to JPG, PNG, or WebP first.",
    );
  }

  const detectedMime = await detectImageMime(file);
  if (detectedMime === "heic") {
    throw new ImageOptimizationError(
      "HEIC/HEIF images are not supported reliably. Convert the image to JPG, PNG, or WebP first.",
    );
  }
  if (!detectedMime) {
    throw new ImageOptimizationError(
      `${file.name} is not a valid JPG, PNG, or WebP image.`,
    );
  }

  const declaredMime = file.type.toLowerCase();
  const normalizedDeclaredMime =
    declaredMime === "image/jpg" ? "image/jpeg" : declaredMime;
  if (normalizedDeclaredMime && normalizedDeclaredMime !== detectedMime) {
    throw new ImageOptimizationError(
      `${file.name} does not match its declared image type.`,
    );
  }

  return detectedMime;
}

export function optimizedImageName(prefix: string, position?: number): string {
  const stem = prefix
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = position == null ? "" : `-${position}`;
  return `${stem || "image"}${suffix}.webp`;
}

export function formatImageSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function optimizeImage(
  source: File,
  { outputName }: OptimizeImageOptions,
): Promise<OptimizedImage> {
  const detectedMime = await validateImageSource(source);
  const normalizedSource =
    source.type === detectedMime
      ? source
      : new File([source], source.name, {
          type: detectedMime,
          lastModified: source.lastModified,
        });

  const { default: Compressor } = await import("compressorjs");
  let output: Blob;
  try {
    output = await new Promise<Blob>((resolve, reject) => {
      new Compressor(normalizedSource, {
        ...IMAGE_COMPRESSION_OPTIONS,
        success: resolve,
        error: reject,
      });
    });
  } catch {
    throw new ImageOptimizationError(
      `${source.name} could not be optimized. Try another JPG, PNG, or WebP image.`,
    );
  }

  if (!output.size || output.type !== OPTIMIZED_IMAGE_MIME) {
    throw new ImageOptimizationError(
      "This browser could not create a WebP image. Try a current version of Chrome, Edge, Firefox, or Safari.",
    );
  }
  if (output.size > IMAGE_MAX_OUTPUT_BYTES) {
    throw new ImageOptimizationError(
      `${source.name} could not be optimized below 4 MB without reducing quality. Try a smaller image.`,
    );
  }

  return {
    file: new File([output], outputName, {
      type: OPTIMIZED_IMAGE_MIME,
      lastModified: source.lastModified,
    }),
    originalSize: source.size,
    optimizedSize: output.size,
  };
}
