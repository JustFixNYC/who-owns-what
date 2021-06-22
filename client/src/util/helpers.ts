// import _clone from 'lodash/clone';
// import _xor from 'lodash/xor';
// import _keys from 'lodash/keys';
import _pickBy from "lodash/pickBy";
import { deepEqual as assertDeepEqual } from "assert";
import { SupportedLocale } from "../i18n-base";
import { HpdContactAddress, SearchAddressWithoutBbl } from "components/APIDataTypes";
import { reportError } from "error-reporting";
import { t } from "@lingui/macro";
import { I18n, MessageDescriptor } from "@lingui/core";

/**
 * An array consisting of Who Owns What's standard enumerations for street names,
 * (which come from the PLUTO dataset fron NYC's Dept. of City Planning)
 * and the corresponding format preferred by HPD as a url parameter.
 * NOTE: seems HPD only cares about these formats for numbers 1 to 10
 */
const hpdNumberTransformations = [
  ["FIRST", "1"],
  ["SECOND", "2"],
  ["THIRD", "3"],
  ["FOURTH", "4"],
  ["FIFTH", "5"],
  ["SIXTH", "6"],
  ["SEVENTH", "7"],
  ["EIGHTH", "8"],
  ["NINTH", "9"],
  ["TENTH", "10"],
];

const hpdComplaintTypeTranslations = new Map([
  ["DOOR/WINDOW", t`DOOR/WINDOW`],
  ["HEATING", t`HEATING`],
  ["STAIRS", t`STAIRS`],
  ["CONSTRUCTION", t`CONSTRUCTION`],
  ["JANITOR/SUPER", t`JANITOR/SUPER`],
  ["OUTSIDE BUILDING", t`OUTSIDE BUILDING`],
  ["BELL/BUZZER/INTERCOM", t`BELL/BUZZER/INTERCOM`],
  ["SEWAGE", t`SEWAGE`],
  ["FIRE-ESCAPE", t`FIRE ESCAPE`],
  ["SIGNAGE MISSING", t`SIGNAGE MISSING`],
  ["PESTS", t`PESTS`],
  ["MAILBOX", t`MAILBOX`],
  ["WINDOWS", t`WINDOWS`],
  ["ELEVATOR", t`ELEVATOR`],
  ["GARBAGE/RECYCLING STORAGE", t`GARBAGE/RECYCLING STORAGE`],
  ["CABINET", t`CABINET`],
  ["TENANT HARASSMENT", t`TENANT HARASSMENT`],
  ["WINDOW GUARDS", t`WINDOW GUARDS`],
  ["FLOOR", t`FLOOR`],
  ["PLUMBING", t`PLUMBING`],
  ["VENTILATION SYSTEM", t`VENTILATION SYSTEM`],
  ["MOLD", t`MOLD`],
  ["WATER LEAK", t`WATER LEAK`],
  ["ELECTRIC", t`ELECTRIC`],
  ["FLOORING/STAIRS", t`FLOORING/STAIRS`],
  ["PAINT/PLASTER", t`PAINT/PLASTER`],
  ["APPLIANCE", t`APPLIANCE`],
  ["NONCONST", t`NON-CONSTRUCTION`],
  ["CERAMIC-TILE", t`CERAMIC TILE`],
  ["COOKING GAS", t`COOKING GAS`],
  ["SAFETY", t`SAFETY`],
  ["HEAT/HOT WATER", t`HEAT/HOT WATER`],
  ["DOORS", t`DOORS`],
  ["LOCKS", t`LOCKS`],
]);

const hpdContactTitleTranslations = new Map([
  ["HeadOfficer", t`Head Officer`],
  ["CorporateOwner", t`Corporate Owner`],
  ["IndividualOwner", t`Individual Owner`],
  ["JointOwner", t`Joint Owner`],
  ["SiteManager", t`Site Manager`],
  ["Agent", t`Agent`],
  ["Lessee", t`Lessee`],
  ["Officer", t`Officer`],
  ["Shareholder", t`Shareholder`],
  ["Corporation", t`Corporation`],
]);

