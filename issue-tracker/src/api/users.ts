import { apiGet, apiJson, apiDelete } from "./client";
import { User } from "../types";

export const getUsers = () => apiGet<User[]>("/api/users");

export const addUser = (data: { firstName: string; lastName: string; roleId: string }) =>
  apiJson<User>("POST", "/api/users", data);

export const updateUser = (id: string, data: Partial<{ firstName: string; lastName: string; roleId: string }>) =>
  apiJson<User>("PUT", `/api/users/${id}`, data);

export const deleteUser = (id: string) => apiDelete(`/api/users/${id}`);
