/* eslint-disable */

// left: 37, up: 38, right: 39, down: 40,
// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
// var keys = {37: 1, 38: 1, 39: 1, 40: 1};
//
// function preventDefault(e) {
//   e = e || window.event;
//   if (e.preventDefault)
//       e.preventDefault();
//   e.returnValue = false;
// }
//
// function preventDefaultForScrollKeys(e) {
//     if (keys[e.keyCode]) {
//         preventDefault(e);
//         return false;
//     }
// }

export default {

  isMobile(): boolean {
    let width = 0;
    if(typeof window != 'undefined') {
      width =  window.innerWidth && document.documentElement.clientWidth ?
        Math.min(window.innerWidth, document.documentElement.clientWidth) :
        window.innerWidth ||
        document.documentElement.clientWidth ||
        document.getElementsByTagName('body')[0].clientWidth;
    }
    return width <= 599;
  },

  getMobileOperatingSystem(): string {
    var userAgent = navigator.userAgent || navigator.vendor;
  
        // Windows Phone must come first because its UA also contains "Android"
      if (/android/i.test(userAgent)) {
          return "Android";
      }
  
      // iOS detection from: http://stackoverflow.com/a/9039885/177710
      if (/iPad|iPhone|iPod/.test(userAgent)) {
          return "iOS";
      }
  
      return "";
  },

  isIE(): boolean {
    if(typeof window != 'undefined') {
      return /MSIE \d|Trident.*rv:/.test(window.navigator.userAgent);
    }
    return false;
  },

  getParameterByName(name: string, url: string): string|null {
      if (!url && typeof window != 'undefined') url = window.location.href;
      name = name.replace(/[\[\]]/g, "\\$&");
      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
          results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
  }
};
