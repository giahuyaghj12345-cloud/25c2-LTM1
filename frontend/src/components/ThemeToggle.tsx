import { useTheme } from "../theme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Chuyển chế độ tối" : "Chuyển chế độ sáng"}
      title={theme === "light" ? "Chế độ tối" : "Chế độ sáng"}
    >
      <span className={theme === "light" ? "active" : ""}>Sáng</span>
      <span className={theme === "dark" ? "active" : ""}>Tối</span>
    </button>
  );
}
