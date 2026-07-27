import { useState, ReactNode } from "react";
import { User, Role, Category } from "../../types";
import { ApiError } from "../../api/client";
import styles from "./SetupPage.module.css";

interface SetupPageProps {
  roles: Role[];
  users: User[];
  categories: Category[];
  loading: boolean;
  onAddRole: (name: string) => Promise<void>;
  onDeleteRole: (id: string) => Promise<void>;
  onAddUser: (data: { firstName: string; lastName: string; roleId: string }) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onAddCategory: (name: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

type Panel = "roles" | "users" | "categories" | null;

interface FieldProps {
  label: string;
  children: ReactNode;
  error?: string | null;
  hint?: string;
}

function Field({ label, children, error, hint }: FieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}
        {hint && <span className={styles.hint}> ({hint})</span>}
      </label>
      {children}
      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  );
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export default function SetupPage({
  roles, users, categories, loading,
  onAddRole, onDeleteRole,
  onAddUser, onDeleteUser,
  onAddCategory, onDeleteCategory,
}: SetupPageProps) {
  const [openPanel, setOpenPanel] = useState<Panel>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ kind: Panel; key: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const togglePanel = (panel: Exclude<Panel, null>) => {
    setOpenPanel((p) => (p === panel ? null : panel));
    setConfirmDelete(null);
    setDeleteError(null);
  };

  const handleDelete = async (kind: Exclude<Panel, null>, key: string, fn: (key: string) => Promise<void>) => {
    if (confirmDelete?.kind === kind && confirmDelete.key === key) {
      setConfirmDelete(null);
      setDeleteError(null);
      try {
        await fn(key);
      } catch (err) {
        setDeleteError(errorMessage(err, "Failed to delete."));
      }
    } else {
      setDeleteError(null);
      setConfirmDelete({ kind, key });
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.heading}>Setup</h1>
          <p className={styles.subheading}>Manage roles, users, and categories used across tickets.</p>
        </div>

        {deleteError && <p className={styles.errorMsg}>{deleteError}</p>}

        <RolesPanel
          roles={roles}
          loading={loading}
          open={openPanel === "roles"}
          onToggle={() => togglePanel("roles")}
          onAdd={onAddRole}
          confirmDeleteKey={confirmDelete?.kind === "roles" ? confirmDelete.key : null}
          onDelete={(key) => handleDelete("roles", key, onDeleteRole)}
        />

        <UsersPanel
          users={users}
          roles={roles}
          loading={loading}
          open={openPanel === "users"}
          onToggle={() => togglePanel("users")}
          onAdd={onAddUser}
          confirmDeleteKey={confirmDelete?.kind === "users" ? confirmDelete.key : null}
          onDelete={(key) => handleDelete("users", key, onDeleteUser)}
        />

        <CategoriesPanel
          categories={categories}
          loading={loading}
          open={openPanel === "categories"}
          onToggle={() => togglePanel("categories")}
          onAdd={onAddCategory}
          confirmDeleteKey={confirmDelete?.kind === "categories" ? confirmDelete.key : null}
          onDelete={(key) => handleDelete("categories", key, onDeleteCategory)}
        />
      </div>
    </div>
  );
}

interface PanelHeaderProps {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
}

function PanelHeader({ title, count, open, onToggle }: PanelHeaderProps) {
  return (
    <button className={styles.panelHeader} onClick={onToggle}>
      <span className={styles.panelTitle}>{title}</span>
      <span className={styles.panelRight}>
        <span className={styles.countBadge}>{count}</span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}>▾</span>
      </span>
    </button>
  );
}

interface RolesPanelProps {
  roles: Role[];
  loading: boolean;
  open: boolean;
  onToggle: () => void;
  onAdd: (name: string) => Promise<void>;
  confirmDeleteKey: string | null;
  onDelete: (key: string) => void;
}

