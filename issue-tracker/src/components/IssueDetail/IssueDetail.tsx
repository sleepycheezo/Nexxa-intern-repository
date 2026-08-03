import { useEffect, useRef, useState } from "react";
import { Issue, Status, Priority, IssueEditChanges, User, Category, Comment, HistoryEntry } from "../../types";
import { ApiError } from "../../api/client";
import { getComments, addComment } from "../../api/comments";
import { getHistory } from "../../api/history";
import { getSlaState, formatSlaBadge } from "../../lib/sla";
import ProgressBar from "../ProgressBar";
import styles from "./IssueDetail.module.css";

interface IssueDetailProps {
  issue: Issue;
  categories: Category[];
  users: User[];
  onBack: () => void;
  onUpdateStatus: (id: string, status: Status, actorId: string) => Promise<Issue>;
  onUpdateIssue: (id: string, changes: IssueEditChanges) => Promise<Issue>;
  loading: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const ACTING_AS_STORAGE_KEY = "actingAsUserId";

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

const STATUS_LABELS: Record<Status, string> = {
  open: "Open",
  "in-progress": "In Progress",
  resolved: "Resolved",
};

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

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function getMentionTrigger(text: string, cursorPos: number): string | null {
  const upToCursor = text.slice(0, cursorPos);
  const match = upToCursor.match(/@([a-zA-Z]*)$/);
  return match ? match[1] : null;
}

function insertMention(text: string, cursorPos: number, user: User): { text: string; cursorPos: number } {
  const upToCursor = text.slice(0, cursorPos);
  const match = upToCursor.match(/@([a-zA-Z]*)$/);
  if (!match) return { text, cursorPos };
  const start = cursorPos - match[0].length;
  const mention = `@${user.firstName} ${user.lastName} `;
  const newText = text.slice(0, start) + mention + text.slice(cursorPos);
  return { text: newText, cursorPos: start + mention.length };
}

function splitByMentions(body: string, mentioned: string[]): { text: string; isMention: boolean }[] {
  if (mentioned.length === 0) return [{ text: body, isMention: false }];
  const escaped = mentioned.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(@(?:${escaped.join("|")}))`, "g");
  return body
    .split(pattern)
    .filter((s) => s.length > 0)
    .map((s) => ({ text: s, isMention: mentioned.some((n) => s === `@${n}`) }));
}

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

  const [actingAsUserId, setActingAsUserId] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentBody, setCommentBody] = useState("");
  const [commentAttachment, setCommentAttachment] = useState<File | null>(null);
  const [pendingMentions, setPendingMentions] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionCursor, setMentionCursor] = useState(0);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const commentFileRef = useRef<HTMLInputElement>(null);

  const formatted = formatDateTime(issue.createdAt);
  const slaState = getSlaState(issue, now);
  const slaBadge = formatSlaBadge(issue, now);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(ACTING_AS_STORAGE_KEY);
    if (stored && users.some((u) => u.id === stored)) {
      setActingAsUserId(stored);
    } else if (stored) {
      localStorage.removeItem(ACTING_AS_STORAGE_KEY);
    }
  }, [users]);

  useEffect(() => {
    let cancelled = false;
    setCommentsLoading(true);
    getComments(issue.id)
      .then((data) => { if (!cancelled) setComments(data); })
      .finally(() => { if (!cancelled) setCommentsLoading(false); });
    setHistoryLoading(true);
    getHistory(issue.id)
      .then((data) => { if (!cancelled) setHistory(data); })
      .finally(() => { if (!cancelled) setHistoryLoading(false); });
    return () => { cancelled = true; };
  }, [issue.id]);

  const handleActingAsChange = (id: string) => {
    setActingAsUserId(id);
    if (id) localStorage.setItem(ACTING_AS_STORAGE_KEY, id);
    else localStorage.removeItem(ACTING_AS_STORAGE_KEY);
  };

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
    if (!actingAsUserId) return;
    setStatusError(null);
    try {
      await onUpdateStatus(issue.id, status, actingAsUserId);
      const refreshedHistory = await getHistory(issue.id);
      setHistory(refreshedHistory);
    } catch (err) {
      setStatusError(err instanceof ApiError ? err.message : "Failed to update status.");
    }
  };

  const handleCommentBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCommentBody(value);
    const cursor = e.target.selectionStart ?? value.length;
    setMentionQuery(getMentionTrigger(value, cursor));
    setMentionCursor(cursor);
  };

  const handleSelectMention = (user: User) => {
    const { text, cursorPos } = insertMention(commentBody, mentionCursor, user);
    setCommentBody(text);
    setPendingMentions((prev) => (prev.includes(user.id) ? prev : [...prev, user.id]));
    setMentionQuery(null);
    requestAnimationFrame(() => {
      commentInputRef.current?.focus();
      commentInputRef.current?.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const handlePostComment = async () => {
    if (!actingAsUserId || !commentBody.trim()) return;
    setPosting(true);
    setCommentError(null);
    try {
      const created = await addComment(issue.id, {
        authorId: actingAsUserId,
        body: commentBody.trim(),
        mentionedUserIds: pendingMentions,
        attachment: commentAttachment,
      });
      setComments((prev) => [...prev, created]);
      setCommentBody("");
      setCommentAttachment(null);
      setPendingMentions([]);
      setMentionQuery(null);
      if (commentFileRef.current) commentFileRef.current.value = "";
    } catch (err) {
      setCommentError(err instanceof ApiError ? err.message : "Failed to post comment.");
    } finally {
      setPosting(false);
    }
  };

  const mentionMatches = mentionQuery === null
    ? []
    : users
        .filter((u) => `${u.firstName} ${u.lastName}`.toLowerCase().startsWith(mentionQuery.toLowerCase()))
        .slice(0, 5);

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
              {slaBadge && slaState && (
                <span className={`${styles.badge} ${styles[`sla_${slaState}`]}`}>{slaBadge}</span>
              )}
              {!editing && (
                <button className={styles.editBtn} onClick={() => setEditing(true)}>✏️ Edit</button>
              )}
            </div>
            <div className={styles.actingAsRow}>
              <span className={styles.metaLabel}>Acting as</span>
              <select
                className={styles.metaSelect}
                value={actingAsUserId}
                onChange={(e) => handleActingAsChange(e.target.value)}
              >
                <option value="">Select who you are…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Status toggle */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Status</h2>
            <select
              className={`${styles.statusSelect} ${styles[`statusActive_${issue.status}`]}`}
              disabled={loading || !actingAsUserId}
              value={issue.status}
              onChange={(e) => handleStatusChange(e.target.value as Status)}
            >
              {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {!actingAsUserId && <p className={styles.progressLabel}>Select who you are above to change status.</p>}
            {statusError && <p className={styles.errorMsg}>{statusError}</p>}
            <div className={styles.progressRow}>
              <ProgressBar percent={STATUS_PERCENT[issue.status]} tone={issue.status === "resolved" ? "success" : "neutral"} />
              <span className={styles.progressLabel}>{STATUS_PERCENT[issue.status]}% complete</span>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Activity Timeline */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Activity Timeline</h2>
            {historyLoading ? (
              <p className={styles.metaValue}>Loading…</p>
            ) : history.length === 0 ? (
              <p className={styles.metaValue}>No status changes yet.</p>
            ) : (
              <ul className={styles.timeline}>
                {history.map((h) => (
                  <li key={h.id} className={styles.timelineItem}>
                    <span className={styles.metaValue}>
                      <strong>{h.actor ?? "Someone"}</strong> changed status from{" "}
                      <strong>{STATUS_LABELS[h.fromStatus]}</strong> to <strong>{STATUS_LABELS[h.toStatus]}</strong>
                    </span>
                    <span className={styles.progressLabel}>{formatDateTime(h.changedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
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
                <span className={styles.metaValue}>{formatDateTime(issue.resolvedAt)}</span>
              </div>
            )}
            {issue.attachment && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Attachment</span>
                <a className={styles.metaValue} href={`${API_BASE}${issue.attachment.url}`} target="_blank" rel="noreferrer">
                  📎 {issue.attachment.filename}
                </a>
              </div>
            )}
          </div>

          <div className={styles.divider} />

          {/* Comments */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Comments</h2>
            {commentsLoading ? (
              <p className={styles.metaValue}>Loading…</p>
            ) : (
              <ul className={styles.commentList}>
                {comments.length === 0 && <p className={styles.metaValue}>No comments yet.</p>}
                {comments.map((c) => (
                  <li key={c.id} className={styles.commentItem}>
                    <div className={styles.commentMeta}>
                      <span className={styles.commentAuthor}>{c.author ?? "Unknown"}</span>
                      <span className={styles.progressLabel}>{formatDateTime(c.createdAt)}</span>
                    </div>
                    <p className={styles.description}>
                      {splitByMentions(c.body, c.mentioned).map((part, i) =>
                        part.isMention
                          ? <span key={i} className={styles.mention}>{part.text}</span>
                          : <span key={i}>{part.text}</span>
                      )}
                    </p>
                    {c.attachment && (
                      <a className={styles.metaValue} href={`${API_BASE}${c.attachment.url}`} target="_blank" rel="noreferrer">
                        📎 {c.attachment.filename}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className={styles.commentComposer}>
              {!actingAsUserId && <p className={styles.progressLabel}>Select who you are above to post a comment.</p>}
              <div className={styles.mentionWrap}>
                <textarea
                  ref={commentInputRef}
                  className={styles.editTextarea}
                  placeholder="Ask for clarification, leave an update, or attach a diagnostic log… (type @ to mention someone)"
                  value={commentBody}
                  onChange={handleCommentBodyChange}
                  disabled={!actingAsUserId || posting}
                />
                {mentionMatches.length > 0 && (
                  <ul className={styles.mentionDropdown}>
                    {mentionMatches.map((u) => (
                      <li key={u.id} onMouseDown={(e) => { e.preventDefault(); handleSelectMention(u); }}>
                        {u.firstName} {u.lastName}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <input
                ref={commentFileRef}
                type="file"
                className={styles.commentFileInput}
                onChange={(e) => setCommentAttachment(e.target.files?.[0] ?? null)}
                disabled={!actingAsUserId || posting}
              />
              {commentError && <p className={styles.errorMsg}>{commentError}</p>}
              <div className={styles.editActions}>
                <button
                  className={styles.btnPrimary}
                  disabled={!actingAsUserId || !commentBody.trim() || posting}
                  onClick={handlePostComment}
                >
                  {posting ? "Posting…" : "Post comment"}
                </button>
              </div>
            </div>
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
