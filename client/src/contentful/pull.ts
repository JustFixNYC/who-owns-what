import path from 'path';
import fs from 'fs';
import * as contentful from "contentful";
import { PageFields, PageContentType } from "./content-types";
import { getSupportedLocales } from '../i18n-base';

const CONTENTFUL_SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const CONTENTFUL_ACCESS_TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN;
const DATA_DIR = path.join(__dirname, '..', 'data');

/**
 * Pull all content types from Contentful and serialize them to JSON.
 */
export async function pullFromContentful() {
  if (!(CONTENTFUL_SPACE_ID && CONTENTFUL_ACCESS_TOKEN)) {
    throw new Error(
      `Please define the CONTENTFUL_SPACE_ID and CONTENTFUL_ACCESS_TOKEN ` +
      `environment variables!`
    );
  }

  const client = contentful.createClient({
    space: CONTENTFUL_SPACE_ID,
    accessToken: CONTENTFUL_ACCESS_TOKEN,
  });

  for (let locale of getSupportedLocales()) {
    const entries = await client.getEntries<PageFields>({
      'content_type': PageContentType,
      'locale': locale,
    });

    entries.items.forEach(entry => {
      const { locale } = entry.sys;
      const filename = `${entry.fields.slug}.${locale}.json`;
      console.log(`Exporting ${filename}.`);
      fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(entry.fields, null, 2), {
        encoding: 'utf-8',
      });
    });
  }
}
