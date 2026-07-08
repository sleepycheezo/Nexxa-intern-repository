import { useState, useMemo } from "react";
import { Issue, Priority } from "../../types";
import styles from "./IssueList.module.css";

interface IssueListProps {
  issues: Issue[];
  loading: boolean;
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

type FilterValue = "all" | Priority;
const PAGE_SIZE = 10;

export default function IssueList({ issues, loading, onNewIssue, onSelectIssue, onDeleteIssue }: IssueListProps) {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const counts = useMemo(() => ({
    open: issues.filter((i) => i.status === "open").length,
    inProgress: issues.filter((i) => i.status === "in-progress").length,
    resolved: issues.filter((i) => i.status === "resolved").length,
  }), [issues]);

  const filtered = useMemo(() => {
    let result = issues;
    if (filter !== "all") result = result.filter((i) => i.priority === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [issues, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (val: FilterValue) => { setFilter(val); setPage(1); };
  const handleSearch = (val: string) => { setSearch(val); setPage(1); };

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
          <p className={styles.subheading}>{filtered.length} of {issues.length} issue{issues.length !== 1 ? "s" : ""}</p>
        </div>
        <button className={styles.newBtn} onClick={onNewIssue}>+ Submit new issue</button>
      </div>

      {/* Status counts */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statNum + " " + styles.statOpen}>{counts.open}</span>
          <span className={styles.statLabel}>Open</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum + " " + styles.statProgress}>{counts.inProgress}</span>
          <span className={styles.statLabel}>In Progress</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum + " " + styles.statResolved}>{counts.resolved}</span>
          <span className={styles.statLabel}>Resolved</span>
        </div>
      </div>

      {/* Search + Filter */}
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="🔍  Search by title, ID, category…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value as FilterValue)}
        >
          <option value="all">All priorities</option>
          <option value="p1">P1 — Critical</option>
          <option value="p2">P2 — High</option>
          <option value="p3">P3 — Normal</option>
          <option value="p4">P4 — Low</option>
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading issues…</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyIcon}>📋</p>
          <p className={styles.emptyTitle}>{issues.length === 0 ? "No issues yet" : "No issues match"}</p>
          <p className={styles.emptySub}>{issues.length === 0 ? "Submit your first issue using the button above." : "Try adjusting your search or filter."}</p>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {paginated.map((issue) => (
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
                  {issue.attachmentName && <span>· 📎 {issue.attachmentName}</span>}
                  <span>· {new Date(issue.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
              <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
              <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
