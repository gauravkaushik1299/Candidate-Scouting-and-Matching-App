function ThemeToggle({ darkMode, onToggle }) {
  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}
      aria-pressed={darkMode}
    >
      <span aria-hidden="true">{darkMode ? "☀" : "☾"}</span>
      {darkMode ? "Dark mode" : "Light mode"}
    </button>
  );
}

export default ThemeToggle;
