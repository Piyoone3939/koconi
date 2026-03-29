type Primitive = string | number | boolean;

type QueryValue = Primitive | null | undefined;

type RequestOptions = {
  method?: "GET" | "POST";
  headers?: HeadersInit;
  body?: BodyInit | null;
  query?: Record<string, QueryValue>;
  timeoutMs?: number;
};

export class HttpError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.payload = payload;
  }
}

export class HttpClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = normalizeBaseUrl(baseUrl);
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = new URL(normalizePath(path), this.baseUrl);

    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value === undefined || value === null) {
          continue;
        }
        url.searchParams.set(key, String(value));
      }
    }

    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? 10_000;
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: options.method ?? "GET",
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (controller.signal.aborted) {
        throw new Error(`Network timed out (${timeoutMs}ms): ${url.toString()}`);
      }
      throw new Error(`Network request failed: ${url.toString()} (${message})`);
    } finally {
      clearTimeout(timeoutId);
    }

    const payload = await this.readPayload(response);
    if (!response.ok) {
      const message = this.extractMessage(payload) ?? response.statusText;
      throw new HttpError(response.status, message, payload);
    }

    return payload as T;
  }

  private async readPayload(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return response.json();
    }
    return response.text();
  }

  private extractMessage(payload: unknown): string | null {
    if (!payload || typeof payload !== "object") {
      return null;
    }

    const recordPayload = payload as Record<string, unknown>;
    const value = recordPayload.Error ?? recordPayload.error;
    return typeof value === "string" ? value : null;
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  if (!baseUrl.endsWith("/")) {
    return `${baseUrl}/`;
  }
  return baseUrl;
}

function normalizePath(path: string): string {
  if (path.startsWith("/")) {
    return path.slice(1);
  }
  return path;
}
