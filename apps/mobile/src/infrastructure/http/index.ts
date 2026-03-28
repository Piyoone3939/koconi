import { HttpClient } from "./http-client";
import { KoconiGatewayHttp } from "./koconi-gateway-http";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export function createKoconiGateway() {
  const client = new HttpClient(apiBaseUrl);
  return new KoconiGatewayHttp(client);
}
