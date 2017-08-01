// filter repeated values in rbas and owners
// uses Set which enforces uniqueness
// see: https://stackoverflow.com/a/44601543/991673
export function uniq(_array) {
  return Array.from(new Set(_array.map(JSON.stringify))).map(JSON.parse);
};
