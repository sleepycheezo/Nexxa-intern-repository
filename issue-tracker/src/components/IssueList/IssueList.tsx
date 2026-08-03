import { useEffect, useState } from "react";
import { Issue, Priority, Status, IssueQuery, Kpis } from "../../types";
import { getKpis } from "../../api/dashboard";
import { getSlaState, formatSlaBadge } from "../../lib/sla";
import styles from "./IssueList.module.css";

interface IssueListProps {
  issues: Issue[];
  total: number;
  page: number;
  pageSize: number;
  query: IssueQuery;
  loading: boolean;
  onQueryChange: (query: Partial<IssueQuery>) => void;
  onPageChange: (page: number) => void;
  onNewIssue: () => void;
  onSelectIssue: (issue: Issue) => void;
  onDeleteIssue: (id: string) => void;
}

const PRIORITY_LABELS: Record<string, string> = {
  p1: "P1 — Critical",
  p2: "P2 — High",
  p3: "P3 — Normal",
  p4: "P4 — Low",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  "in-progress": "In Progress",
  resolved: "Resolved",
};

export default function IssueList({
  issues, total, page, pageSize, query, loading,
  onQueryChange, onPageChange, onNewIssue, onSelectIssue, onDeleteIssue,
}: IssueListProps) {
  const [searchInput, setSearchInput] = useState(query.q ?? "");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [kpis, setKpis] = useState<Kpis>({ open: 0, inProgress: 0, resolved: 0 });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    getKpis().then(setKpis).catch(() => {});
  }, [issues]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (query.q ?? "")) onQueryChange({ q: searchInput || undefined });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handlePriorityChange = (val: string) => onQueryChange({ priority: (val || undefined) as Priority | undefined });
  const handleStatusChange = (val: string) => onQueryChange({ status: (val || undefined) as Status | undefined });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      onDeleteIssue(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>IT Issues</h1>
          <p className={styles.subheading}>{total} issue{total !== 1 ? "s" : ""}</p>
        </div>
        <button className={styles.newBtn} onClick={onNewIssue}>+ Submit new issue</button>
      </div>

      {/* Status counts */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statNum + " " + styles.statOpen}>{kpis.open}</span>
          <span className={styles.statLabel}>Open</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum + " " + styles.statProgress}>{kpis.inProgress}</span>
          <span className={styles.statLabel}>In Progress</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum + " " + styles.statResolved}>{kpis.resolved}</span>
          <span className={styles.statLabel}>Resolved</span>
        </div>
      </div>

      {/* Search + Filter */}
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="🔍  Search by title or ID…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          value={query.priority ?? ""}
          onChange={(e) => handlePriorityChange(e.target.value)}
        >
          <option value="">All priorities</option>
          <option value="p1">P1 — Critical</option>
          <option value="p2">P2 — High</option>
          <option value="p3">P3 — Normal</option>
          <option value="p4">P4 — Low</option>
        </select>
        <select
          className={styles.filterSelect}
          value={query.status ?? ""}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading issues…</p>
        </div>
      ) : issues.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyIcon}>📋</p>
          <p className={styles.emptyTitle}>{total === 0 ? "No issues yet" : "No issues match"}</p>
          <p className={styles.emptySub}>{total === 0 ? "Submit your first issue using the button above." : "Try adjusting your search or filter."}</p>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {issues.map((issue) => (
              <div key={issue.id} className={styles.card} onClick={() => onSelectIssue(issue)}>
                <div className={styles.cardTop}>
                  <div className={styles.cardLeft}>
                    <span className={styles.id}>{issue.id}</span>
                    <h2 className={styles.title}>{issue.title}</h2>
                    <p className={styles.description}>{issue.description}</p>
                  </div>
                  <div className={styles.cardRight}>
                    <div className={styles.badges}>
                      <span className={`${styles.badge} ${styles[`priority_${issue.priority}`]}`}>
                        {PRIORITY_LABELS[issue.priority]}
                      </span>
                      <span className={`${styles.badge} ${styles[`status_${issue.status}`]}`}>
                        {STATUS_LABELS[issue.status]}
                      </span>
                      {(() => {
                        const slaState = getSlaState(issue, now);
                        const slaBadge = formatSlaBadge(issue, now);
                        return slaState && slaBadge ? (
                          <span className={`${styles.badge} ${styles[`sla_${slaState}`]}`}>{slaBadge}</span>
                        ) : null;
                      })()}
                    </div>
                    <button
                      className={`${styles.deleteBtn} ${confirmDeleteId === issue.id ? styles.deleteBtnConfirm : ""}`}
                      onClick={(e) => handleDelete(e, issue.id)}
                      title={confirmDeleteId === issue.id ? "Click again to confirm" : "Delete issue"}
                    >
                      {confirmDeleteId === issue.id ? "Confirm?" : "🗑"}
                    </button>
                  </div>
                </div>
                <div className={styles.cardMeta}>
                  <span>{issue.category}</span>
                  {issue.assignee && <span>· {issue.assignee}</span>}
                  <span>· {new Date(issue.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn} disabled={page === 1} onClick={() => onPageChange(page - 1)}>← Prev</button>
              <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
              <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
