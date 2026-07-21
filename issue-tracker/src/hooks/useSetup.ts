import { useState } from "react";
import { User } from "../types";

const ROLES_KEY = "it_roles";
const USERS_KEY = "it_users";
const CATEGORIES_KEY = "it_categories";
const LOADING_DELAY = 600;

const DEFAULT_ROLES = ["Support Agent"];
const DEFAULT_CATEGORIES = ["Hardware", "Software", "Network", "Access / Permissions", "Other"];
const DEFAULT_USERS: User[] = [
  { id: "USR-seed-1", firstName: "Chiazo", lastName: "Ajulu", role: "Support Agent" },
  { id: "USR-seed-2", firstName: "Damipe", lastName: "Olayinka", role: "Support Agent" },
  { id: "USR-seed-3", firstName: "Isabella", lastName: "Oge", role: "Support Agent" },
];

function loadRoles(): string[] {
  try {
    const raw = localStorage.getItem(ROLES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_ROLES;
  } catch {
    return DEFAULT_ROLES;
  }
}

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

function loadCategories(): string[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

function saveRoles(roles: string[]): void {
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function saveCategories(categories: string[]): void {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function useSetup() {
  const [roles, setRoles] = useState<string[]>(loadRoles);
  const [users, setUsers] = useState<User[]>(loadUsers);
  const [categories, setCategories] = useState<string[]>(loadCategories);
  const [loading, setLoading] = useState(false);

  const withLoading = (fn: () => void) => {
    setLoading(true);
    setTimeout(() => {
      fn();
      setLoading(false);
    }, LOADING_DELAY);
  };

  const addRole = (name: string): void => {
    withLoading(() => {
      const updated = [...roles, name.trim()];
      setRoles(updated);
      saveRoles(updated);
    });
  };

  const deleteRole = (name: string): void => {
    withLoading(() => {
      const updated = roles.filter((r) => r !== name);
      setRoles(updated);
      saveRoles(updated);
    });
  };

  const addCategory = (name: string): void => {
    withLoading(() => {
      const updated = [...categories, name.trim()];
      setCategories(updated);
      saveCategories(updated);
    });
  };

  const deleteCategory = (name: string): void => {
    withLoading(() => {
      const updated = categories.filter((c) => c !== name);
      setCategories(updated);
      saveCategories(updated);
    });
  };

  const addUser = (data: { firstName: string; lastName: string; role: string }): void => {
    withLoading(() => {
      const newUser: User = { id: `USR-${Date.now()}`, ...data };
      const updated = [...users, newUser];
      setUsers(updated);
      saveUsers(updated);
    });
  };

  const deleteUser = (id: string): void => {
    withLoading(() => {
      const updated = users.filter((u) => u.id !== id);
      setUsers(updated);
      saveUsers(updated);
    });
  };

  return {
    roles, users, categories, loading,
    addRole, deleteRole,
    addUser, deleteUser,
    addCategory, deleteCategory,
  };
}
