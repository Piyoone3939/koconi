type Primitive = string | number | boolean;

type QueryValue = Primitive | null | undefined;

type RequestOptions = {
  method?: "GET" | "POST";
  headers?: HeadersInit;
  body?: BodyInit | null;
  query?: Record<string, QueryValue>;
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
    this.baseUrl = baseUrl;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = new URL(path, this.baseUrl);

    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value === undefined || value === null) {
          continue;
        }
        url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: options.headers,
      body: options.body,
    });

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
