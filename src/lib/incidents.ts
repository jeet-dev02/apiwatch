import type { StatefulAlert } from "@/context/AlertContext";

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

/**
 * The incident's distinct paths, newest first. Alerts are keyed by path, and a
 * resolved incident can hold two alerts for one path if the endpoint failed,
 * recovered and failed again, so this — not `alerts.length` — is the count of
 * affected endpoints.
 */
export function incidentPaths(incident: AlertIncident): string[] {
  return Array.from(new Set(incident.alerts.map((a) => a.path)));
}

/**
 * The endpoints of an open incident that recovered while the rest of its
 * outage is still failing: its resolved alerts, one per path, newest first,
 * leaving out any path that is failing again. `resolved` is capped at
 * RESOLVED_ALERTS_LIMIT, so at the limit this can miss older recoveries.
 */
export function recoveredAlerts(incident: AlertIncident, resolved: StatefulAlert[]): StatefulAlert[] {
  const seen = new Set(incidentPaths(incident));
  return resolved.filter((alert) => {
    if (alert.incidentId !== incident.id || seen.has(alert.path)) return false;
    seen.add(alert.path);
    return true;
  });
}

/** The issue every alert of the incident shares, or null when they differ. */
export function sharedIssue(incident: AlertIncident): string | null {
  const first = incident.alerts[0].issue;
  return incident.alerts.every((a) => a.issue === first) ? first : null;
}
