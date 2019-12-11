import React from 'react';
import { JsonifiedPageEntryFields, PageEntryFields } from './entries';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS } from '@contentful/rich-text-types';
import { Asset } from 'contentful';
import { withI18n, withI18nProps } from '@lingui/react';
import { SupportedLocale } from '../i18n-base';

type LocalizedPages = {
  [P in SupportedLocale]: JsonifiedPageEntryFields|PageEntryFields
};

const ContentfulPageWithI18n: React.FC<{locales: LocalizedPages} & withI18nProps> = props => {
  const locale = props.i18n.language as SupportedLocale;
  const page = props.locales[locale] as PageEntryFields;
  const result = documentToReactComponents(page.content, {
    renderNode: {
      [BLOCKS.EMBEDDED_ASSET]: node => {
        const asset = node.data.target as Asset;
        return <img src={asset.fields.file.url} alt={asset.fields.description} />;
      },
    }
  });

  return <>{result}</>;
};

export const ContentfulPage = withI18n()(ContentfulPageWithI18n);
