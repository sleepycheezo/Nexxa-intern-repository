import { apiGet } from "./client";
import { HistoryEntry } from "../types";

export const getHistory = (issueId: string) => apiGet<HistoryEntry[]>(`/api/issues/${issueId}/history`);
