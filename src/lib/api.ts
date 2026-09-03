/**
 * The single place this app talks to the backend.
 *
 * Replaces the scattered `fetch(..., { headers: { "x-api-key": API_KEY } })`
 * calls. That key came from NEXT_PUBLIC_API_KEY, which Next.js inlines into the
 * client bundle at build time — meaning it was readable by anyone who opened
 * DevTools on the deployed site, and it granted full admin access.
 *
 * `credentials: "include"` is the important part: it sends the httpOnly
 * session cookie the backend sets at login. JavaScript cannot read that cookie,
 * so it cannot leak the way the old key did.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Thrown on 401. Callers can catch this to redirect to /login. */
export class UnauthorizedError extends ApiError {
  constructor(message = "Not authenticated") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

async function request<T>(path: string, options: Options = {}): Promise<T> {
  const { method = "GET", body, signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include", // ← sends the session cookie
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError("Could not reach the server", 0);
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  // The backend puts a human-readable reason in `error` — surface it rather
  // than a generic string, so the login form can say "Invalid email or
  // password" instead of "Not authenticated".
  const serverMessage =
    payload && typeof payload === "object" && "error" in payload
      ? String((payload as { error: unknown }).error)
      : null;

  if (response.status === 401) {
    // Bounce to login rather than rendering an empty dashboard. This is the
    // backstop for a session that dies while the page is open, when the (app)
    // guard is still holding a stale `user` and will not fire on its own.
    //
    // Carries the current path for the same reason the guard does. On a cold
    // load both fire and either may win the race, so if this one dropped the
    // param the deep link would be lost about half the time.
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?next=${next}`;
    }
    throw new UnauthorizedError(serverMessage ?? undefined);
  }

  if (!response.ok) {
    throw new ApiError(
      serverMessage ?? `Request failed (${response.status})`,
      response.status,
      payload
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** Shape the backend wraps every response in. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

/**
 * Read a list out of a response body.
 *
 * Every list endpoint is meant to send `data: [...]`, but a handler that
 * returns early, a route that answers with `message` instead of `data`, or an
 * older deployment can leave it undefined. Callers then run .map or .length on
 * undefined and take the whole page down with a client-side exception, so
 * normalise once at the boundary rather than guarding at every use site.
 */
export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

// ── Auth ──────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

export interface SessionOrg {
  id: string;
  name: string;
  slug: string;
}

export interface Session {
  user: SessionUser | null;
  org: SessionOrg | null;
  role?: string;
}

export const authApi = {
  register: (input: { email: string; password: string; name?: string; orgName: string }) =>
    api.post<ApiResponse<Session>>("/auth/register", input),

  login: (input: { email: string; password: string }) =>
    api.post<ApiResponse<Session>>("/auth/login", input),

  logout: () => api.post<{ success: boolean }>("/auth/logout"),

  me: () => api.get<ApiResponse<Session>>("/auth/me"),
};
