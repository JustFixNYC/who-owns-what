// import _clone from 'lodash/clone';
// import _xor from 'lodash/xor';
// import _keys from 'lodash/keys';
import _pickBy from 'lodash/pickBy';
import { deepEqual as assertDeepEqual } from 'assert';
import nycha_bbls from '../data/nycha_bbls.json';

/**
 * Urg, our codebase wasn't originally written in TypeScript and
 * some of our legacy code appears to pass around numbers as strings,
 * so this type accounts for that.
 */
export type MaybeStringyNumber = string|null|undefined|number;

export default {
  // filter repeated values in rbas and owners
  // uses Set which enforces uniqueness
  // see: https://stackoverflow.com/a/44601543/991673
  uniq<T>(_array: T[]): T[] {
    return Array.from(new Set(_array.map(val => JSON.stringify(val)))).map(val => JSON.parse(val));
  },

  /**
   * Attempts to coerce the given argument into an integer, returning
   * the given default value on failure.
   * 
   * Note that this function will *not* convert a float to an int in
   * any way; if a number is passed in, it is assumed to be an int and
   * returned immediately.
   */
  coerceToInt<T>(value: MaybeStringyNumber, defaultValue: T): number|T {
    if (typeof(value) === 'number' && !isNaN(value)) {
      return value;
    }
    if (typeof(value) === 'string') {
      let intValue = parseInt(value);
      if (!isNaN(intValue)) {
        return intValue;
      }
    }
    return defaultValue;
  },

  find<T, K extends keyof T>(array: T[], attrib: K, value: T[K]): T|null {
    for (let i = 0; i < array.length; i++) {
      if (array[i][attrib] === value) return array[i];
    }
    return null;
  },

  maxArray(array: number[]): number {
    var max = 0; 
    for (let i = 0; i < array.length; i++) {
      if (max < array[i]) {
        max = array[i]
      }
    }
    return max;
  },

  splitBBL(bbl: string) {
    const bblArr = bbl.split('');
    const boro = bblArr.slice(0,1).join('');
    const block = bblArr.slice(1,6).join('');
    const lot = bblArr.slice(6,10).join('');
    return { boro, block, lot };
  },

  addrsAreEqual<T extends {bbl: string}>(a: T, b: T) {
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

  getNychaData(searchBBL: string|number) {
    const bbl = searchBBL.toString();
    for (var index = 0; index < nycha_bbls.length; index++ ) {
     if(nycha_bbls[index].bbl.toString() === bbl) return nycha_bbls[index];
   }
   return null;
  },

  createTakeActionURL(addr: {boro?: string, housenumber: string, streetname: string}|null|undefined, utm_medium: string) {
    if (addr && addr.boro && (addr.housenumber || addr.streetname)) {
      const formattedBoro = addr.boro.toUpperCase().replace(/ /g,"_");
      if (["BROOKLYN","QUEENS","BRONX","MANHATTAN","STATEN_ISLAND"].includes(formattedBoro)) {
        const fullAddress = (addr.housenumber + (addr.housenumber && addr.streetname && ' ') + addr.streetname).trim();
        return ('https://app.justfix.nyc/ddo?address=' + encodeURIComponent(fullAddress) + '&borough=' + encodeURIComponent(formattedBoro) + '&utm_source=whoownswhat&utm_content=take_action&utm_medium=' + utm_medium);
      }
    }
    else {
      window.Rollbar.error("Address improperly formatted for DDO:", addr || '<falsy value>');
      return ('https://app.justfix.nyc/?utm_source=whoownswhat&utm_content=take_action_failed_attempt&utm_medium=' + utm_medium);
    }
  },

  intersectAddrObjects(a: any, b: any) {
    return _pickBy(a, function(v, k) {
    	return b[k] === v;
    });
  },

  capitalize(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  titleCase(string: string): string {
    return string.toLowerCase().split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  },

  formatDate(dateString: string): string {
    var date = new Date(dateString);
    var options = {year: 'numeric', month: 'long'};
    return date.toLocaleDateString("en-US", options);
  }

};
