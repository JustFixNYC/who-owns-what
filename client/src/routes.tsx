import { SearchAddressWithoutBbl } from "components/APIDataTypes";
import { reportError } from "error-reporting";

export type AddressPageUrlParams = SearchAddressWithoutBbl & {
  locale?: string;
};

export type AddressPageRoutes = ReturnType<typeof createAddressPageRoutes>;

export const createRouteForAddressPage = (params: AddressPageUrlParams) => {
  let route = `/address/${encodeURIComponent(params.boro)}/${encodeURIComponent(
    params.housenumber ? params.housenumber : " "
  )}/${encodeURIComponent(params.streetname)}`;

  if (route.includes(" ")) {
    reportError("An Address Page URL was not encoded properly! There's a space in the URL.");
    route = route.replace(" ", "%20");
  }

  if (params.locale) {
    route = `/${params.locale}${route}`;
  }

  return route;
};

export const createRouteForFullBbl = (bbl: string) => {
  return `/bbl/${bbl}`;
};

export const createAddressPageRoutes = (prefix: string | AddressPageUrlParams) => {
  if (typeof prefix === "object") {
    prefix = createRouteForAddressPage(prefix);
  }
  return {
    overview: `${prefix}`,
    timeline: `${prefix}/timeline`,
    portfolio: `${prefix}/portfolio`,
    summary: `${prefix}/summary`,
  };
};

export const createWhoOwnsWhatRoutePaths = (prefix?: string) => {
  const pathPrefix = prefix || "";
  return {
    home: `${pathPrefix}/`,
    addressPage: createAddressPageRoutes(`${pathPrefix}/address/:boro/:housenumber/:streetname`),
    wowzaAddressPage: createAddressPageRoutes(
      `${pathPrefix}/wowza/address/:boro/:housenumber/:streetname`
    ),
    /** Note: this path doesn't correspond to a stable page on the site. It simply provides an entry point that
     * immediately redirects to an addressPageOverview. This path is helpful for folks who, say, have a list of
     * boro, block, lot values in a spreadsheet and want to easily generate direct links to WhoOwnsWhat.
     * See `BBLPage.tsx` for more details.
     */
    bbl: `${pathPrefix}/bbl/:boro/:block/:lot`,
    /** Note: this path doesn't correspond to a stable page on the site. It simply provides an entry point that
     * immediately redirects to an addressPageOverview. This path is helpful for folks who, say, have a list of
     * bbl values in a spreadsheet and want to easily generate direct links to WhoOwnsWhat.
     * See `BBLPage.tsx` for more details.
     */
    bblWithFullBblInUrl: `${pathPrefix}/bbl/:bbl`,
    about: `${pathPrefix}/about`,
    howToUse: `${pathPrefix}/how-to-use`,
    methodology: `${pathPrefix}/how-it-works`,
    termsOfUse: `${pathPrefix}/terms-of-use`,
    privacyPolicy: `${pathPrefix}/privacy-policy`,
    dev: `${pathPrefix}/dev`,
  };
};

/**
 * In other words, get the current site url without its url paths, i.e. `https://whoownswhat.justfix.nyc`
 */
export const getSiteOrigin = () => `${window.location.protocol}//${window.location.host}`;
