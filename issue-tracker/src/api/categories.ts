import { apiGet, apiJson, apiDelete } from "./client";
import { Category } from "../types";

export const getCategories = () => apiGet<Category[]>("/api/categories");
export const addCategory = (name: string) => apiJson<Category>("POST", "/api/categories", { name });
export const updateCategory = (id: string, name: string) => apiJson<Category>("PUT", `/api/categories/${id}`, { name });
export const deleteCategory = (id: string) => apiDelete(`/api/categories/${id}`);
