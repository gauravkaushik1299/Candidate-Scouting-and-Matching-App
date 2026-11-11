import { useEffect, useState } from "react";

export function useTheme() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = window.localStorage.getItem("candidate-theme");
    return savedTheme ? savedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    window.localStorage.setItem("candidate-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return { darkMode, toggleTheme: () => setDarkMode((enabled) => !enabled) };
}
