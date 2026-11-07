export const dashboardSections = {
  digest: "Дайджест",
  post: "Пост",
  email: "Письмо",
  journal: "Журнал",
  report: "Отчёт",
  guide: "Инструкция",
  profile: "Профиль",
} as const;

export type DashboardSection = keyof typeof dashboardSections;

export type HintSection = Exclude<DashboardSection, "guide"> | "setup";

export const pageHints = {
  setup: {
    text: "Для первого запуска ничего загружать не нужно. Учебный набор уже выбран. Нажмите «Собрать дайджест», затем откройте последний выпуск.",
    anchor: "first-run",
  },
  digest: {
    text: "Это готовая подборка событий. Откройте источник под любым событием и сравните с карточкой дату, числа и оговорки.",
    anchor: "read-results",
  },
  post: {
    text: "Это короткая версия дайджеста для канала или чата. Сравните события и ссылки с «Дайджестом», затем нажмите «Копировать».",
    anchor: "read-results",
  },
  email: {
    text: "Здесь можно сверить тему и содержание письма. «Проверить отправку» проверяет тестовый адрес без доставки.",
    anchor: "share",
  },
  journal: {
    text: "Здесь видно, что произошло с каждой публикацией. Выберите статус «исключён», чтобы найти причины пропуска, или добавьте материал к этому выпуску.",
    anchor: "check-article",
  },
  report: {
    text: "Проверьте, какой файл и период обработаны, сколько материалов вошло в выпуск и есть ли замечания. За причинами по каждой публикации откройте «Журнал».",
    anchor: "read-results",
  },
  profile: {
    text: "Здесь можно изменить имя и почту демопрофиля в этой вкладке. Адрес для тестовой рассылки вводится отдельно в разделе «Письмо».",
    anchor: "share",
  },
} satisfies Record<HintSection, { text: string; anchor: string }>;
