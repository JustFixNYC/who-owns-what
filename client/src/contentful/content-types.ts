import { Document } from "@contentful/rich-text-types";

/**
 * The name of the Page content type as delivered by the Contentful API.
 */
export const PageContentType = "page";

/**
 * These are the fields for the Page content type, as it's
 * defined in Contentful.
 */
export type PageFields = {
  /** The title of the page, defined as "short text" in Contentful. */
  title: string;

  /** The slug of the page, defined as "short text" in Contentful. */
  slug: string;

  /** The content of the page, defined as "rich text" in Contentful. */
  content: Document;
};

/**
 * The name of the Page content type as delivered by the Contentful API.
 */
export const ChangelogEntryContentType = "changelogEntry";

/**
 * These are the fields for the ChangelogEntry content type, as it's
 * defined in Contentful.
 */
export type ChangelogEntryFields = {

  /** The date of the entry, defined as "Date & time" in Contentful. */
  date: Date;

  /** The title of the entry, defined as "short text" in Contentful. */
  title: string;

  /** The gif or image for the entry, defined as "Media" in Contentful. */
  gif: string;

  /** The short summary for the entry, defined as "short text" in Contentful. */
  summary: string;

  /** The content/description of the entry, defined as "rich text" in Contentful. */
  body: Document;
};
