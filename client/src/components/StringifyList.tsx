import React from "react";
import { t } from "@lingui/macro";
import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";

type FormattedListItem = {
  type: "element" | "literal";
  value: string;
};

function item(type: "element" | "literal", value: string): FormattedListItem {
  return { type, value };
}

/**
 * Convert the given list of strings into a list of objects
 * that can be used to present them as a list of items
 * separated by a cojunction, e.g. "foo, bar, and baz".
 *
 * Ideally we would use `Intl.ListFormat()` for this but it's
 * not supported by many browsers and polyfilling it is
 * complicated enough that it's easier to just roll our own
 * right now.
 */
function formatListWithConjunction(i18n: I18n, list: string[]): FormattedListItem[] {
  const and = i18n._(t`and`);
  if (list.length === 0) return [];
  if (list.length === 1) return [item("element", list[0])];
  if (list.length === 2) {
    const [a, b] = list;
    return [item("element", a), item("literal", ` ${and} `), item("element", b)];
  }
  const items: FormattedListItem[] = [];
  for (let i = 0; i < list.length; i++) {
    const str = list[i];
    if (i === list.length - 1) {
      items.push(item("literal", `, ${and} `));
    } else if (i > 0) {
      items.push(item("literal", `, `));
    }
    items.push(item("element", str));
  }
  return items;
}

export function stringifyListWithConjunction(i18n: I18n, list: string[]): string {
  return formatListWithConjunction(i18n, list)
    .map((item) => item.value)
    .join("");
}

/**
 * Convert the given list of strings into a list of strings
 * separated by a cojunction, e.g. "foo, bar, and baz".
 */
export const StringifyListWithConjunction = withI18n()(
  (props: { values: string[]; i18n: I18n; renderItem?: (item: string) => JSX.Element }) => {
    const renderItem = props.renderItem || ((item) => <>{item}</>);
    return (
      <>
        {formatListWithConjunction(props.i18n, props.values).map((item, i) => {
          return item.type === "literal" ? <>{item.value}</> : renderItem(item.value);
        })}
      </>
    );
  }
);
