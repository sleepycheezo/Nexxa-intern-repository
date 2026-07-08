export type Priority = "p1" | "p2" | "p3" | "p4";
export type Category = "Hardware" | "Software" | "Network" | "Access / Permissions" | "Other";
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
}

export interface FormState {
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  assignee: string;
  attachment: File | null;
}
