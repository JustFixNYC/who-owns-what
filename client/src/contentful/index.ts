import * as contentful from "contentful";

const CONTENTFUL_SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const CONTENTFUL_ACCESS_TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN;

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

  const entries = await client.getEntries({
    'content_type': 'page',
  });
  // TODO: Export the content to JSON blorbs.
  console.log(JSON.stringify(entries, null, 2));
}
