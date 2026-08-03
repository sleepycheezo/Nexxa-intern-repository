import { Issue } from "../types";

export type SlaState = "ok" | "at-risk" | "breached";

const AT_RISK_THRESHOLD = 0.25;

export function getSlaState(issue: Issue, now: number = Date.now()): SlaState | null {
  if (issue.status === "resolved" || !issue.slaDueAt) return null;

  const createdAt = new Date(issue.createdAt).getTime();
  const dueAt = new Date(issue.slaDueAt).getTime();
  const totalWindow = dueAt - createdAt;
  const remaining = dueAt - now;

  if (remaining <= 0) return "breached";
  if (totalWindow > 0 && remaining / totalWindow <= AT_RISK_THRESHOLD) return "at-risk";
  return "ok";
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.round(Math.abs(ms) / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const totalHours = Math.round(Math.abs(ms) / 3600000);
  if (totalHours < 24) return `${totalHours}h`;
  const days = Math.floor(Math.abs(ms) / 86400000);
  const hours = Math.round((Math.abs(ms) % 86400000) / 3600000);
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}

export function formatSlaBadge(issue: Issue, now: number = Date.now()): string | null {
  const state = getSlaState(issue, now);
  if (!state || !issue.slaDueAt) return null;

  const dueAt = new Date(issue.slaDueAt).getTime();
  const remaining = dueAt - now;

  if (state === "breached") return `SLA breached ${formatDuration(remaining)} ago`;
  if (state === "at-risk") return `SLA at risk — due in ${formatDuration(remaining)}`;
  return `Due in ${formatDuration(remaining)}`;
}
