import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  percent: number;
  tone?: "neutral" | "success";
}

export default function ProgressBar({ percent, tone = "neutral" }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={styles.track}>
      <div
        className={`${styles.fill} ${tone === "success" ? styles.fillSuccess : ""}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
