import { useState, useRef, ReactNode } from "react";
import { FormState, Priority, User, Category } from "../../types";
import { ApiError } from "../../api/client";
import styles from "./IssueForm.module.css";

interface IssueFormProps {
  categories: Category[];
  users: User[];
  onSubmit: (data: FormState) => Promise<void>;
  onCancel: () => void;
}

interface FieldProps {
  label: string;
  children: ReactNode;
  error?: string | null;
  hint?: string;
  required?: boolean;
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "p1", label: "P1 — Critical" },
  { value: "p2", label: "P2 — High" },
  { value: "p3", label: "P3 — Normal" },
  { value: "p4", label: "P4 — Low" },
];

interface FormErrors {
  title?: string | null;
  description?: string | null;
}

export default function IssueForm({ categories, users, onSubmit, onCancel }: IssueFormProps) {
  const [form, setForm] = useState<FormState>(() => ({
    title: "",
    description: "",
    categoryId: categories[0]?.id ?? "",
    priority: "p3",
    assignedUserId: "",
    attachment: null,
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [dragging, setDragging] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as keyof FormErrors]) setErrors((e) => ({ ...e, [key]: null }));
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.title.trim()) e.title = "Issue title is required.";
    if (!form.description.trim()) e.description = "Description is required.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Failed to submit issue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFile = (file: File | undefined) => {
    if (file) set("attachment", file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.heading}>Submit a new issue</h2>
          <button className={styles.cancelBtn} onClick={onCancel}>✕ Cancel</button>
        </div>

        {submitError && <p className={styles.errorMsg}>{submitError}</p>}

        <Field label="Issue title" error={errors.title} required>
          <input
            className={`${styles.input} ${errors.title ? styles.inputError : ""}`}
            type="text"
            placeholder="Brief description of the problem"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </Field>

        <Field label="Description" error={errors.description} required>
          <textarea
            className={`${styles.textarea} ${errors.description ? styles.inputError : ""}`}
            placeholder="Steps to reproduce, error messages, affected systems…"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>

        <div className={styles.row2}>
          <Field label="Category">
            <select className={styles.select} value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select className={styles.select} value={form.priority} onChange={(e) => set("priority", e.target.value as Priority)}>
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Assigned to">
          <select className={styles.select} value={form.assignedUserId} onChange={(e) => set("assignedUserId", e.target.value)}>
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
        </Field>

        <Field label="Attachment" hint="Optional">
          <div
            className={`${styles.dropzone} ${dragging ? styles.dropzoneDrag : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" className={styles.fileInput} onChange={(e) => handleFile(e.target.files?.[0])} />
            {form.attachment ? (
              <span className={styles.fileName}>📎 {form.attachment.name}</span>
            ) : (
              <span className={styles.dropzoneText}>Drag and drop or <span className={styles.link}>browse</span></span>
            )}
          </div>
        </Field>

        <div className={styles.btnRow}>
          <button className={styles.btnSecondary} onClick={onCancel} disabled={submitting}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit issue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, error, hint, required }: FieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
        {hint && <span className={styles.hint}> ({hint})</span>}
      </label>
      {children}
      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  );
}
