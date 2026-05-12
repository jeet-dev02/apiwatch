
export interface Project {
  id: string;
  name: string;
  healthScore: number;
  status: "healthy" | "warning" | "critical";
  apisCount: number;
  lastRun: string;
  trend: number[];
}

export interface RecentTest {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  endpoint: string;
  statusCode: number;
  responseTime: number | null;
  timeAgo: string;
  result: "pass" | "warn" | "fail";
}

export interface Alert {
  id: string;
  project: string;
  issue: string;
  path: string;
  details: string;
  time: string;
  type: "critical" | "warning";
}

export interface Stats {
  totalProjects: number;
  apisMonitored: number;
  avgHealthScore: number;
  apisTodayTested: number;
  activeAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  successRate: number;
  avgResponseTime: number;
  deltaProjects: number;
  deltaApis: number;
  deltaHealth: number;
  deltaTodayTested: number;
}

export interface PerformancePoint {
  date: string;
  value: number;
}

// ── Data ────────────────────────────────────────────────────────────────────

export const mockProjects: Project[] = [
  { id: "p1", name: "E-commerce API",       healthScore: 94, status: "healthy",  apisCount: 12, lastRun: "2m ago",  trend: [88, 90, 91, 89, 93, 92, 94] },
  { id: "p2", name: "Auth Service",         healthScore: 88, status: "healthy",  apisCount: 6,  lastRun: "5m ago",  trend: [85, 86, 84, 87, 86, 89, 88] },
  { id: "p3", name: "Payment Gateway",      healthScore: 72, status: "warning",  apisCount: 8,  lastRun: "10m ago", trend: [80, 78, 75, 74, 73, 71, 72] },
  { id: "p4", name: "Notification Service", healthScore: 45, status: "critical", apisCount: 4,  lastRun: "1h ago",  trend: [70, 65, 58, 52, 48, 46, 45] },
  { id: "p5", name: "Legacy Reports",       healthScore: 31, status: "critical", apisCount: 3,  lastRun: "3h ago",  trend: [60, 55, 48, 40, 36, 33, 31] },
];

export const mockRecentTests: RecentTest[] = [
  { id: "t1", method: "GET",    endpoint: "/api/users/me",        statusCode: 200, responseTime: 112,  timeAgo: "2m ago",  result: "pass" },
  { id: "t2", method: "POST",   endpoint: "/api/auth/login",      statusCode: 201, responseTime: 340,  timeAgo: "3m ago",  result: "pass" },
  { id: "t3", method: "GET",    endpoint: "/api/products",        statusCode: 200, responseTime: 88,   timeAgo: "5m ago",  result: "pass" },
  { id: "t4", method: "PUT",    endpoint: "/api/profile/update",  statusCode: 200, responseTime: 95,   timeAgo: "7m ago",  result: "pass" },
  { id: "t5", method: "GET",    endpoint: "/api/payments/list",   statusCode: 429, responseTime: null,  timeAgo: "9m ago",  result: "warn" },
  { id: "t6", method: "DELETE", endpoint: "/api/reports/old",     statusCode: 500, responseTime: 2410, timeAgo: "11m ago", result: "fail" },
];

export const mockAlerts: Alert[] = [
  { id: "1", project: "Legacy Reports", issue: "500 Internal Server Error", path: "/api/reports/old", details: "3 consecutive failures", time: "4m ago", type: "critical" },
  { id: "2", project: "Payment Gateway", issue: "Rate limit hit (429)", path: "/api/payments/list", details: "Rate limit exceeded", time: "12m ago", type: "warning" },
  { id: "3", project: "Auth Service", issue: "JWT token expired", path: "/api/auth/login", details: "Token rejected on retry", time: "1h ago", type: "critical" },
  { id: "4", project: "User Profile", issue: "High latency detected", path: "/api/users/me", details: "Avg response > 2000ms", time: "2h ago", type: "warning" },
  { id: "5", project: "Checkout API", issue: "Connection Timeout", path: "/api/checkout/process", details: "Database unreachable", time: "3h ago", type: "critical" },
  { id: "6", project: "Search Service", issue: "Degraded performance", path: "/api/search", details: "Response time increased by 40%", time: "5h ago", type: "warning" },
  { id: "7", project: "Notification Hub", issue: "Webhook failed", path: "/api/webhooks/sms", details: "External provider error 503", time: "1d ago", type: "critical" },
  { id: "8", project: "Inventory Sync", issue: "Data mismatch", path: "/api/inventory/update", details: "Payload validation failed", time: "1d ago", type: "warning" },
  { id: "9", project: "Billing Service", issue: "SSL Certificate Expiring", path: "system", details: "Certificate expires in 3 days", time: "2d ago", type: "critical" },
  { id: "10", project: "Customer Portal", issue: "404 Not Found", path: "/api/portal/settings", details: "Endpoint removed or renamed", time: "2d ago", type: "warning" }
];

export const mockStats: Stats = {
  totalProjects:    6,
  apisMonitored:    32,
  avgHealthScore:   82,
  apisTodayTested:  142,
  activeAlerts:     3,
  criticalAlerts:   2,
  warningAlerts:    1,
  successRate:      96.4,
  avgResponseTime:  248,
  deltaProjects:    1,
  deltaApis:        5,
  deltaHealth:      4,
  deltaTodayTested: 18,
};

export const mockPerformanceData: PerformancePoint[] = [
  { date: "Apr 16", value: 72 },
  { date: "Apr 17", value: 75 },
  { date: "Apr 18", value: 73 },
  { date: "Apr 19", value: 76 },
  { date: "Apr 20", value: 75 },
  { date: "Apr 21", value: 78 },
  { date: "Apr 22", value: 96 },
];
