import { useMemo } from "react";
import { Issue, Priority } from "../../types";
import ProgressBar from "../ProgressBar";
import styles from "./AnalyticsPage.module.css";

interface AnalyticsPageProps {
  issues: Issue[];
}

const PRIORITY_LABELS: Record<Priority, string> = {
  p1: "P1 — Critical",
  p2: "P2 — High",
  p3: "P3 — Normal",
  p4: "P4 — Low",
};

const PRIORITY_ORDER: Priority[] = ["p1", "p2", "p3", "p4"];

function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const totalHours = Math.round(ms / 3600000);
  if (totalHours < 24) return `${totalHours}h`;
  const days = Math.floor(ms / 86400000);
  const hours = Math.round((ms % 86400000) / 3600000);
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}

export default function AnalyticsPage({ issues }: AnalyticsPageProps) {
  const resolvedCount = useMemo(() => issues.filter((i) => i.status === "resolved").length, [issues]);

  const avgResolutionMs = useMemo(() => {
    const resolved = issues.filter((i) => i.status === "resolved" && i.resolvedAt);
    if (!resolved.length) return null;
    const total = resolved.reduce(
      (sum, i) => sum + (new Date(i.resolvedAt!).getTime() - new Date(i.createdAt).getTime()),
      0
    );
    return total / resolved.length;
  }, [issues]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of issues) map.set(i.category, (map.get(i.category) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [issues]);

  const priorityCounts = useMemo(() => {
    const map: Record<Priority, number> = { p1: 0, p2: 0, p3: 0, p4: 0 };
    for (const i of issues) map[i.priority] += 1;
    return map;
  }, [issues]);

  const maxCategoryCount = Math.max(1, ...categoryCounts.map(([, count]) => count));
  const maxPriorityCount = Math.max(1, ...PRIORITY_ORDER.map((p) => priorityCounts[p]));

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.heading}>Analytics and Metrics</h1>
          <p className={styles.subheading}>Overview of ticket resolution and volume.</p>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{avgResolutionMs === null ? "—" : formatDuration(avgResolutionMs)}</span>
            <span className={styles.statLabel}>{avgResolutionMs === null ? "No resolved tickets yet" : "Avg. resolution time"}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{issues.length}</span>
            <span className={styles.statLabel}>Total tickets</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{resolvedCount}</span>
            <span className={styles.statLabel}>Resolved</span>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Tickets by category</h2>
          {categoryCounts.length === 0 ? (
            <p className={styles.empty}>No tickets yet.</p>
          ) : (
            <div className={styles.barList}>
              {categoryCounts.map(([category, count]) => (
                <BarRow key={category} label={category} count={count} max={maxCategoryCount} />
              ))}
            </div>
          )}
        </div>

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Tickets by priority</h2>
          <div className={styles.barList}>
            {PRIORITY_ORDER.map((p) => (
              <BarRow key={p} label={PRIORITY_LABELS[p]} count={priorityCounts[p]} max={maxPriorityCount} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface BarRowProps {
  label: string;
  count: number;
  max: number;
}

function BarRow({ label, count, max }: BarRowProps) {
  const percent = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className={styles.barRow}>
      <div className={styles.barRowTop}>
        <span className={styles.barLabel}>{label}</span>
        <span className={styles.barCount}>{count}</span>
      </div>
      <ProgressBar percent={percent} />
    </div>
  );
}
