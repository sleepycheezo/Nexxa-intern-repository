import { useCallback, useEffect, useState } from "react";
import { Issue, FormState, Status, IssueQuery } from "../types";
import * as issuesApi from "../api/issues";
import { ApiError } from "../api/client";

const DEFAULT_QUERY: IssueQuery = { page: 1, pageSize: 10 };

function messageFor(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQueryState] = useState<IssueQuery>(DEFAULT_QUERY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = useCallback(async (q: IssueQuery) => {
    setLoading(true);
    setError(null);
    try {
      const res = await issuesApi.getIssues(q);
      setIssues(res.data);
      setTotal(res.total);
    } catch (err) {
      setError(messageFor(err, "Failed to load issues"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues(query);
  }, [fetchIssues, query]);

  const setQuery = (partial: Partial<IssueQuery>) => {
    setQueryState((prev) => ({ ...prev, ...partial, page: 1 }));
  };

  const setPage = (page: number) => setQueryState((prev) => ({ ...prev, page }));

  const refetch = () => fetchIssues(query);

  const addIssue = async (form: FormState): Promise<Issue> => {
    setLoading(true);
    setError(null);
    try {
      const created = await issuesApi.addIssue(form);
      await fetchIssues(query);
      return created;
    } catch (err) {
      setError(messageFor(err, "Failed to create issue"));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateIssue = async (id: string, changes: issuesApi.IssueUpdate): Promise<Issue> => {
    setLoading(true);
    setError(null);
    try {
      const updated = await issuesApi.updateIssue(id, changes);
      await fetchIssues(query);
      return updated;
    } catch (err) {
      setError(messageFor(err, "Failed to update issue"));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (id: string, status: Status, actorId: string): Promise<Issue> =>
    updateIssue(id, { status, actorId });

  const deleteIssue = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await issuesApi.deleteIssue(id);
      await fetchIssues(query);
    } catch (err) {
      setError(messageFor(err, "Failed to delete issue"));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    issues,
    total,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 10,
    query,
    setQuery,
    setPage,
    loading,
    error,
    addIssue,
    updateIssue,
    updateStatus,
    deleteIssue,
    refetch,
  };
}
