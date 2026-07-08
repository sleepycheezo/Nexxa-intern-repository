import { useState } from "react";
import { Issue, Status, Category, Priority, FormState } from "../../types";
import styles from "./IssueDetail.module.css";

interface IssueDetailProps {
  issue: Issue;
  onBack: () => void;
  onUpdateStatus: (id: string, status: Status) => void;
  onUpdateIssue: (id: string, changes: Partial<Omit<Issue, "id" | "createdAt">>) => void;
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

const CATEGORIES: Category[] = ["Hardware", "Software", "Network", "Access / Permissions", "Other"];
const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "p1", label: "P1 — Critical" },
  { value: "p2", label: "P2 — High" },
  { value: "p3", label: "P3 — Normal" },
  { value: "p4", label: "P4 — Low" },
];
const ASSIGNEES = ["", "Alice M.", "Bob K.", "Carlos R."];

export default function IssueDetail({ issue, onBack, onUpdateStatus, onUpdateIssue, loading }: IssueDetailProps) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<FormState>>({
    title: issue.title,
    description: issue.description,
    category: issue.category,
    priority: issue.priority,
    assignee: issue.assignee,
  });

  const formatted = new Date(issue.createdAt).toLocaleDateString(undefined, {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const handleSaveEdit = () => {
    onUpdateIssue(issue.id, {
      title: editForm.title || issue.title,
      description: editForm.description || issue.description,
      category: editForm.category || issue.category,
      priority: editForm.priority || issue.priority,
      assignee: editForm.assignee ?? issue.assignee,
    });
    setEditing(false);
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
            <div className={styles.statusRow}>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  disabled={loading}
                  className={`${styles.statusBtn} ${issue.status === opt.value ? styles[`statusActive_${opt.value}`] : ""}`}
                  onClick={() => onUpdateStatus(issue.id, opt.value)}
                >
                  {opt.label}
                </button>
              ))}
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
                <select className={styles.metaSelect} value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value as Category }))}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
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
                <select className={styles.metaSelect} value={editForm.assignee} onChange={(e) => setEditForm((f) => ({ ...f, assignee: e.target.value }))}>
                  {ASSIGNEES.map((a) => <option key={a} value={a}>{a || "Unassigned"}</option>)}
                </select>
              ) : (
                <span className={styles.metaValue}>{issue.assignee || "Unassigned"}</span>
              )}
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Submitted</span>
              <span className={styles.metaValue}>{formatted}</span>
            </div>
            {issue.attachmentName && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Attachment</span>
                <span className={styles.metaValue}>📎 {issue.attachmentName}</span>
              </div>
            )}
          </div>

          {/* Edit actions */}
          {editing && (
            <>
              <div className={styles.divider} />
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
