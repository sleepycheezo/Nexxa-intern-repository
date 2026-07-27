export type Priority = "p1" | "p2" | "p3" | "p4";
export type Status = "open" | "in-progress" | "resolved";

export interface Role {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: Role | null;
}

export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
  url: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  category: string | null;
  priority: Priority;
  assignedUserId: string | null;
  assignee: string | null;
  status: Status;
  createdAt: string;
  updatedAt?: string;
  resolvedAt: string | null;
  attachment?: Attachment | null;
}

export interface FormState {
  title: string;
  description: string;
  categoryId: string;
  priority: Priority;
  assignedUserId: string;
  attachment: File | null;
}

export interface IssueEditChanges {
  title?: string;
  description?: string;
  categoryId?: string;
  priority?: Priority;
  assignedUserId?: string | null;
}

export interface IssueQuery {
  q?: string;
  status?: Status;
  priority?: Priority;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface Kpis {
  open: number;
  inProgress: number;
  resolved: number;
}
