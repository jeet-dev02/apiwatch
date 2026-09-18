/**
 * Project environment variables, and the {{placeholders}} that resolve
 * against them.
 *
 * A Swagger import writes endpoints whose URL, body and headers are full of
 * {{petId}}-style placeholders. The backend substitutes them at request time
 * from the project's variable map; anything unset goes out literally, which is
 * why a run against an unset placeholder fails in a way that looks nothing
 * like a missing variable.
 *
 * This module mirrors GET/PATCH /projects/:id/environment. The server already
 * computes which names each endpoint needs and which of those are unset, using
 * the same code the runner substitutes with, so that answer is taken verbatim
 * rather than recomputed here — a second opinion that disagreed with the
 * runner would be worse than no opinion at all.
 *
 * The local scanner below exists only for the live warning in the endpoint
 * form, where the draft is one the server has never seen. It deliberately
 * matches the backend's rules exactly; see PLACEHOLDER.
 */

import { Endpoint, Header } from "@/context/ProjectContext";
import { asArray } from "@/lib/api";

// ── The payload ──────────────────────────────────────────────────────────

/** One stored variable. `value` is arbitrary JSON, not necessarily a string. */
export interface EnvironmentVariable {
  key: string;
  value: unknown;
}

/** One endpoint, and the names it needs. */
export interface EndpointUsage {
  id: string;
  method: string;
  /** The endpoint's label, e.g. "/pet/{petId}". Never hydrated. */
  path: string;
  /** Every {{name}} this endpoint's url, headers and body reference. */
  uses: string[];
  /** The subset of `uses` with no value behind it. */
  missing: string[];
}

export interface Environment {
  /** Sorted by key, server-side. */
  variables: EnvironmentVariable[];
  endpoints: EndpointUsage[];
  /** Union of every endpoint's `missing`, in first-appearance order. */
  missing: string[];
}

export const emptyEnvironment: Environment = { variables: [], endpoints: [], missing: [] };

/**
 * Caps the backend enforces, mirrored so the editor can say so before a 400.
 *
 * MAX_VALUE_CHARS and MAX_SET_CHARS are measured on the JSON text of the
 * value, which is what routes/environment.ts measures — `JSON.stringify(value)
 * .length`, quotes and escapes included, not UTF-8 bytes. MAX_KEYS_PER_REQUEST
 * caps one save, not the project.
 */
export const MAX_KEYS_PER_REQUEST = 200;
export const MAX_KEY_LENGTH = 200;
export const MAX_VALUE_CHARS = 8192;
export const MAX_SET_CHARS = 64_000;

// ── Reading the payload ──────────────────────────────────────────────────

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value : "";
}

/** Names out of a `uses`/`missing` array, ignoring anything that is not a string. */
function readNames(raw: unknown): string[] {
  const names: string[] = [];
  for (const entry of asArray<unknown>(raw)) {
    if (typeof entry === "string" && !names.includes(entry)) names.push(entry);
  }
  return names;
}

/**
 * Normalise the GET (and PATCH) /environment body.
 *
 * Both verbs return the same view, so a save's response can be fed straight
 * back in without a refetch.
 */
export function normaliseEnvironment(raw: unknown): Environment {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const variables: EnvironmentVariable[] = [];
  for (const entry of asArray<unknown>(source.variables)) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const key = readString(item, "key");
    // A key is any non-empty string; only the empty one is unusable here.
    if (key === "") continue;
    // `value` is read with `in` rather than a truthiness check: null is a
    // stored value, and the difference between "a script stored null" and
    // "nothing is stored" is the whole point of this screen.
    variables.push({ key, value: "value" in item ? item.value : null });
  }

  const endpoints: EndpointUsage[] = [];
  for (const entry of asArray<unknown>(source.endpoints)) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const id = readString(item, "id");
    if (id === "") continue;

    endpoints.push({
      id,
      method: (readString(item, "method") || "GET").toUpperCase(),
      path: readString(item, "path"),
      uses: readNames(item.uses),
      missing: readNames(item.missing),
    });
  }

  // The server's union is authoritative. Endpoint-level `missing` is folded in
  // only to cover a name an endpoint reports that the union somehow omits.
  const missing = readNames(source.missing);
  for (const endpoint of endpoints) {
    for (const name of endpoint.missing) {
      if (!missing.includes(name)) missing.push(name);
    }
  }

  return { variables, endpoints, missing };
}

// ── Asking questions of it ───────────────────────────────────────────────

/** One endpoint that needs a given name. */
export interface PlaceholderEndpoint {
  id: string;
  method: string;
  path: string;
}

export interface Placeholder {
  name: string;
  usedBy: PlaceholderEndpoint[];
}

