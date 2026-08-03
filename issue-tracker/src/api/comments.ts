import { apiGet, apiForm } from "./client";
import { Comment } from "../types";

export interface AddCommentInput {
  authorId: string;
  body: string;
  mentionedUserIds: string[];
  attachment: File | null;
}

export const getComments = (issueId: string) => apiGet<Comment[]>(`/api/issues/${issueId}/comments`);

export const addComment = (issueId: string, input: AddCommentInput) => {
  const form = new FormData();
  form.append("authorId", input.authorId);
  form.append("body", input.body);
  form.append("mentionedUserIds", JSON.stringify(input.mentionedUserIds));
  if (input.attachment) form.append("attachment", input.attachment);
  return apiForm<Comment>("POST", `/api/issues/${issueId}/comments`, form);
};
