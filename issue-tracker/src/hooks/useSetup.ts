import { useEffect, useState } from "react";
import { User } from "../types";

interface SetupData {
  roles: string[];
  categories: string[];
  users: User[];
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`Request to ${path} failed: ${res.status}`);
  return res.status === 204 ? (undefined as T) : res.json();
}

export function useSetup() {
  const [roles, setRoles] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<SetupData>("/setup")
      .then((data) => {
        setRoles(data.roles);
        setCategories(data.categories);
        setUsers(data.users);
      })
      .finally(() => setLoading(false));
  }, []);

  const withLoading = async (fn: () => Promise<void>) => {
    setLoading(true);
    try {
      await fn();
    } finally {
      setLoading(false);
    }
  };

  const addRole = (name: string): void => {
    withLoading(async () => {
      const updated = await api<string[]>("/roles", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      setRoles(updated);
    });
  };

  const deleteRole = (name: string): void => {
    withLoading(async () => {
      const updated = await api<string[]>(`/roles/${encodeURIComponent(name)}`, { method: "DELETE" });
      setRoles(updated);
    });
  };

  const addCategory = (name: string): void => {
    withLoading(async () => {
      const updated = await api<string[]>("/categories", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      setCategories(updated);
    });
  };

  const deleteCategory = (name: string): void => {
    withLoading(async () => {
      const updated = await api<string[]>(`/categories/${encodeURIComponent(name)}`, { method: "DELETE" });
      setCategories(updated);
    });
  };

  const addUser = (data: { firstName: string; lastName: string; role: string }): void => {
    withLoading(async () => {
      const created = await api<User>("/users", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setUsers((prev) => [...prev, created]);
    });
  };

  const deleteUser = (id: string): void => {
    withLoading(async () => {
      await api<void>(`/users/${id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    });
  };

  return {
    roles, users, categories, loading,
    addRole, deleteRole,
    addUser, deleteUser,
    addCategory, deleteCategory,
  };
}