export const longDateOptions = { year: "numeric", month: "short", day: "numeric" };
export const mediumDateOptions = { year: "numeric", month: "long" };
export const shortDateOptions = { month: "short" };

const createTranslationFunctionFromMap = (
  map: Map<string, MessageDescriptor>,
  description: string,
  localeOverride?: SupportedLocale
) => (textToTranslate: string, i18n: I18n) => {
  const translatedType = map.get(textToTranslate);
  if (!translatedType) {
    reportError(`The ${description} "${textToTranslate}" isn't internationalized`);
    return textToTranslate;
  } else return i18n.use(localeOverride || i18n.language)._(translatedType);
};

const translateComplaintType = createTranslationFunctionFromMap(
  hpdComplaintTypeTranslations,
  "HPD Complaint type"
);
const translateContactTitle = createTranslationFunctionFromMap(
  hpdContactTitleTranslations,
  "HPD Contact title"
);
const getContactTitleInEnglish = createTranslationFunctionFromMap(
  hpdContactTitleTranslations,
  "HPD Contact title",
  "en"
);

export function searchAddrsAreEqual(
  addr1: SearchAddressWithoutBbl,
  addr2: SearchAddressWithoutBbl
) {
  return (
    addr1.boro === addr2.boro &&
    addr1.streetname === addr2.streetname &&
    addr1.housenumber === addr2.housenumber
  );
}

