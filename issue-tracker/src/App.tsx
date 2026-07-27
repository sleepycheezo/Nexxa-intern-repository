import { useState } from "react";
import IssueForm from "./components/IssueForm";
import IssueList from "./components/IssueList";
import IssueDetail from "./components/IssueDetail";
import Nav, { NavPage } from "./components/Nav";
import SetupPage from "./components/SetupPage";
import AnalyticsPage from "./components/AnalyticsPage";
import { useIssues } from "./hooks/useIssues";
import { useSetup } from "./hooks/useSetup";
import { FormState, Issue, Status, IssueEditChanges } from "./types";
import styles from "./App.module.css";

type View = "list" | "form" | "detail";

export default function App() {
  const [view, setView] = useState<View>("list");
  const [navPage, setNavPage] = useState<NavPage>("dashboard");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const {
    issues, total, page, pageSize, query, loading,
    setQuery, setPage, addIssue, updateIssue, updateStatus, deleteIssue,
  } = useIssues();
  const setup = useSetup();

  const handleSubmit = async (data: FormState) => {
    await addIssue(data);
    setView("list");
  };

  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setView("detail");
  };

  const handleUpdateStatus = async (id: string, status: Status): Promise<Issue> => {
    const updated = await updateStatus(id, status);
    if (selectedIssue?.id === id) setSelectedIssue(updated);
    return updated;
  };

  const handleUpdateIssue = async (id: string, changes: IssueEditChanges): Promise<Issue> => {
    const updated = await updateIssue(id, changes);
    if (selectedIssue?.id === id) setSelectedIssue(updated);
    return updated;
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
        {navPage === "setup" && (
          <SetupPage
            roles={setup.roles}
            users={setup.users}
            categories={setup.categories}
            loading={setup.loading}
            onAddRole={setup.addRole}
            onDeleteRole={setup.deleteRole}
            onAddUser={setup.addUser}
            onDeleteUser={setup.deleteUser}
            onAddCategory={setup.addCategory}
            onDeleteCategory={setup.deleteCategory}
          />
        )}
        {navPage === "analytics" && <AnalyticsPage />}
        {navPage === "dashboard" && (
          <>
            {view === "form" && (
              <IssueForm
                categories={setup.categories}
                users={setup.users}
                onSubmit={handleSubmit}
                onCancel={() => setView("list")}
              />
            )}
            {view === "detail" && selectedIssue && (
              <IssueDetail
                issue={selectedIssue}
                categories={setup.categories}
                users={setup.users}
                onBack={() => setView("list")}
                onUpdateStatus={handleUpdateStatus}
                onUpdateIssue={handleUpdateIssue}
                loading={loading}
              />
            )}
            {view === "list" && (
              <IssueList
                issues={issues}
                total={total}
                page={page}
                pageSize={pageSize}
                query={query}
                loading={loading}
                onQueryChange={setQuery}
                onPageChange={setPage}
                onNewIssue={() => setView("form")}
                onSelectIssue={handleSelectIssue}
                onDeleteIssue={deleteIssue}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
