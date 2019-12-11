/** Our supported locales. */
export type SupportedLocale = 'en'|'es';

/** A type that maps locales to language names. */
type LocaleLanguages = {
  [P in SupportedLocale]: string
};

export const languageNames: LocaleLanguages = {
  en: 'English',
  es: 'Español'
};

export function getSupportedLocales(): SupportedLocale[] {
  return Object.keys(languageNames) as SupportedLocale[];
}
