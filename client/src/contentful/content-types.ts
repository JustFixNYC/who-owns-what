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
