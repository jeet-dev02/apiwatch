/**
 * Whether one check's pings kept their response times within 300ms of each
 * other, or whether that was never compared.
 *
 * The API sends this as consistencyStable, a nullable boolean. Null means
 * fewer than two pings were timed, so there was nothing to compare: a
 * single-ping POST or DELETE on every run, a multi-ping check whose pings
 * nearly all failed, or a check that never ran. Tested as a boolean, null is
 * falsy, and every one of those read "⚠ Unstable".
 *
 * So the UI never holds the raw boolean. Results are converted with
 * readStability as they arrive, and their types carry `stability` instead of
 * `consistencyStable`: a `!r.consistencyStable` written later fails to
 * compile rather than quietly counting "not compared" as "unstable".
 */
export type Stability = "stable" | "unstable" | "not-compared";

export function readStability(consistencyStable: boolean | null | undefined): Stability {
  if (consistencyStable === true) return "stable";
  if (consistencyStable === false) return "unstable";
  return "not-compared";
}
