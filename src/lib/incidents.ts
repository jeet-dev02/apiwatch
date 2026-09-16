import type { StatefulAlert } from "@/context/AlertContext";
import type { HttpMethod } from "@/context/ProjectContext";

/**
 * Incidents, as the alerts page and the dashboard panel show them.
 *
 * The backend groups the alerts of one outage of a project under one
 * `incidentId`: an API that goes down fails every endpoint it serves, so what
 * used to read as 66 alerts was three outages. GET /api/alerts still sends
 * alerts, one per endpoint, so they are grouped here.
 */

/**
 * GET /api/alerts sends only this many resolved alerts, the newest
 * (RESOLVED_ALERTS_LIMIT in the backend's routes/alerts.ts). At the limit,
 * older resolved incidents are missing, and the oldest one shown may be missing
 * some of its endpoints.
 */
export const RESOLVED_ALERTS_LIMIT = 50;

export interface AlertIncident {
  id: string;
  project: string;
  /** Critical while any of its alerts is — the rule GET /api/stats counts by. */
  type: "critical" | "warning";
  /** Newest first, the order GET /api/alerts sends them in. */
  alerts: StatefulAlert[];
}

/** Group alerts by incident. Incidents come newest first, by their newest alert. */
export function groupByIncident(alerts: StatefulAlert[]): AlertIncident[] {
  const byId = new Map<string, AlertIncident>();

  for (const alert of alerts) {
    let incident = byId.get(alert.incidentId);
    if (!incident) {
      incident = { id: alert.incidentId, project: alert.project, type: "warning", alerts: [] };
      byId.set(alert.incidentId, incident);
    }
    incident.alerts.push(alert);
    if (alert.type === "critical") incident.type = "critical";
  }

  // A Map iterates in insertion order, and the alerts arrive newest first.
  return Array.from(byId.values());
}

/** One endpoint of an incident, as the summary lines list it. */
export interface IncidentEndpoint {
  /** What the endpoint is deduped by — see `alertEndpointKey`. */
  key: string;
  path: string;
  /** Null whenever the alert has no endpoint, so nothing is shown for it. */
  method: HttpMethod | null;
}

/**
 * What identifies the endpoint an alert was raised for.
 *
 * Alerts belong to an endpoint, not a path: two endpoints on one path —
 * different methods, different expected status — raise separate alerts, and
 * keying on the path would collapse them into one.
 *
 * An alert whose endpoint has been deleted, or that the migration to endpoint
 * ids could not match to one, has no `endpointId`. It is still a real alert, so
 * it falls back to its own id: it cannot be deduped against the other alerts of
 * its endpoint, but it shows, and shows once.
 */
export function alertEndpointKey(alert: StatefulAlert): string {
  return alert.endpointId ?? alert.id;
}

/**
 * The incident's distinct endpoints, newest first. An incident can hold two
 * alerts for one endpoint — a resolved one that failed, recovered and failed
 * again — so this, not `alerts.length`, is the count of affected endpoints.
 */
export function incidentEndpoints(incident: AlertIncident): IncidentEndpoint[] {
  const byKey = new Map<string, IncidentEndpoint>();

  for (const alert of incident.alerts) {
    const key = alertEndpointKey(alert);
    if (!byKey.has(key)) byKey.set(key, { key, path: alert.path, method: alert.method });
  }

  return Array.from(byKey.values());
}

/**
 * The endpoints of an open incident that recovered while the rest of its
 * outage is still failing: its resolved alerts, one per endpoint, newest first,
 * leaving out any endpoint that is failing again. `resolved` is capped at
 * RESOLVED_ALERTS_LIMIT, so at the limit this can miss older recoveries.
 *
 * An alert with no endpoint has nothing to match a failing alert against, so it
 * is listed as recovered even when the same endpoint appears again below it.
 */
export function recoveredAlerts(incident: AlertIncident, resolved: StatefulAlert[]): StatefulAlert[] {
  const seen = new Set(incidentEndpoints(incident).map((endpoint) => endpoint.key));
  return resolved.filter((alert) => {
    const key = alertEndpointKey(alert);
    if (alert.incidentId !== incident.id || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** The issue every alert of the incident shares, or null when they differ. */
export function sharedIssue(incident: AlertIncident): string | null {
  const first = incident.alerts[0].issue;
  return incident.alerts.every((a) => a.issue === first) ? first : null;
}
