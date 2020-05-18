import { Document } from "@contentful/rich-text-types";

/**
 * This is semantically the same thing as a Contentful `Document` (rich text),
 * but typed in a way that works with using the `import` statement on a
 * JSON-serialized Contentful Document. (Annoyingly, the latter doesn't type-match
 * with a `Document`, so we're hacking the type a bit so clients don't have to
 * typecast everywhere.)
 */
export type JsonifiedDocument = {
  data: Object;
  content: any[];
  nodeType: string;
};

/**
 * Converts all Contentful `Document` fields in the given type to
 * semantically equivalent fields that properly type-check when using
 * the `import` statement on a JSON-serialized representation of the
 * given type. A `WithJsonifiedDocuments<T>` can, for all intents and
 * purposes, safely be typecast to a `T`.
 */
export type WithJsonifiedDocuments<T> = {
  [K in keyof T]: T[K] extends Document ? JsonifiedDocument : T[K];
};
