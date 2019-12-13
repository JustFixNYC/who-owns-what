import { Document } from '@contentful/rich-text-types';

/**
 * The name of the Page content type as delivered by the Contentful API.
 */
export const PageContentType = 'page';

/**
 * These are the fields for the Page content type, as it's
 * defined in Contentful.
 */
export type PageFields = {
  /** The title of the page, defined as "short text" in Contentful. */
  title: string,

  /** The slug of the page, defined as "short text" in Contentful. */
  slug: string,

  /** The content of the page, defined as "rich text" in Contentful. */
  content: Document,
};

/**
 * This is semantically the same thing as a Contentful `Document` (rich text),
 * but typed in a way that works with using the `import` statement on a
 * JSON-serialized Contentful Document. (Annoyingly, the latter doesn't type-match
 * with a `Document`, so we're hacking the type a bit so clients don't have to
 * typecast everywhere.)
 */
type JsonifiedDocument = {
  data: Object,
  content: any[],
  nodeType: string
};

export type JsonifiedPageEntryFields = Omit<PageFields, 'content'> & {
  content: JsonifiedDocument
};
