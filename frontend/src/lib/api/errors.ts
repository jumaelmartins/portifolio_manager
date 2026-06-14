import type { ApiError } from "./types";

export function normalizeApiError(status: number, payload: unknown): ApiError {
  if (payload && typeof payload === "object") {
    const value = payload as Record<string, unknown>;
    const rawMessage = value.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(", ")
      : typeof rawMessage === "string"
        ? rawMessage
        : status >= 500
          ? "Unexpected server error"
          : "Request failed";

    return {
      status,
      ...(typeof value.code === "string" ? { code: value.code } : {}),
      message,
    };
  }

  return {
    status,
    message: status >= 500 ? "Unexpected server error" : "Request failed",
  };
}
