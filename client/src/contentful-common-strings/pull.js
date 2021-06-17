//@ts-check

/**
 * @typedef {import("./index").ContentfulCommonStrings} CommonStrings
 */

let https = require('https');

const ORIGIN = "https://cdn.contentful.com";
const COMMON_STRING_TAG = "common";
const SPACE_ID = "markmr2gi204";
const ACCESS_TOKEN = "Fli_OMdKgUFw6tEX3uv6HqvptuG6A6jn9bZVPlHZj8E";

/**
 * @param raw {any}
 * @returns CommonStrings
 */
function toCommonStringsMap(raw) {
  /** @type CommonStrings */
  const result = {};

  for (let item of raw.items) {
    const fields = item.fields;
    const key = fields.id && fields.id.en;
    const value = fields.value;
    if (key && value) {
      result[key] = value;
    }
  }

  return result;
}

async function getRawCommonStrings() {
  const search = new URLSearchParams();
  search.append('locale', '*');
  search.append('metadata.tags.sys.id[in]', COMMON_STRING_TAG);
  search.append('access_token', ACCESS_TOKEN);
  const url = `${ORIGIN}/spaces/${SPACE_ID}/entries?${search.toString()}`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Got HTTP ${res.statusCode}`));
        return;
      }
      /** @type Buffer[] */
      const chunks = [];
      res.on('data', chunk => {
        chunks.push(chunk);
      });
      res.on('end', () => {
        const data = Buffer.concat(chunks);
        resolve(JSON.parse(data.toString('utf-8')));
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  const raw = await getRawCommonStrings();
  const map = toCommonStringsMap(raw);
  console.log(JSON.stringify(map, null, 2));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
