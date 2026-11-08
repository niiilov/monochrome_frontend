export const themeKey = "mono-theme";

export function toggleTheme(defaultTheme: "light" | "dark" = "light") {
  const root = document.documentElement;
  const current = root.dataset.theme ?? defaultTheme;
  const theme = current === "dark" ? "light" : "dark";
  root.dataset.theme = theme;
  try {
    localStorage.setItem(themeKey, theme);
  } catch {
    // The theme still applies when browser storage is unavailable.
  }
}

export const initializeTheme = `
  try {
    const theme = localStorage.getItem(${JSON.stringify(themeKey)});
    if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
  } catch {}
`;
