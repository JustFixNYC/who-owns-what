// import _clone from 'lodash/clone';
// import _xor from 'lodash/xor';
// import _keys from 'lodash/keys';
import _pickBy from 'lodash/pickBy';

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

  maxArray(array) {
    var max = 0; 
    for (let i = 0; i < array.length; i++) {
      if (max < array[i]) {
        max = array[i]
      }
    }
    return max;
  },

  splitBBL(bbl) {
    bbl = bbl.split('');
    const boro = bbl.slice(0,1).join('');
    const block = bbl.slice(1,6).join('');
    const lot = bbl.slice(6,10).join('');
    return { boro, block, lot };
  },

  addrsAreEqual(a, b) {
    return a.bbl === b.bbl;
  },

  jsonEqual(a,b) {
    return JSON.stringify(a) === JSON.stringify(b);
  },

  intersectAddrObjects(a,b){
    return _pickBy(a, function(v, k) {
    	return b[k] === v;
    });
  },

  capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  titleCase(string) {
    return string.toLowerCase().split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  },

  formatDate(dateString) {
    var date = new Date(dateString);
    var options = {year: 'numeric', month: 'long'};
    return date.toLocaleDateString("en-US", options);
  }

};
