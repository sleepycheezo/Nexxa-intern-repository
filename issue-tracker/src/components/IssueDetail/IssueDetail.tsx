import { useState } from "react";
import { Issue, Status, Priority, IssueEditChanges, User, Category } from "../../types";
import { ApiError } from "../../api/client";
import ProgressBar from "../ProgressBar";
import styles from "./IssueDetail.module.css";

interface IssueDetailProps {
  issue: Issue;
  categories: Category[];
  users: User[];
  onBack: () => void;
  onUpdateStatus: (id: string, status: Status) => Promise<Issue>;
  onUpdateIssue: (id: string, changes: IssueEditChanges) => Promise<Issue>;
  loading: boolean;
}

const PRIORITY_LABELS: Record<string, string> = {
  p1: "P1 — Critical",
  p2: "P2 — High",
  p3: "P3 — Normal",
  p4: "P4 — Low",
};

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

const STATUS_PERCENT: Record<Status, number> = {
  open: 0,
  "in-progress": 50,
  resolved: 100,
};

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "p1", label: "P1 — Critical" },
  { value: "p2", label: "P2 — High" },
  { value: "p3", label: "P3 — Normal" },
  { value: "p4", label: "P4 — Low" },
];

export default function IssueDetail({ issue, categories, users, onBack, onUpdateStatus, onUpdateIssue, loading }: IssueDetailProps) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<IssueEditChanges>({
    title: issue.title,
    description: issue.description,
    categoryId: issue.categoryId ?? "",
    priority: issue.priority,
    assignedUserId: issue.assignedUserId ?? "",
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const formatted = new Date(issue.createdAt).toLocaleDateString(undefined, {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const handleSaveEdit = async () => {
    setSaveError(null);
    try {
      await onUpdateIssue(issue.id, {
        title: editForm.title || issue.title,
        description: editForm.description || issue.description,
        categoryId: editForm.categoryId || issue.categoryId || undefined,
        priority: editForm.priority || issue.priority,
        assignedUserId: editForm.assignedUserId ?? issue.assignedUserId,
      });
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save changes.");
    }
  };

  const handleStatusChange = async (status: Status) => {
    setStatusError(null);
    try {
      await onUpdateStatus(issue.id, status);
    } catch (err) {
      setStatusError(err instanceof ApiError ? err.message : "Failed to update status.");
    }
  };

  return (
    <div className={styles.wrapper}>
      {loading && <div className={styles.loadingBar} />}
      <div className={styles.container}>
        <button className={styles.backBtn} onClick={onBack}>← Back to issues</button>

        <div className={styles.card}>
          {/* Header */}
          <div className={styles.cardHeader}>
            <span className={styles.id}>{issue.id}</span>
            {editing ? (
              <input
                className={styles.editTitle}
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              />
            ) : (
              <h1 className={styles.title}>{issue.title}</h1>
            )}
            <div className={styles.headerActions}>
              <span className={`${styles.badge} ${styles[`priority_${issue.priority}`]}`}>
                {PRIORITY_LABELS[issue.priority]}
              </span>
              {!editing && (
                <button className={styles.editBtn} onClick={() => setEditing(true)}>✏️ Edit</button>
              )}
            </div>
          </div>

          <div className={styles.divider} />

          {/* Status toggle */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Status</h2>
            <select
              className={`${styles.statusSelect} ${styles[`statusActive_${issue.status}`]}`}
              disabled={loading}
              value={issue.status}
              onChange={(e) => handleStatusChange(e.target.value as Status)}
            >
              {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {statusError && <p className={styles.errorMsg}>{statusError}</p>}
            <div className={styles.progressRow}>
              <ProgressBar percent={STATUS_PERCENT[issue.status]} tone={issue.status === "resolved" ? "success" : "neutral"} />
              <span className={styles.progressLabel}>{STATUS_PERCENT[issue.status]}% complete</span>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Description */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Description</h2>
            {editing ? (
              <textarea
                className={styles.editTextarea}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            ) : (
              <p className={styles.description}>{issue.description}</p>
            )}
          </div>

          <div className={styles.divider} />

          {/* Meta */}
          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Category</span>
              {editing ? (
                <select className={styles.metaSelect} value={editForm.categoryId} onChange={(e) => setEditForm((f) => ({ ...f, categoryId: e.target.value }))}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              ) : (
                <span className={styles.metaValue}>{issue.category}</span>
              )}
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Priority</span>
              {editing ? (
                <select className={styles.metaSelect} value={editForm.priority} onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value as Priority }))}>
                  {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              ) : (
                <span className={styles.metaValue}>{PRIORITY_LABELS[issue.priority]}</span>
              )}
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Assigned to</span>
              {editing ? (
                <select className={styles.metaSelect} value={editForm.assignedUserId ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, assignedUserId: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              ) : (
                <span className={styles.metaValue}>{issue.assignee || "Unassigned"}</span>
              )}
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Submitted</span>
              <span className={styles.metaValue}>{formatted}</span>
            </div>
            {issue.resolvedAt && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Resolved</span>
                <span className={styles.metaValue}>
                  {new Date(issue.resolvedAt).toLocaleDateString(undefined, {
                    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
            )}
            {issue.attachment && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Attachment</span>
                <a className={styles.metaValue} href={`${import.meta.env.VITE_API_URL ?? "http://localhost:4000"}${issue.attachment.url}`} target="_blank" rel="noreferrer">
                  📎 {issue.attachment.filename}
                </a>
              </div>
            )}
          </div>

          {/* Edit actions */}
          {editing && (
            <>
              <div className={styles.divider} />
              {saveError && <p className={styles.errorMsg}>{saveError}</p>}
              <div className={styles.editActions}>
                <button className={styles.btnSecondary} onClick={() => setEditing(false)}>Cancel</button>
                <button className={styles.btnPrimary} disabled={loading} onClick={handleSaveEdit}>
                  {loading ? "Saving…" : "Save changes"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
