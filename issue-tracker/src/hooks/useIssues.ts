import { useState } from "react";
import { Issue, FormState, Status } from "../types";

const STORAGE_KEY = "it_issues";
const LOADING_DELAY = 600;

function loadIssues(): Issue[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveIssues(issues: Issue[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
}

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>(loadIssues);
  const [loading, setLoading] = useState(false);

  const withLoading = (fn: () => void) => {
    setLoading(true);
    setTimeout(() => {
      fn();
      setLoading(false);
    }, LOADING_DELAY);
  };

  const addIssue = (form: FormState): void => {
    withLoading(() => {
      const newIssue: Issue = {
        id: `ISS-${Date.now()}`,
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        assignee: form.assignee,
        attachmentName: form.attachment?.name ?? null,
        status: "open",
        createdAt: new Date().toISOString(),
      };
      const updated = [newIssue, ...issues];
      setIssues(updated);
      saveIssues(updated);
    });
  };

  const updateIssue = (id: string, changes: Partial<Omit<Issue, "id" | "createdAt">>): void => {
    withLoading(() => {
      const updated = issues.map((i) => i.id === id ? { ...i, ...changes } : i);
      setIssues(updated);
      saveIssues(updated);
    });
  };

  const updateStatus = (id: string, status: Status): void => {
    withLoading(() => {
      const updated = issues.map((i) => i.id === id ? { ...i, status } : i);
      setIssues(updated);
      saveIssues(updated);
    });
  };

  const deleteIssue = (id: string): void => {
    withLoading(() => {
      const updated = issues.filter((i) => i.id !== id);
      setIssues(updated);
      saveIssues(updated);
    });
  };

  return { issues, loading, addIssue, updateIssue, updateStatus, deleteIssue };
}
