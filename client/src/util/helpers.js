export default class Helpers {
  // filter repeated values in rbas and owners
  // uses Set which enforces uniqueness
  // see: https://stackoverflow.com/a/44601543/991673
  static uniq(_array) {
    return Array.from(new Set(_array.map(JSON.stringify))).map(JSON.parse);
  };

  static find(array, attrib, value) {
    for (let i = 0; i < array.length; i++) {
      if (array[i][attrib] === value) return array[i];
    }
    return null;
  }

}