export default {
  // filter repeated values in rbas and owners
  // uses Set which enforces uniqueness
  // see: https://stackoverflow.com/a/44601543/991673
  uniq<T>(_array: T[]): T[] {
    return Array.from(new Set(_array.map((val) => JSON.stringify(val)))).map((val) =>
      JSON.parse(val)
    );
  },

  find<T, K extends keyof T>(array: T[], attrib: K, value: T[K]): T | null {
    for (let i = 0; i < array.length; i++) {
      if (array[i][attrib] === value) return array[i];
    }
    return null;
  },

  maxArray(array: number[]): number {
    var max = 0;
    for (let i = 0; i < array.length; i++) {
      if (max < array[i]) {
        max = array[i];
      }
    }
    return max;
  },

  splitBBL(bbl: string) {
    const bblArr = bbl.split("");
    const boro = bblArr.slice(0, 1).join("");
    const block = bblArr.slice(1, 6).join("");
    const lot = bblArr.slice(6, 10).join("");
    return { boro, block, lot };
  },

  addrsAreEqual<T extends { bbl: string }>(a: T, b: T) {
    return a.bbl === b.bbl;
  },

  jsonEqual(a: any, b: any): boolean {
    try {
      assertDeepEqual(a, b);
      return true;
    } catch (e) {
      return false;
    }
  },

  formatPrice(amount: number, locale?: SupportedLocale): string {
    const formatPrice = new Intl.NumberFormat(locale || "en");
    return formatPrice.format(amount);
  },

  createTakeActionURL(
    addr: { boro?: string; housenumber: string; streetname: string } | null | undefined,
    utm_medium: string
  ) {
    const subdomain = process.env.REACT_APP_DEMO_SITE === "1" ? "demo" : "app";
    if (addr && addr.boro && (addr.housenumber || addr.streetname)) {
      const formattedBoro = addr.boro.toUpperCase().replace(/ /g, "_");
      if (["BROOKLYN", "QUEENS", "BRONX", "MANHATTAN", "STATEN_ISLAND"].includes(formattedBoro)) {
        const fullAddress = (
          addr.housenumber +
          (addr.housenumber && addr.streetname && " ") +
          addr.streetname
        ).trim();
        return `https://${subdomain}.justfix.nyc/ddo?address=${encodeURIComponent(
          fullAddress
        )}&borough=${encodeURIComponent(
          formattedBoro
        )}&utm_source=whoownswhat&utm_content=take_action&utm_medium=${utm_medium}`;
      }
    } else {
      reportError(`Address improperly formatted for DDO: ${addr || "<falsy value>"}`);
      return `https://${subdomain}.justfix.nyc/?utm_source=whoownswhat&utm_content=take_action_failed_attempt&utm_medium=${utm_medium}`;
    }
  },

  intersectAddrObjects(a: any, b: any) {
    return _pickBy(a, function (v, k) {
      return b[k] === v;
    });
  },

  capitalize(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  titleCase(string: string): string {
    return string
      .toLowerCase()
      .split(" ")
      .map(function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  },

  formatDate(dateString: string, options: object, locale?: SupportedLocale): string {
    var date = new Date(dateString);
    return this.capitalize(date.toLocaleDateString(locale || "en", options));
  },

  /** The quarter number written out as it's range of months (ex: "1" becomes "Jan - Mar")  */
  getMonthRangeFromQuarter(quarter: "1" | "2" | "3" | "4", locale?: SupportedLocale): string {
    const monthRange = {
      start: (parseInt(quarter) * 3 - 2).toString().padStart(2, "0"), // i.e "01"
      end: (parseInt(quarter) * 3).toString().padStart(2, "0"), // i.e. "03"
    };

    // Note: the year and day of each of these dates is meaningless, as we only need to extract the month
    const startDate = `2000-${monthRange.start}-15`;
    const endDate = `2000-${monthRange.end}-15`;

    return `${this.formatDate(startDate, { month: "short" }, locale).slice(
      0,
      3
    )} - ${this.formatDate(endDate, { month: "short" }, locale).slice(0, 3)}`;
  },

  formatStreetNameForHpdLink(streetName: string): string {
    var arr = streetName.split(" ");
    if (arr === []) {
      return "";
    }
    // Reformat street name directional prefix
    const newStreetNamePrefix =
      arr[0].toUpperCase() === "NORTH"
        ? "N"
        : arr[0].toUpperCase() === "SOUTH"
        ? "S"
        : arr[0].toUpperCase() === "EAST"
        ? "E"
        : arr[0].toUpperCase() === "WEST"
        ? "W"
        : arr[0];
    arr[0] = newStreetNamePrefix;

    // Reformat street name enumeration
    hpdNumberTransformations.forEach((numberPair) => {
      const index = arr.findIndex((e) => e.toUpperCase() === numberPair[0]);
      if (index > -1) {
        arr[index] = numberPair[1];
      }
    });
    return arr.join(" ");
  },

  formatHpdContactAddress(
    address: HpdContactAddress
  ): { addressLine1: string; addressLine2: string } {
    const { housenumber, streetname, apartment, city, state, zip } = address;
    const cityFormatted = city && state ? `${city},` : city;

    const formatArrayAsString = (addrs: (string | null)[]) =>
      addrs
        .filter((x) => !!x)
        .join(" ")
        .toUpperCase();

    return {
      addressLine1: formatArrayAsString([housenumber, streetname, apartment]),
      addressLine2: formatArrayAsString([cityFormatted, state, zip]),
    };
  },

  translateComplaintType,
  translateContactTitle,

  /**
   * Translates a HPD Contact title into a target language, and if the target language
   * isn't English, includes the English translation as well alongside it.
   *
   * For example, this function takes the title `HeadOfficer`, and spits out:
   * - 'Head Officer' if the target language is English
   * - 'Oficial principal ("Head Officer" en inglés)"' if the target language is Spanish
   */
  translateContactTitleAndIncludeEnglish(textToTranslate: string, i18n: I18n) {
    const translation = translateContactTitle(textToTranslate, i18n);
    if (i18n.language === "en") return translation;
    else {
      const textInEnglish = getContactTitleInEnglish(textToTranslate, i18n);
      const translationSuffix = i18n._(t`("${textInEnglish}" in English)`);
      return translation + " " + translationSuffix;
    }
  },
};
