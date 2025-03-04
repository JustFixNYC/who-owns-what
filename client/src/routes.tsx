import { SearchAddressWithoutBbl } from "components/APIDataTypes";
import { reportError } from "error-reporting";
import { removeLocalePrefix } from "i18n";

export type AddressPageUrlParams = SearchAddressWithoutBbl & {
  locale?: string;
  indicator?: string;
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

export const removeIndicatorSuffix = (pathname: string) => pathname.replace(/\/:indicator.*/, "");

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
    timeline: `${prefix}/timeline/:indicator?`,
    portfolio: `${prefix}/portfolio`,
    summary: `${prefix}/summary`,
  };
};

export const createAccountRoutePaths = (prefix?: string) => {
  return {
    login: `${prefix}/login`,
    settings: `${prefix}/settings`,
    verifyEmail: `${prefix}/verify-email`,
    forgotPassword: `${prefix}/forgot-password`,
    resetPassword: `${prefix}/reset-password`,
    unsubscribe: `${prefix}/unsubscribe`,
  };
};

export const authRequiredPaths = () => {
  const locales = ["en", "es"];
  let pathnames: string[] = [];
  locales.forEach((locale) => {
    pathnames = pathnames.concat(Object.values(createAccountRoutePaths(`/${locale}/account`)));
  });
  return pathnames;
};

export const createCoreRoutePaths = (prefix?: string) => {
  const pathPrefix = prefix || "";
  return {
    home: `${pathPrefix}/`,
    addressPage: createAddressPageRoutes(`${pathPrefix}/address/:boro/:housenumber/:streetname`),
    account: createAccountRoutePaths(`${pathPrefix}/account`),
    district: `${pathPrefix}/district`,
    /** Note: this path doesn't correspond to a stable page on the site. It simply provides an entry point that
     * immediately redirects to an addressPageOverview. This path is helpful for folks who, say, have a list of
     * bbl values in a spreadsheet and want to easily generate direct links to WhoOwnsWhat.
     * See `BBLPage.tsx` for more details.
     */
    bbl: createAddressPageRoutes(`${pathPrefix}/bbl/:bbl(\\d{10})`),
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
    bblSeparatedIntoParts: `${pathPrefix}/bbl/:boro(\\d+)/:block(\\d+)/:lot(\\d+)`,
    /** Some user testers have been accessing WOW via this pathname which we have since deprecated.
     * Let's make sure all routes with this path structure redirect back to the homepage.
     * See App.tsx and the `WowzaRedirectPage` component in WowzaToggle.tsx for more info.
     */
    oldWowzaPath: `${pathPrefix}/wowza`,
    dev: `${pathPrefix}/dev`,
  };
};

/**
 * In other words, get the current site url without its url paths, i.e. `https://whoownswhat.justfix.org`
 */
export const getSiteOrigin = () => `${window.location.protocol}//${window.location.host}`;
