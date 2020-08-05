// import _clone from 'lodash/clone';
// import _xor from 'lodash/xor';
// import _keys from 'lodash/keys';
import _pickBy from "lodash/pickBy";
import { deepEqual as assertDeepEqual } from "assert";
import { SupportedLocale } from "../i18n-base";
import { SearchAddressWithoutBbl } from "components/APIDataTypes";

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

export const longDateOptions = { year: "numeric", month: "short", day: "numeric" };
export const mediumDateOptions = { year: "numeric", month: "long" };
export const shortDateOptions = { month: "short" };

/**
 * Assert that the given argument isn't undefined and return it. Throw
 * an exception otherwise.
 *
 * This is primarily useful for situations where we're unable to
 * statically verify that something isn't undefined (e.g. due to the limitations
 * of typings we didn't write) but are sure it won't be in practice.
 */
export function assertNotUndefined<T>(thing: T | undefined): T | never {
  if (thing === undefined) {
    throw new Error("Assertion failure, expected argument to not be undefined!");
  }
  return thing;
}

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
      window.Rollbar.error("Address improperly formatted for DDO:", addr || "<falsy value>");
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
};
