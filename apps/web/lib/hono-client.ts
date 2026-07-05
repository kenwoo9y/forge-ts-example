import type { AppType } from "api";
import { type ErrorCode, errorMessages } from "error";
import { hc } from "hono/client";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

export const apiClient = hc<AppType>(API_URL);

type JsonResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

export async function unwrap<T>(response: JsonResponse): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      code?: ErrorCode;
    };
    const message =
      (body.code && errorMessages[body.code]) ??
      errorMessages.INTERNAL_SERVER_ERROR;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
