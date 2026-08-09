import { createHash, randomBytes } from "node:crypto";
import { deflateSync } from "node:zlib";

export class HttpError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

export function maskSecret(value) {
  if (value && process.env.GITHUB_ACTIONS === "true") {
    console.log(`::add-mask::${value}`);
  }
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function sqlLiteral(value) {
  const text = String(value ?? "");
  if (text.includes("\0"))
    throw new Error("SQL template values cannot contain null bytes");
  return `'${text.replaceAll("'", "''")}'`;
}

export function renderSqlTemplate(template, values) {
  return template.replace(/__([A-Z][A-Z0-9_]*)__/g, (marker, name) => {
    if (!Object.hasOwn(values, name)) {
      throw new Error(`Unresolved SQL template value: ${marker}`);
    }
    return sqlLiteral(values[name]);
  });
}

export function normalizeHttpsUrl(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash
  ) {
    throw new Error(`${label} must be a plain HTTPS URL`);
  }
  if (url.pathname !== "/") throw new Error(`${label} cannot include a path`);
  return `https://${url.hostname.toLowerCase()}`;
}

export function validateClientId(value) {
  if (value.length > 70 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error("CLIENT_ID must be kebab-case");
  }
  return value;
}

function titleFromClientId(clientId) {
  return clientId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function deriveStoreDefaults(siteUrl, clientExists = () => false) {
  const hostname = new URL(siteUrl).hostname.toLowerCase();
  const withoutWww = hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  const labels = withoutWww.split(".").filter(Boolean);
  if (labels.length < 2) throw new Error("SITE_URL must use a public domain");

  let clientId = labels[0].replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  if (clientExists(clientId)) {
    clientId = withoutWww.replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  }

  const aliasUrl = hostname.startsWith("www.")
    ? `https://${withoutWww}`
    : labels.length === 2
      ? `https://www.${hostname}`
      : "";
  return {
    clientId: validateClientId(clientId),
    displayName: titleFromClientId(clientId),
    aliasUrl,
    contactEmail: `support@${withoutWww}`,
  };
}

export function generateDatabasePassword() {
  return `${randomBytes(24).toString("base64url")}Aa1!`;
}

export async function requestJson(
  url,
  { token, method = "GET", body, expected = [200] } = {},
) {
  const attempts = method === "GET" ? 3 : 1;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        method,
        signal: AbortSignal.timeout(30_000),
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const text = await response.text();
      let parsed = null;
      if (text) {
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = { message: text.slice(0, 500) };
        }
      }
      if (expected.includes(response.status)) return parsed;
      if (
        attempt < attempts &&
        (response.status === 429 || response.status >= 500)
      ) {
        await sleep(500 * 2 ** (attempt - 1));
        continue;
      }
      const message =
        parsed?.message || parsed?.error || `HTTP ${response.status}`;
      throw new HttpError(String(message), response.status, parsed);
    } catch (error) {
      if (error instanceof HttpError || attempt === attempts) throw error;
      await sleep(500 * 2 ** (attempt - 1));
    }
  }
  throw new Error(`Request failed: ${url}`);
}

export function responseRows(response) {
  if (Array.isArray(response)) return response;
  for (const key of ["data", "result", "rows"]) {
    if (Array.isArray(response?.[key])) return response[key];
  }
  return [];
}

export function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  typeBuffer.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(
    crc32(Buffer.concat([typeBuffer, data])),
    8 + data.length,
  );
  return output;
}

export function createPlaceholderPng(width, height, colors) {
  const [background, accent, highlight] = colors;
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * stride;
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const diagonal =
        (x + y * 2) % Math.max(48, Math.floor(width / 4)) <
        Math.max(12, Math.floor(width / 24));
      const center =
        x > width * 0.28 &&
        x < width * 0.72 &&
        y > height * 0.28 &&
        y < height * 0.72;
      const color = center ? highlight : diagonal ? accent : background;
      const offset = row + 1 + x * 4;
      raw[offset] = color[0];
      raw[offset + 1] = color[1];
      raw[offset + 2] = color[2];
      raw[offset + 3] = 255;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

export function buildPlaceholderAssets() {
  const palettes = {
    dark: [
      [20, 22, 28],
      [46, 50, 62],
      [236, 181, 65],
    ],
    warm: [
      [228, 220, 204],
      [190, 150, 101],
      [39, 42, 47],
    ],
    blue: [
      [24, 45, 67],
      [41, 87, 120],
      [219, 231, 237],
    ],
    green: [
      [29, 55, 46],
      [58, 103, 80],
      [224, 211, 163],
    ],
  };
  return [
    ["branding", "store-template/v1/logo.png", 640, 240, palettes.dark],
    ["branding", "store-template/v1/invoice-logo.png", 640, 240, palettes.dark],
    ["branding", "store-template/v1/favicon.png", 128, 128, palettes.dark],
    ["branding", "store-template/v1/og-image.png", 1200, 630, palettes.dark],
    [
      "banner-images",
      "store-template/v1/home/hero-desktop.png",
      1600,
      900,
      palettes.dark,
    ],
    [
      "banner-images",
      "store-template/v1/home/hero-mobile.png",
      900,
      1200,
      palettes.dark,
    ],
    [
      "category-images",
      "store-template/v1/categories/apparel.png",
      900,
      1100,
      palettes.warm,
    ],
    [
      "category-images",
      "store-template/v1/categories/accessories.png",
      900,
      1100,
      palettes.blue,
    ],
    [
      "product-images",
      "store-template/v1/products/essential-tee-01.png",
      1000,
      1200,
      palettes.warm,
    ],
    [
      "product-images",
      "store-template/v1/products/essential-tee-02.png",
      1000,
      1200,
      palettes.dark,
    ],
    [
      "product-images",
      "store-template/v1/products/daypack-01.png",
      1000,
      1200,
      palettes.blue,
    ],
    [
      "product-images",
      "store-template/v1/products/daypack-02.png",
      1000,
      1200,
      palettes.green,
    ],
    [
      "promotion-images",
      "store-template/v1/promotions/welcome-offer.png",
      1200,
      700,
      palettes.green,
    ],
    [
      "review-images",
      "store-template/v1/reviews/sample-review.png",
      800,
      800,
      palettes.warm,
    ],
  ].map(([bucket, path, width, height, palette]) => ({
    bucket,
    path,
    content: createPlaceholderPng(width, height, palette),
  }));
}
