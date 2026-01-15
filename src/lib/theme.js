import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "base25_theme";

const isValidTheme = (value) =>
  value === "light" || value === "dark" || value === "system";

const getStoredTheme = () => {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isValidTheme(stored) ? stored : "system";
};

const getSystemTheme = () => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyTheme = (theme) => {
  if (typeof document === "undefined") return;
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.dataset.theme = theme;
};

export function useThemePreference() {
  const [theme, setTheme] = useState(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const initial = getStoredTheme();
    return initial === "system" ? getSystemTheme() : initial;
  });

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    setResolvedTheme(theme === "system" ? getSystemTheme() : theme);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme !== "system") return;
      applyTheme(theme);
      setResolvedTheme(getSystemTheme());
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme]);

  return { theme, resolvedTheme, setTheme };
}
