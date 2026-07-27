import { useCallback, useEffect, useState } from "react";
import { Role, Category, User } from "../types";
import * as rolesApi from "../api/roles";
import * as categoriesApi from "../api/categories";
import * as usersApi from "../api/users";
import { ApiError } from "../api/client";

function messageFor(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function useSetup() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, c, u] = await Promise.all([rolesApi.listRoles(), categoriesApi.listCategories(), usersApi.listUsers()]);
      setRoles(r);
      setCategories(c);
      setUsers(u);
    } catch (err) {
      setError(messageFor(err, "Failed to load setup data"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const withLoading = async (fn: () => Promise<void>, fallback: string) => {
    setLoading(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(messageFor(err, fallback));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addRole = (name: string) =>
    withLoading(async () => {
      await rolesApi.createRole(name);
      const r = await rolesApi.listRoles();
      setRoles(r);
    }, "Failed to add role");

  const deleteRole = (id: string) =>
    withLoading(async () => {
      await rolesApi.deleteRole(id);
      const r = await rolesApi.listRoles();
      setRoles(r);
    }, "Failed to delete role");

  const addCategory = (name: string) =>
    withLoading(async () => {
      await categoriesApi.createCategory(name);
      const c = await categoriesApi.listCategories();
      setCategories(c);
    }, "Failed to add category");

  const deleteCategory = (id: string) =>
    withLoading(async () => {
      await categoriesApi.deleteCategory(id);
      const c = await categoriesApi.listCategories();
      setCategories(c);
    }, "Failed to delete category");

  const addUser = (data: { firstName: string; lastName: string; roleId: string }) =>
    withLoading(async () => {
      await usersApi.createUser(data);
      const u = await usersApi.listUsers();
      setUsers(u);
    }, "Failed to add user");

  const deleteUser = (id: string) =>
    withLoading(async () => {
      await usersApi.deleteUser(id);
      const u = await usersApi.listUsers();
      setUsers(u);
    }, "Failed to delete user");

  return {
    roles,
    users,
    categories,
    loading,
    error,
    addRole,
    deleteRole,
    addUser,
    deleteUser,
    addCategory,
    deleteCategory,
  };
}
