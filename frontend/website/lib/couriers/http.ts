import "server-only";

export class CourierApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
  }
}

function apiMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const data = body as Record<string, unknown>;
  for (const key of ["message", "error", "error_message"]) {
    if (typeof data[key] === "string" && data[key]) return data[key];
  }
  if (data.errors && typeof data.errors === "object") {
    return JSON.stringify(data.errors);
  }
  return null;
}

export async function courierFetch<T>(
  url: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new CourierApiError(
      apiMessage(body) ?? `Courier API request failed (${response.status}).`,
      response.status,
      body,
    );
  }
  return body as T;
}
