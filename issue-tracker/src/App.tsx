import { useState } from "react";
import IssueForm from "./components/IssueForm";
import IssueList from "./components/IssueList";
import IssueDetail from "./components/IssueDetail";
import Nav, { NavPage } from "./components/Nav";
import { useIssues } from "./hooks/useIssues";
import { FormState, Issue, Status } from "./types";
import styles from "./App.module.css";

type View = "list" | "form" | "detail";

export default function App() {
  const [view, setView] = useState<View>("list");
  const [navPage, setNavPage] = useState<NavPage>("dashboard");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const { issues, loading, addIssue, updateIssue, updateStatus, deleteIssue } = useIssues();

  const handleSubmit = (data: FormState) => {
    addIssue(data);
    setView("list");
  };

  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setView("detail");
  };

  const handleUpdateStatus = (id: string, status: Status) => {
    updateStatus(id, status);
    if (selectedIssue?.id === id) {
      setSelectedIssue((prev) => prev ? { ...prev, status } : prev);
    }
  };

  const handleUpdateIssue = (id: string, changes: Partial<Omit<Issue, "id" | "createdAt">>) => {
    updateIssue(id, changes);
    if (selectedIssue?.id === id) {
      setSelectedIssue((prev) => prev ? { ...prev, ...changes } : prev);
    }
  };

  const handleNavigate = (page: NavPage) => {
    setNavPage(page);
    setView("list");
    setSelectedIssue(null);
  };

  return (
    <div className={styles.layout}>
      <Nav activePage={navPage} onNavigate={handleNavigate} />
      <main className={styles.main}>
        {view === "form" && (
          <IssueForm onSubmit={handleSubmit} onCancel={() => setView("list")} />
        )}
        {view === "detail" && selectedIssue && (
          <IssueDetail
            issue={selectedIssue}
            onBack={() => setView("list")}
            onUpdateStatus={handleUpdateStatus}
            onUpdateIssue={handleUpdateIssue}
            loading={loading}
          />
        )}
        {view === "list" && (
          <IssueList
            issues={issues}
            loading={loading}
            onNewIssue={() => setView("form")}
            onSelectIssue={handleSelectIssue}
            onDeleteIssue={deleteIssue}
          />
        )}
      </main>
    </div>
  );
}
