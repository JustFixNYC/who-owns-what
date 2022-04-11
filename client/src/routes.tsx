import { SearchAddressWithoutBbl } from "components/APIDataTypes";
import { reportError } from "error-reporting";
import { removeLocalePrefix } from "i18n";

export type AddressPageUrlParams = SearchAddressWithoutBbl & {
  locale?: string;
};

export type AddressPageRoutes = ReturnType<typeof createAddressPageRoutes>;

/**
 * Determines whether a url corresponds to an Address Page.
 */
export const isAddressPageRoute = (pathname: string) => {
  let path = removeLocalePrefix(pathname);
  if (path.startsWith("/legacy")) path = path.replace("/legacy", "");
  return path.startsWith("/address");
};

export const createRouteForAddressPage = (
  params: AddressPageUrlParams,
  isLegacyRoute?: boolean
) => {
  let route = `/address/${encodeURIComponent(params.boro)}/${encodeURIComponent(
    params.housenumber ? params.housenumber : " "
  )}/${encodeURIComponent(params.streetname)}`;

  const allowChangingPortfolioMethod =
    process.env.REACT_APP_ENABLE_NEW_WOWZA_PORTFOLIO_MAPPING === "1";

  if (isLegacyRoute && allowChangingPortfolioMethod) route = "/legacy" + route;

  if (route.includes(" ")) {
    reportError("An Address Page URL was not encoded properly! There's a space in the URL.");
    route = route.replace(" ", "%20");
  }

  if (params.locale) {
    route = `/${params.locale}${route}`;
  }

  return route;
};

export const createRouteForFullBbl = (bbl: string, prefix?: string, isLegacyRoute?: boolean) => {
  let route = `/bbl/${bbl}`;
  const allowChangingPortfolioMethod =
    process.env.REACT_APP_ENABLE_NEW_WOWZA_PORTFOLIO_MAPPING === "1";
  if (isLegacyRoute && allowChangingPortfolioMethod) route = "/legacy" + route;
  if (prefix) route = `/${prefix}` + route;
  return route;
};

export const createAddressPageRoutes = (
  prefix: string | AddressPageUrlParams,
  isLegacyRoute?: boolean
) => {
  if (typeof prefix === "object") {
    prefix = createRouteForAddressPage(prefix, isLegacyRoute);
  }
  return {
    overview: `${prefix}`,
    timeline: `${prefix}/timeline`,
    portfolio: `${prefix}/portfolio`,
    summary: `${prefix}/summary`,
  };
};

export const createCoreRoutePaths = (prefix?: string) => {
  const pathPrefix = prefix || "";
  return {
    home: `${pathPrefix}/`,
    addressPage: createAddressPageRoutes(`${pathPrefix}/address/:boro/:housenumber/:streetname`),
    /** Note: this path doesn't correspond to a stable page on the site. It simply provides an entry point that
     * immediately redirects to an addressPageOverview. This path is helpful for folks who, say, have a list of
     * bbl values in a spreadsheet and want to easily generate direct links to WhoOwnsWhat.
     * See `BBLPage.tsx` for more details.
     */
    bbl: `${pathPrefix}/bbl/:bbl`,
    about: `${pathPrefix}/about`,
    howToUse: `${pathPrefix}/how-to-use`,
    methodology: `${pathPrefix}/how-it-works`,
    termsOfUse: `${pathPrefix}/terms-of-use`,
    privacyPolicy: `${pathPrefix}/privacy-policy`,
  };
};

export const createWhoOwnsWhatRoutePaths = (prefix?: string) => {
  const pathPrefix = prefix || "";
  return {
    ...createCoreRoutePaths(pathPrefix),
    legacy: {
      ...createCoreRoutePaths(`${pathPrefix}/legacy`),
    },
    /** This route path corresponds to a page identical to the `bbl` route above, but with an older url
     * pattern that we want to support so as not to break any old links that exist out in the web.
     */
    bblSeparatedIntoParts: `${pathPrefix}/bbl/:boro/:block/:lot`,
    oldWowzaPath: `${pathPrefix}/wowza`,
    dev: `${pathPrefix}/dev`,
  };
};

/**
 * In other words, get the current site url without its url paths, i.e. `https://whoownswhat.justfix.nyc`
 */
export const getSiteOrigin = () => `${window.location.protocol}//${window.location.host}`;
