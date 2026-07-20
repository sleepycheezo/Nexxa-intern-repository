import { useEffect, useState } from "react";
import { Issue, FormState, Status } from "../types";

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`Request to ${path} failed: ${res.status}`);
  return res.status === 204 ? (undefined as T) : res.json();
}

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Issue[]>("/issues").then(setIssues).finally(() => setLoading(false));
  }, []);

  const withLoading = async (fn: () => Promise<void>) => {
    setLoading(true);
    try {
      await fn();
    } finally {
      setLoading(false);
    }
  };

  const addIssue = (form: FormState): void => {
    withLoading(async () => {
      const created = await api<Issue>("/issues", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          priority: form.priority,
          assignee: form.assignee,
          attachmentName: form.attachment?.name ?? null,
        }),
      });
      setIssues((prev) => [created, ...prev]);
    });
  };

  const updateIssue = (id: string, changes: Partial<Omit<Issue, "id">>): void => {
    withLoading(async () => {
      const updated = await api<Issue>(`/issues/${id}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      });
      setIssues((prev) => prev.map((i) => (i.id === id ? updated : i)));
    });
  };

  const updateStatus = (id: string, status: Status): void => {
    updateIssue(id, {
      status,
      resolvedAt: status === "resolved" ? new Date().toISOString() : null,
    });
  };

  const deleteIssue = (id: string): void => {
    withLoading(async () => {
      await api<void>(`/issues/${id}`, { method: "DELETE" });
      setIssues((prev) => prev.filter((i) => i.id !== id));
    });
  };

  return { issues, loading, addIssue, updateIssue, updateStatus, deleteIssue };
}
