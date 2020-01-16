import React from 'react';
import { PageFields } from './content-types';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS } from '@contentful/rich-text-types';
import { Asset } from 'contentful';
import { withI18n, withI18nProps } from '@lingui/react';
import { SupportedLocale } from '../i18n-base';
import { WithJsonifiedDocuments } from './jsonified-document';

type LocalizedPages = {
  [P in SupportedLocale]: WithJsonifiedDocuments<PageFields>|PageFields
};

export type ContentfulPageProps = {
  /** The page to render, localized in all supported locales. */
  locales: LocalizedPages,
};

/**
 * A page defined and localized in Contentful.
 */
export const ContentfulPage = withI18n()((props: ContentfulPageProps & withI18nProps) => {
  const locale = props.i18n.language as SupportedLocale;
  const page = props.locales[locale] as PageFields;
  const result = documentToReactComponents(page.content, {
    renderNode: {
      [BLOCKS.EMBEDDED_ASSET]: node => {
        const asset = node.data.target as Asset;
        return (
          <aside className="contentful-asset">
            <img src={asset.fields.file.url} alt={asset.fields.description} className="img-responsive" />
          </aside>
        );
      },
    }
  });

  return <>{result}</>;
});
