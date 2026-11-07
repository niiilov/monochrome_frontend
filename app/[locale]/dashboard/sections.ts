export const dashboardSections = {
  digest: "Дайджест",
  post: "Пост",
  email: "Письмо",
  journal: "Журнал",
  report: "Отчёт",
  profile: "Профиль",
} as const;

export type DashboardSection = keyof typeof dashboardSections;
