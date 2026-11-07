export const localeNames = {
  ru: "Русский",
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  pt: "Português",
  tr: "Türkçe",
  ar: "العربية",
  zh: "简体中文",
  ja: "日本語",
} as const;

export type Locale = keyof typeof localeNames;
export const locales = Object.keys(localeNames) as Locale[];
export const defaultLocale: Locale = "ru";

export function localePath(locale: Locale) {
  return locale === defaultLocale ? "/" : `/${locale}`;
}

export function isLocale(value: string): value is Locale {
  return Object.hasOwn(localeNames, value);
}
