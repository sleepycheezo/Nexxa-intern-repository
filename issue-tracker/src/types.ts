export type Priority = "p1" | "p2" | "p3" | "p4";
export type Category = string;
export type Status = "open" | "in-progress" | "resolved";

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  assignee: string;
  attachmentName: string | null;
  status: Status;
  createdAt: string;
  resolvedAt: string | null;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface FormState {
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  assignee: string;
  attachment: File | null;
}
