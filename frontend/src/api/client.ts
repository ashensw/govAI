// Small typed fetch wrapper shared by all API modules.
// Handles the API base URL, attaching the bearer token, JSON (de)serialization,
// and global 401 handling (clear token + redirect to /login).

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const TOKEN_KEY = "govai_access_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** Called when the API returns 401. Set by AuthContext at app startup. */
let onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip attaching the Authorization header (e.g. for /auth/login). */
  skipAuth?: boolean;
  /** If true, don't parse the response as JSON (e.g. for 204 responses). */
  noContent?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, noContent, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  let finalBody: BodyInit | undefined;
  if (body !== undefined) {
    if (body instanceof FormData) {
      finalBody = body;
    } else {
      finalHeaders["Content-Type"] = "application/json";
      finalBody = JSON.stringify(body);
    }
  }

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: finalBody,
  });

  if (res.status === 401) {
    clearToken();
    if (onUnauthorized) onUnauthorized();
    throw new ApiError("Unauthorized", 401);
  }

  if (!res.ok) {
    let errBody: unknown;
    try {
      errBody = await res.json();
    } catch {
      // response had no JSON body
    }
    const message =
      (errBody as { detail?: string } | undefined)?.detail ||
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, errBody);
  }

  if (noContent || res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE", noContent: true }),
};

/** Build the absolute URL + auth headers for requests that need raw fetch (upload, SSE streaming). */
export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
