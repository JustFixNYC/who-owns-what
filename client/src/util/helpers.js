export default {
  // filter repeated values in rbas and owners
  // uses Set which enforces uniqueness
  // see: https://stackoverflow.com/a/44601543/991673
  uniq(_array) {
    return Array.from(new Set(_array.map(JSON.stringify))).map(JSON.parse);
  },

  find(array, attrib, value) {
    for (let i = 0; i < array.length; i++) {
      if (array[i][attrib] === value) return array[i];
    }
    return null;
  },

  splitBBL(bbl) {
    bbl = bbl.split('');
    const boro = bbl.slice(0,1).join('');
    const block = bbl.slice(1,6).join('');
    const lot = bbl.slice(6,10).join('');
    return { boro, block, lot };
  }

}
