import React from "react";
import { ChangelogEntryFields } from "./content-types";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";
import { Asset } from "contentful";
import { withI18n, withI18nProps } from "@lingui/react";
import { SupportedLocale } from "../i18n-base";
import { WithJsonifiedDocuments } from "./jsonified-document";

type LocalizedEntries = {
  [P in SupportedLocale]: WithJsonifiedDocuments<ChangelogEntryFields> | ChangelogEntryFields;
};

export type ContentfulChangelogEntryProps = {
  /** The entry to render, localized in all supported locales. */
  locales: LocalizedEntries;
};

/**
 * A changelog entry defined and localized in Contentful.
 */
export const ContentfulChangelogEntries = withI18n()((props: ContentfulChangelogEntryProps & withI18nProps) => {
  const locale = props.i18n.language as SupportedLocale;
  const entry = props.locales[locale] as ChangelogEntryFields;
  const result = documentToReactComponents(entry.body, {
    renderNode: {
      [BLOCKS.EMBEDDED_ASSET]: (node) => {
        const asset = node.data.target as Asset;
        return (
          <aside className="contentful-asset">
            <img
              src={asset.fields.file.url}
              alt={asset.fields.description}
              className="img-responsive"
            />
          </aside>
        );
      },
    },
  });

  return <>{result}</>;
});
