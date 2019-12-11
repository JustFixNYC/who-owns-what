import { Entry } from 'contentful'
import { Document } from '@contentful/rich-text-types';

export type PageEntryFields = {
  title: string,
  slug: string,
  content: Document,
};

// Annoyingly, importing a JSON-encoded Document doesn't type-match
// with a Document, so we'll just hack the type a bit to avoid having
// to typecast everywhere.
type JsonifiedDocument = {
  data: Object,
  content: any[],
  nodeType: string
};

export type JsonifiedPageEntryFields = Omit<PageEntryFields, 'content'> & {
  content: JsonifiedDocument
};

export type PageEntry = Entry<PageEntryFields>;
