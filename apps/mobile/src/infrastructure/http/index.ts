import { HttpClient } from "./http-client";
import { KoconiGatewayHttp } from "./koconi-gateway-http";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export function createKoconiGateway() {
  const client = new HttpClient(API_BASE_URL);
  return new KoconiGatewayHttp(client);
}

export async function checkApiReachability(timeoutMs = 5000): Promise<{
  ok: boolean;
  message?: string;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const healthUrl = new URL(normalizePath("/health"), normalizeBaseUrl(API_BASE_URL));
    const response = await fetch(healthUrl, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `health check failed (${response.status}) ${healthUrl.toString()}`,
      };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (controller.signal.aborted) {
      return {
        ok: false,
        message: `Network timed out (${timeoutMs}ms): ${API_BASE_URL}`,
      };
    }
    return {
      ok: false,
      message: `Network request failed: ${API_BASE_URL} (${message})`,
    };
  } finally {
    clearTimeout(timeoutId);
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
