import path from "path";
import fs from "fs";
import * as contentful from "contentful";
import { PageFields, PageContentType } from "./content-types";
import { getSupportedLocales } from "../i18n-base";

const CONTENTFUL_SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const CONTENTFUL_ACCESS_TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN;
const DATA_DIR = path.join(__dirname, "..", "data");

function writeFileIfChangedSync(absPath: string, content: string, encoding = "utf-8"): boolean {
  if (fs.existsSync(absPath)) {
    const currContents = fs.readFileSync(absPath, { encoding });
    if (currContents === content) {
      return false;
    }
  }
  fs.writeFileSync(absPath, content, { encoding });
  return true;
}

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

  let numProcessed = 0;
  let numChanged = 0;
  const locales = getSupportedLocales();

  for (let locale of locales) {
    const entries = await client.getEntries<PageFields>({
      content_type: PageContentType,
      locale: locale,
    });

    entries.items.forEach((entry) => {
      const { locale } = entry.sys;
      const filename = `${entry.fields.slug}.${locale}.json`;
      const content = JSON.stringify(entry.fields, null, 2);
      numProcessed += 1;
      if (writeFileIfChangedSync(path.join(DATA_DIR, filename), content)) {
        console.log(`Exported ${filename}.`);
        numChanged += 1;
      }
    });
  }

  console.log(`Finished processing ${numProcessed} localized pages.`);
  if (numChanged === 0) {
    console.log(`Nothing changed (no files were written).`);
  }
}
