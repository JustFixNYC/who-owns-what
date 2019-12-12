import { isSupportedLocale } from "./i18n-base";

test("isSupportedLocale() works", () => {
  expect(isSupportedLocale('en')).toBe(true);
  expect(isSupportedLocale('zz')).toBe(false);
});
