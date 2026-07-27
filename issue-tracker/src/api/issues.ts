import { apiGet, apiForm, apiDelete } from "./client";
import { Issue, FormState, IssueQuery, Status } from "../types";

export interface IssueListResponse {
  data: Issue[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IssueUpdate {
  title?: string;
  description?: string;
  categoryId?: string;
  priority?: string;
  assignedUserId?: string | null;
  status?: Status;
  attachment?: File | null;
}

function buildQueryString(query: IssueQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.priority) params.set("priority", query.priority);
  if (query.category) params.set("category", query.category);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function toFormData(fields: Record<string, string | File | null | undefined>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined) continue;
    form.append(key, value);
  }
  return form;
}

export const listIssues = (query: IssueQuery) => apiGet<IssueListResponse>(`/api/issues${buildQueryString(query)}`);

export const getIssue = (id: string) => apiGet<Issue>(`/api/issues/${id}`);

export const createIssue = (form: FormState) =>
  apiForm<Issue>(
    "POST",
    "/api/issues",
    toFormData({
      title: form.title,
      description: form.description,
      categoryId: form.categoryId,
      priority: form.priority,
      assignedUserId: form.assignedUserId || undefined,
      attachment: form.attachment,
    })
  );

export const updateIssue = (id: string, changes: IssueUpdate) => {
  const fields: Record<string, string | File | null | undefined> = {};
  if (changes.title !== undefined) fields.title = changes.title;
  if (changes.description !== undefined) fields.description = changes.description;
  if (changes.categoryId !== undefined) fields.categoryId = changes.categoryId;
  if (changes.priority !== undefined) fields.priority = changes.priority;
  if (changes.assignedUserId !== undefined) fields.assignedUserId = changes.assignedUserId ?? "";
  if (changes.status !== undefined) fields.status = changes.status;
  if (changes.attachment) fields.attachment = changes.attachment;
  return apiForm<Issue>("PUT", `/api/issues/${id}`, toFormData(fields));
};

export const deleteIssue = (id: string) => apiDelete(`/api/issues/${id}`);
