import React from 'react';
import { JsonifiedPageEntryFields, PageEntryFields } from './entries';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS } from '@contentful/rich-text-types';
import { Asset } from 'contentful';

export const ContentfulPage: React.FC<{page: JsonifiedPageEntryFields|PageEntryFields}> = props => {
  const page = props.page as PageEntryFields;
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
