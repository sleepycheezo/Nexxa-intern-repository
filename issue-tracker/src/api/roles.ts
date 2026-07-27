import { apiGet, apiJson, apiDelete } from "./client";
import { Role } from "../types";

export const listRoles = () => apiGet<Role[]>("/api/roles");
export const createRole = (name: string) => apiJson<Role>("POST", "/api/roles", { name });
export const updateRole = (id: string, name: string) => apiJson<Role>("PUT", `/api/roles/${id}`, { name });
export const deleteRole = (id: string) => apiDelete(`/api/roles/${id}`);
