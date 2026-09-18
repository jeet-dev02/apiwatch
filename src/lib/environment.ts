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
 * Two things live here: the shape of the /environment payload (normalised at
 * the boundary, the way asArray and normaliseProject already do elsewhere),
 * and a client-side scanner so the editor can warn about what is typed right
 * now rather than what the server last saw.
 */

import { Endpoint, Header } from "@/context/ProjectContext";
import { asArray } from "@/lib/api";

/** Where in an endpoint a placeholder was found. */
export type PlaceholderSite = "url" | "body" | "header";

export interface PlaceholderUsage {
  /** Endpoint id, so the UI can select it in the list. */
  id: string;
  method: string;
  path: string;
  where: PlaceholderSite;
  /** Set when `where` is "header" and the backend named which one. */
  headerKey?: string;
}

export interface Placeholder {
  name: string;
  isSet: boolean;
  usedBy: PlaceholderUsage[];
}

export interface Environment {
  variables: Record<string, string>;
  placeholders: Placeholder[];
}

/** Limits the backend enforces. Mirrored so the editor can say so first. */
export const MAX_VALUE_BYTES = 8 * 1024;
export const MAX_KEYS = 200;

/**
 * Matches {{name}}, tolerating inner padding — `{{ petId }}` is what a
 * hand-edited body tends to look like, and it resolves the same way.
 */
const PLACEHOLDER_RE = /\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g;

/** Every distinct placeholder name in a string, in first-seen order. */
export function extractPlaceholders(text: unknown): string[] {
  if (typeof text !== "string" || text === "") return [];

  const names: string[] = [];
  // exec with /g keeps lastIndex on the shared regex, so reset before each run.
  PLACEHOLDER_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = PLACEHOLDER_RE.exec(text)) !== null) {
    if (!names.includes(match[1])) names.push(match[1]);
  }

  return names;
}

/** The same string with every {{placeholder}} removed. */
export function stripPlaceholders(text: string): string {
  return text.replace(PLACEHOLDER_RE, "");
}

/**
 * Placeholders across one endpoint's URL, body and headers — the three places
 * the backend resolves. Used for the live warning in the editor, where the
 * form holds unsaved edits the server has never seen.
 */
export function endpointPlaceholders(endpoint: Partial<Endpoint>): string[] {
  const names = [
    ...extractPlaceholders(endpoint.url),
    ...extractPlaceholders(endpoint.body),
  ];

  for (const header of asArray<Header>(endpoint.headers)) {
    names.push(...extractPlaceholders(header?.key));
    names.push(...extractPlaceholders(header?.value));
  }

  return Array.from(new Set(names));
}

/** Reads a string off an unknown object, trying each key in turn. */
function pickString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value !== "") return value;
  }
  return undefined;
}

function normaliseSite(raw: string | undefined): { where: PlaceholderSite; headerKey?: string } {
  const value = (raw ?? "").toLowerCase();

  if (value.startsWith("header")) {
    // Accommodates "header", "header:X-Api-Key" and "headers.X-Api-Key" —
    // anything after the separator is the header's name.
    const named = (raw ?? "").split(/[:.]/).slice(1).join(":").trim();
    return { where: "header", headerKey: named || undefined };
  }
  if (value === "body") return { where: "body" };

  return { where: "url" };
}

function normaliseUsage(raw: unknown): PlaceholderUsage | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;

  const id = pickString(source, ["id", "endpointId"]);
  if (!id) return null;

  const site = normaliseSite(pickString(source, ["where", "location", "in", "site"]));

  return {
    id,
    method: (pickString(source, ["method"]) ?? "GET").toUpperCase(),
    path: pickString(source, ["path", "url"]) ?? "",
    where: site.where,
    headerKey: pickString(source, ["headerKey", "header", "key"]) ?? site.headerKey,
  };
}

/**
 * Normalise the GET /environment body.
 *
 * Written to tolerate the field spellings the backend might use for "which
 * variable" and "who uses it", and to derive `isSet` from the variable map
 * whenever the payload does not say — the map is the authoritative answer, and
 * getting this backwards would mark a set variable as unresolved in the one
 * view meant to make unresolved obvious.
 */
export function normaliseEnvironment(raw: unknown): Environment {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const variables: Record<string, string> = {};
  const rawVariables = source.variables;
  if (rawVariables && typeof rawVariables === "object" && !Array.isArray(rawVariables)) {
    for (const [key, value] of Object.entries(rawVariables as Record<string, unknown>)) {
      // A value that round-tripped through a script can arrive as a number or
      // null; the editor renders into an <input>, which needs a string.
      variables[key] = value == null ? "" : String(value);
    }
  }

  const placeholders: Placeholder[] = [];
  for (const entry of asArray<unknown>(source.placeholders)) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;

    const name = pickString(item, ["name", "key", "variable", "placeholder"]);
    if (!name) continue;

    const declaredSet = [item.isSet, item.set, item.hasValue].find(
      (value) => typeof value === "boolean"
    ) as boolean | undefined;

    const usedByRaw =
      asArray<unknown>(item.usedBy).length > 0
        ? asArray<unknown>(item.usedBy)
        : asArray<unknown>(item.endpoints).length > 0
          ? asArray<unknown>(item.endpoints)
          : asArray<unknown>(item.usages);

    placeholders.push({
      name,
      isSet: declaredSet ?? Object.prototype.hasOwnProperty.call(variables, name),
      usedBy: usedByRaw
        .map(normaliseUsage)
        .filter((usage): usage is PlaceholderUsage => usage !== null),
    });
  }

  return { variables, placeholders };
}

export const emptyEnvironment: Environment = { variables: {}, placeholders: [] };

/** Placeholders with no value behind them — the list people actually need. */
export function unresolved(environment: Environment): Placeholder[] {
  return environment.placeholders.filter((placeholder) => !placeholder.isSet);
}

/** UTF-8 byte length, which is what the 8KB cap is measured in. */
export function byteLength(value: string): number {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(value).length;
  return unescape(encodeURIComponent(value)).length;
}

/** "used by 4 endpoints" / "used by 1 endpoint" / "used by no endpoints". */
export function usageSummary(count: number): string {
  if (count === 0) return "used by no endpoints";
  return `used by ${count} endpoint${count === 1 ? "" : "s"}`;
}

export function siteLabel(usage: PlaceholderUsage): string {
  if (usage.where === "header") return usage.headerKey ? `header · ${usage.headerKey}` : "header";
  return usage.where;
}
