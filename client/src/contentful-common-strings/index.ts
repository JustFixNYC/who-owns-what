import _commonStrings from "../data/common-strings.json";
import { Document } from "@contentful/rich-text-types";

const commonStrings = _commonStrings as ContentfulCommonStrings;

export type ContentfulCommonStrings = {
  [key: string]: { [locale: string]: Document | undefined };
};

export function getContentfulCommonString(key: string, locale: string): Document | null {
  const locales = commonStrings[key];
  return (locales && locales[locale]) ?? null;
}
