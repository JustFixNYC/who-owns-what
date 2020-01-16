import React from 'react';
import { t } from "@lingui/macro";
import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";

/**
 * Convert the given list of strings into a list of strings
 * separated by a cojunction, e.g. "foo, bar, and baz".
 * 
 * Ideally we would use `Intl.ListFormat()` for this but it's
 * not supported by many browsers and polyfilling it is
 * complicated enough that it's easier to just roll our own
 * right now.
 */
export function stringifyListWithConjunction(i18n: I18n, list: string[]): string {
  const and = i18n._(t`and`);
  if (list.length === 0) return '';
  if (list.length === 1) return list[0];
  if (list.length === 2) {
    const [a, b] = list;
    return `${a} ${and} ${b}`;
  }
  const parts: string[] = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (i === list.length - 1) {
      parts.push(`, ${and} ${item}`);
    } else if (i === 0) {
      parts.push(item);
    } else {
      parts.push(`, ${item}`);
    }
  }
  return parts.join('');
}

/**
 * Convert the given list of strings into a list of strings
 * separated by a cojunction, e.g. "foo, bar, and baz".
 */
export const StringifyListWithConjunction = withI18n()((props: {values: string[], i18n: I18n}) => {
  return <>{stringifyListWithConjunction(props.i18n, props.values)}</>;
});
