export const themeKey = "mono-theme";

export const initializeTheme = `
  try {
    const theme = localStorage.getItem(${JSON.stringify(themeKey)});
    if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
  } catch {}
`;
