import { useState } from "react";
import styles from "./Nav.module.css";

export type NavPage = "dashboard";

interface NavProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
}

export default function Nav({ activePage, onNavigate }: NavProps) {
  const [open, setOpen] = useState(false);

  const handleNav = (page: NavPage) => {
    onNavigate(page);
    setOpen(false);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button className={styles.hamburger} onClick={() => setOpen(true)} aria-label="Open menu">
        <span /><span /><span />
      </button>

      {/* Overlay */}
      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

      <aside className={`${styles.nav} ${open ? styles.navOpen : ""}`}>
        <div className={styles.navTop}>
          <div className={styles.brand}>🖥 IT Help Desk</div>
          <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close menu">✕</button>
        </div>
        <nav className={styles.links}>
          <button
            className={`${styles.link} ${activePage === "dashboard" ? styles.active : ""}`}
            onClick={() => handleNav("dashboard")}
          >
            <span className={styles.icon}>📋</span>
            Dashboard
          </button>
        </nav>
      </aside>
    </>
  );
}