/**
 * The unresolved names, each with the endpoints that need it.
 *
 * Inverted from the endpoints array: the payload is keyed by endpoint, and the
 * question the screen answers is keyed by name. Note that WHERE in an endpoint
 * a name appears is not in the payload, so it is not shown — guessing at it
 * would be inventing detail the server never reported.
 */
export function unresolved(environment: Environment): Placeholder[] {
  return environment.missing.map((name) => ({
    name,
    usedBy: environment.endpoints
      .filter((endpoint) => endpoint.missing.includes(name))
      .map(({ id, method, path }) => ({ id, method, path })),
  }));
}

/** Every distinct name referenced anywhere in the project, set or not. */
export function usedNames(environment: Environment): string[] {
  const names: string[] = [];
  for (const endpoint of environment.endpoints) {
    for (const name of endpoint.uses) {
      if (!names.includes(name)) names.push(name);
    }
  }
  return names;
}

/**
 * Whether a name has a value.
 *
 * Presence in `variables` is the test, matching the backend's hasValue: a key
 * set to "" or to null is set, and resolves to that value at run time.
 */
export function isSet(environment: Environment, name: string): boolean {
  return environment.variables.some((variable) => variable.key === name);
}

// ── The local scanner, for unsaved drafts ────────────────────────────────

/**
 * The backend's placeholder pattern, copied exactly (lib/environment.ts there).
 *
 * `[^}]+` rather than a word charset, and the name is NOT trimmed: `{{ petId }}`
 * looks up the key `" petId "`, spaces included. Both are warts, but hydrate
 * and the server's scanner share them, so matching here is what makes the
 * warning agree with what the run will actually do. A narrower pattern would
 * quietly fail to warn about names that really do go out literally.
 */
const PLACEHOLDER = /{{([^}]+)}}/g;

/** Every distinct placeholder name in a string, in first-seen order. */
export function extractPlaceholders(text: unknown): string[] {
  if (typeof text !== "string" || text === "") return [];

  const names: string[] = [];
  // PLACEHOLDER is a module-level /g regex, so lastIndex carries between
  // calls; reset before each scan. (matchAll would say this more directly but
  // needs downlevelIteration at this tsconfig target.)
  PLACEHOLDER.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = PLACEHOLDER.exec(text)) !== null) {
    if (!names.includes(match[1])) names.push(match[1]);
  }
  return names;
}

/** The same string with every {{placeholder}} removed. */
export function stripPlaceholders(text: string): string {
  return text.replace(PLACEHOLDER, "");
}

/**
 * Placeholders across one endpoint's url, headers and body, in that order.
 *
 * Header VALUES only, and never `path` — the runner hydrates exactly these, so
 * reporting a name from anywhere else would tell someone to set a value that
 * changes nothing.
 */
export function endpointPlaceholders(endpoint: Partial<Endpoint>): string[] {
  const names = extractPlaceholders(endpoint.url);

  for (const header of asArray<Header>(endpoint.headers)) {
    for (const name of extractPlaceholders(header?.value)) {
      if (!names.includes(name)) names.push(name);
    }
  }

  for (const name of extractPlaceholders(endpoint.body)) {
    if (!names.includes(name)) names.push(name);
  }

  return names;
}

// ── Editing ──────────────────────────────────────────────────────────────

/** The PATCH body: `set` merges, `remove` drops. */
export interface EnvironmentPatch {
  set: Record<string, unknown>;
  remove: string[];
}

export function isEmptyPatch(patch: EnvironmentPatch): boolean {
  return Object.keys(patch.set).length === 0 && patch.remove.length === 0;
}

export function patchSize(patch: EnvironmentPatch): number {
  return Object.keys(patch.set).length + patch.remove.length;
}

/**
 * A value as text in an input. Strings show as themselves — quoting every one
 * of them would be noise on the common case — and anything else as its JSON.
 */
export function displayValue(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value) ?? "";
}

/**
 * Text from an input back to a value to store.
 *
 * A row that started as a string stays a string, so typing `42` into one does
 * not silently change its type. A row that started as JSON is parsed back when
 * it still parses, so editing `{"a":1}` to `{"a":2}` stores an object rather
 * than the text of one, and falls back to the string when it does not — the
 * server takes any JSON, so a half-typed object is stored as typed instead of
 * being rejected.
 */
export function parseValue(text: string, original: unknown): unknown {
  if (typeof original === "string") return text;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/** The JSON length the backend measures a value against. */
export function serialisedLength(value: unknown): number {
  return (JSON.stringify(value) ?? "").length;
}

/** "used by 4 endpoints" / "used by 1 endpoint" / "used by no endpoints". */
export function usageSummary(count: number): string {
  if (count === 0) return "used by no endpoints";
  return `used by ${count} endpoint${count === 1 ? "" : "s"}`;
}