function RolesPanel({ roles, loading, open, onToggle, onAdd, confirmDeleteKey, onDelete }: RolesPanelProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Role name is required."); return; }
    if (roles.some((r) => r.name.toLowerCase() === trimmed.toLowerCase())) { setError("That role already exists."); return; }
    try {
      await onAdd(trimmed);
      setName("");
      setError(null);
    } catch (err) {
      setError(errorMessage(err, "Failed to add role."));
    }
  };

  return (
    <div className={styles.panel}>
      <PanelHeader title="Roles" count={roles.length} open={open} onToggle={onToggle} />
      {open && (
        <div className={styles.panelBody}>
          <Field label="Role name" error={error}>
            <div className={styles.inlineRow}>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. Admin"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
              />
              <button className={styles.btnPrimary} disabled={loading} onClick={handleAdd}>
                {loading ? "Adding…" : "Add role"}
              </button>
            </div>
          </Field>

          {roles.length === 0 ? (
            <p className={styles.empty}>No roles yet.</p>
          ) : (
            <ul className={styles.list}>
              {roles.map((r) => (
                <li key={r.id} className={styles.listItem}>
                  <span>{r.name}</span>
                  <button
                    className={`${styles.deleteBtn} ${confirmDeleteKey === r.id ? styles.deleteBtnConfirm : ""}`}
                    disabled={loading}
                    onClick={() => onDelete(r.id)}
                  >
                    {confirmDeleteKey === r.id ? "Confirm?" : "🗑"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

interface CategoriesPanelProps {
  categories: Category[];
  loading: boolean;
  open: boolean;
  onToggle: () => void;
  onAdd: (name: string) => Promise<void>;
  confirmDeleteKey: string | null;
  onDelete: (key: string) => void;
}

function CategoriesPanel({ categories, loading, open, onToggle, onAdd, confirmDeleteKey, onDelete }: CategoriesPanelProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Category name is required."); return; }
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) { setError("That category already exists."); return; }
    try {
      await onAdd(trimmed);
      setName("");
      setError(null);
    } catch (err) {
      setError(errorMessage(err, "Failed to add category."));
    }
  };

  return (
    <div className={styles.panel}>
      <PanelHeader title="Categories" count={categories.length} open={open} onToggle={onToggle} />
      {open && (
        <div className={styles.panelBody}>
          <Field label="Category name" error={error}>
            <div className={styles.inlineRow}>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. Onboarding"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
              />
              <button className={styles.btnPrimary} disabled={loading} onClick={handleAdd}>
                {loading ? "Adding…" : "Add category"}
              </button>
            </div>
          </Field>

          {categories.length === 0 ? (
            <p className={styles.empty}>No categories yet.</p>
          ) : (
            <ul className={styles.list}>
              {categories.map((c) => (
                <li key={c.id} className={styles.listItem}>
                  <span>{c.name}</span>
                  <button
                    className={`${styles.deleteBtn} ${confirmDeleteKey === c.id ? styles.deleteBtnConfirm : ""}`}
                    disabled={loading}
                    onClick={() => onDelete(c.id)}
                  >
                    {confirmDeleteKey === c.id ? "Confirm?" : "🗑"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

interface UsersPanelProps {
  users: User[];
  roles: Role[];
  loading: boolean;
  open: boolean;
  onToggle: () => void;
  onAdd: (data: { firstName: string; lastName: string; roleId: string }) => Promise<void>;
  confirmDeleteKey: string | null;
  onDelete: (key: string) => void;
}

function UsersPanel({ users, roles, loading, open, onToggle, onAdd, confirmDeleteKey, onDelete }: UsersPanelProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; roleId?: string; submit?: string }>({});

  const handleAdd = async () => {
    const e: typeof errors = {};
    if (!firstName.trim()) e.firstName = "First name is required.";
    if (!lastName.trim()) e.lastName = "Last name is required.";
    if (!roleId) e.roleId = "Role is required.";
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      await onAdd({ firstName: firstName.trim(), lastName: lastName.trim(), roleId });
      setFirstName("");
      setLastName("");
      setRoleId(roles[0]?.id ?? "");
      setErrors({});
    } catch (err) {
      setErrors({ submit: errorMessage(err, "Failed to add user.") });
    }
  };

  return (
    <div className={styles.panel}>
      <PanelHeader title="Users" count={users.length} open={open} onToggle={onToggle} />
      {open && (
        <div className={styles.panelBody}>
          {roles.length === 0 ? (
            <p className={styles.hintBox}>Create a role first before adding users.</p>
          ) : (
            <>
              <div className={styles.row2}>
                <Field label="First name" error={errors.firstName}>
                  <input
                    className={styles.input}
                    type="text"
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); setErrors((er) => ({ ...er, firstName: undefined })); }}
                  />
                </Field>
                <Field label="Last name" error={errors.lastName}>
                  <input
                    className={styles.input}
                    type="text"
                    value={lastName}
                    onChange={(e) => { setLastName(e.target.value); setErrors((er) => ({ ...er, lastName: undefined })); }}
                  />
                </Field>
              </div>
              <Field label="Role" error={errors.roleId}>
                <select
                  className={styles.select}
                  value={roleId}
                  onChange={(e) => { setRoleId(e.target.value); setErrors((er) => ({ ...er, roleId: undefined })); }}
                >
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </Field>
              {errors.submit && <p className={styles.errorMsg}>{errors.submit}</p>}
              <button className={styles.btnPrimary} disabled={loading} onClick={handleAdd}>
                {loading ? "Adding…" : "Add user"}
              </button>
            </>
          )}

          {users.length === 0 ? (
            <p className={styles.empty}>No users yet.</p>
          ) : (
            <ul className={styles.list}>
              {users.map((u) => (
                <li key={u.id} className={styles.listItem}>
                  <span>{u.firstName} {u.lastName} — {u.role?.name ?? "No role"}</span>
                  <button
                    className={`${styles.deleteBtn} ${confirmDeleteKey === u.id ? styles.deleteBtnConfirm : ""}`}
                    disabled={loading}
                    onClick={() => onDelete(u.id)}
                  >
                    {confirmDeleteKey === u.id ? "Confirm?" : "🗑"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
