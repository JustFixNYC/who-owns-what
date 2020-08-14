import path from "path";
import fs from "fs";
import * as contentful from "contentful";
import { PageFields, PageContentType, ChangelogEntryFields, ChangelogEntryContentType } from "./content-types";
import { getSupportedLocales } from "../i18n-base";

const CONTENTFUL_SPACE_ID_WOW = process.env.CONTENTFUL_SPACE_ID_WOW;
const CONTENTFUL_ACCESS_TOKEN_WOW = process.env.CONTENTFUL_ACCESS_TOKEN_WOW;
const CONTENTFUL_ACCESS_TOKEN_JUSTFIX_ORGANIZATION_SITE = process.env.CONTENTFUL_SPACE_ID_JUSTFIX_ORGANIZATION_SITE;
const CONTENTFUL_SPACE_ID_JUSTFIX_ORGANIZATION_SITE = process.env.CONTENTFUL_ACCESS_TOKEN_JUSTFIX_ORGANIZATION_SITE;
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
  if (!(CONTENTFUL_SPACE_ID_WOW && CONTENTFUL_ACCESS_TOKEN_WOW)) {
    throw new Error(
      `Please define the CONTENTFUL_SPACE_ID and CONTENTFUL_ACCESS_TOKEN ` +
        `environment variables!`
    );
  }

  const client = contentful.createClient({
    space: CONTENTFUL_SPACE_ID_WOW,
    accessToken: CONTENTFUL_ACCESS_TOKEN_WOW,
  });

  let WOW_numProcessed = 0;
  let WOW_numChanged = 0;
  const locales = getSupportedLocales();

  for (let locale of locales) {
    const wow_entries = await client.getEntries<PageFields>({
      content_type: PageContentType,
      locale: locale,
    });

    wow_entries.items.forEach((entry) => {
      const { locale } = entry.sys;
      const filename = `${entry.fields.slug}.${locale}.json`;
      const content = JSON.stringify(entry.fields, null, 2);
      WOW_numProcessed += 1;
      if (writeFileIfChangedSync(path.join(DATA_DIR, filename), content)) {
        console.log(`Exported ${filename}.`);
        WOW_numChanged += 1;
      }
    });
  }

  console.log(`Finished processing ${WOW_numProcessed} localized pages.`);
  if (WOW_numChanged === 0) {
    console.log(`Nothing changed (no files were written).`);
  }
  

  if (!(CONTENTFUL_SPACE_ID_JUSTFIX_ORGANIZATION_SITE && CONTENTFUL_ACCESS_TOKEN_JUSTFIX_ORGANIZATION_SITE)) {
    throw new Error(
      `Please define the CONTENTFUL_SPACE_ID and CONTENTFUL_ACCESS_TOKEN ` +
        `environment variables!`
    );
  }

  const organization_site = contentful.createClient({
    space: CONTENTFUL_SPACE_ID_JUSTFIX_ORGANIZATION_SITE,
    accessToken: CONTENTFUL_ACCESS_TOKEN_JUSTFIX_ORGANIZATION_SITE,
  });

  let site_numProcessed = 0;
  let site_numChanged = 0;

  for (let locale of locales) {
    const site_entries = await organization_site.getEntries<ChangelogEntryFields>({
      content_type: ChangelogEntryContentType,
      locale: locale,
    });

    site_entries.items.forEach((entry) => {
      const { locale } = entry.sys;
      const filename = `${entry.fields.slug}.${locale}.json`;
      const content = JSON.stringify(entry.fields, null, 2);
      site_numProcessed += 1;
      console.log(`Finished processing ${content}`);
      
      if (writeFileIfChangedSync(path.join(DATA_DIR, filename), content)) {
        console.log(`Exported ${filename}.`);
        site_numChanged += 1;
      }
      
    });
  }

  console.log(`Finished processing ${site_numProcessed} localized pages.`);
  if (site_numChanged === 0) {
    console.log(`Nothing changed (no files were written).`);
  }

}
