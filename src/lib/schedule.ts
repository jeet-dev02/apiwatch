/**
 * A project's scheduled runs, as GET/PUT /projects/:id/schedule report them.
 *
 * The backend works out what a scheduled run would call, and why it would
 * leave anything out, with the same plan the runner applies (its
 * lib/chainPlan.ts). So coverage and warnings are taken as sent, never
 * recomputed here: a second opinion that disagreed with the runner would be
 * worse than none.
 */

import { HttpMethod } from "@/context/ProjectContext";
import { asArray } from "@/lib/api";

export interface ScheduleCoverage {
  /** Every endpoint in the project. */
  total: number;
  /** Called by a scheduled run. */
  scheduled: number;
  /** includeInSchedule is off. */
  notScheduled: number;
  /** Included, but it reads something an excluded DELETE removes and nothing scheduled creates again. */
  blockedByChain: number;
}

export interface ScheduleWarning {
  /** "blocked" (left out because of a chain) or "accumulates" (a scheduled POST whose records nothing deletes). */
  kind: string;
  /** The endpoint the warning is about. */
  endpointId: string | null;
  /** Written by the backend for people: the reason, naming the endpoints involved. */
  message: string;
}

export interface Schedule {
  enabled: boolean;
  /** Null until a schedule has been saved for the project. */
  intervalMinutes: number | null;
  /** When the scheduler last claimed a slot, which is when a scheduled run was last due. */
  lastRunAt: string | null;
  /** Null while the schedule is off. At or before now means due: it starts on the scheduler's next minute. */
  nextRunAt: string | null;
  coverage: ScheduleCoverage;
  warnings: ScheduleWarning[];
}

/** The backend's limits (lib/scheduling.ts there): an hour to a week. */
export const MIN_INTERVAL_MINUTES = 60;
export const MAX_INTERVAL_MINUTES = 7 * 24 * 60;

/** What the interval picker offers, rather than a free minutes field. */
export const INTERVAL_CHOICES = [60, 6 * 60, 12 * 60, 24 * 60];

/** What the picker shows before a schedule has ever been saved. */
export const DEFAULT_INTERVAL_MINUTES = 60;

/**
 * Whether a new endpoint is included in scheduled runs, and what changing an
 * endpoint's method resets it to. Mirrors the backend's rule: GET and PUT
 * leave nothing behind, POST creates a record every call and DELETE removes
 * one, so those two stay out until someone opts them in.
 */
export function defaultIncludeInSchedule(method: HttpMethod): boolean {
  return method === "GET" || method === "PUT";
}

// ── Reading the payload ──────────────────────────────────────────────────

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isoOrNull(value: unknown): string | null {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime()) ? value : null;
}

/**
 * The schedule out of a response body, with every field present.
 *
 * A warning without a message is dropped: the message is the only part meant
 * for people, and a blank card would say there is a problem without saying
 * what it is.
 */
export function normaliseSchedule(raw: unknown): Schedule {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const coverage = (source.coverage && typeof source.coverage === "object" ? source.coverage : {}) as Record<string, unknown>;

  const warnings: ScheduleWarning[] = [];
  for (const entry of asArray<unknown>(source.warnings)) {
    if (!entry || typeof entry !== "object") continue;
    const warning = entry as Record<string, unknown>;
    if (typeof warning.message !== "string" || warning.message.trim() === "") continue;
    warnings.push({
      kind: typeof warning.kind === "string" ? warning.kind : "",
      endpointId: typeof warning.endpointId === "string" ? warning.endpointId : null,
      message: warning.message,
    });
  }

  return {
    enabled: source.enabled === true,
    intervalMinutes: typeof source.intervalMinutes === "number" ? source.intervalMinutes : null,
    lastRunAt: isoOrNull(source.lastRunAt),
    nextRunAt: isoOrNull(source.nextRunAt),
    coverage: {
      total: count(coverage.total),
      scheduled: count(coverage.scheduled),
      notScheduled: count(coverage.notScheduled),
      blockedByChain: count(coverage.blockedByChain),
    },
    warnings,
  };
}

// ── Saying it ────────────────────────────────────────────────────────────

/** "Every hour", "Every 6 hours", "Every 2 days", "Every 1 h 30 min". */
export function intervalLabel(minutes: number): string {
  if (minutes === 60) return "Every hour";
  if (minutes % (24 * 60) === 0 && minutes > 24 * 60) return `Every ${minutes / (24 * 60)} days`;
  if (minutes % 60 === 0) return `Every ${minutes / 60} hours`;
  return `Every ${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

/** The header chip: "Every 6h". */
export function shortIntervalLabel(minutes: number): string {
  if (minutes % (24 * 60) === 0 && minutes > 24 * 60) return `Every ${minutes / (24 * 60)}d`;
  if (minutes % 60 === 0) return `Every ${minutes / 60}h`;
  return `Every ${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/** "21 Sep, 14:00". */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** "in 42 min", "3 h ago", "in 2 days"; under a minute, "just now" or "in under a minute". */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const diff = new Date(iso).getTime() - now;
  const minutes = Math.round(Math.abs(diff) / 60_000);

  if (minutes < 1) return diff > 0 ? "in under a minute" : "just now";

  let span: string;
  if (minutes < 60) span = `${minutes} min`;
  else if (minutes < 48 * 60) span = `${Math.round(minutes / 60)} h`;
  else span = `${Math.round(minutes / (24 * 60))} days`;

  return diff > 0 ? `in ${span}` : `${span} ago`;
}
