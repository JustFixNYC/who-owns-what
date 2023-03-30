import React from "react";
import {
  withRouter,
  RouteComponentProps,
  Route,
  LinkProps,
  Link,
  NavLinkProps,
  Redirect,
  RedirectProps,
  NavLink,
} from "react-router-dom";
import { I18nProvider } from "@lingui/react";

import catalogEn from "./locales/en/messages";
import catalogEs from "./locales/es/messages";
import { LocationDescriptorObject, History } from "history";
import { SupportedLocale, defaultLocale, isSupportedLocale } from "./i18n-base";
import { logAmplitudeEvent } from "./components/Amplitude";

/** The structure for message catalogs that lingui expects. */
type LocaleCatalog = {
  [P in SupportedLocale]: any;
};

/** Message catalogs for our supported locales. */
const catalogs: LocaleCatalog = {
  en: catalogEn,
  es: catalogEs,
};

/**
 * Return the best possible guess at what the default locale
 * should be, taking into account the current browser's language
 * preferences and the locales we support.
 */
function getBestDefaultLocale(): SupportedLocale {
  const preferredLocale = navigator.language.slice(0, 2);

  if (isSupportedLocale(preferredLocale)) {
    return preferredLocale;
  }

  return defaultLocale;
}

/**
 * Given a path (e.g. `/en/boop`), return the locale of the first
 * component of the path if it's a supported locale.
 *
 * Return null if there is no locale, or if it's an unsupported one.
 */
export function parseLocaleFromPath(path: string): SupportedLocale | null {
  const localeMatch = path.match(/^\/([a-z][a-z])/);
  if (localeMatch) {
    const code = localeMatch[1];
    if (isSupportedLocale(code)) {
      return code;
    }
  }

  return null;
}

/**
 * Return the current locale given React Router props, throwing an
 * assertion failure if the current pathname doesn't have a
 * locale prefix.
 */
export function localeFromRouter(routerProps: RouteComponentProps): SupportedLocale {
  const { pathname } = routerProps.location;
  const locale = parseLocaleFromPath(pathname);

  if (!locale) {
    throw new Error(`"${pathname}" does not start with a valid locale!`);
  }

  return locale;
}

/**
 * A wrapper for lingui's `<I18nProvider>` that activates a localization based on the
 * current path.
 *
 * If the current path contains no localization information, the component will redirect
 * to a new URL that consists of the best possible default locale, followed by the current
 * path (e.g. it will redirect from `/boop` to `/es/boop` for browsers that indicate their
 * language preference is Spanish).
 */
export const I18n = withRouter(function I18nWithoutRouter(
  props: { children: any } & RouteComponentProps
): JSX.Element {
  const { pathname, search } = props.location;
  const locale = parseLocaleFromPath(pathname);

  if (!locale) {
    return <Redirect to={`/${getBestDefaultLocale()}${pathname}${search}`} />;
  }

  return (
    <I18nProvider language={locale} catalogs={catalogs}>
      {props.children}
    </I18nProvider>
  );
});

/**
 * Prefix the given path with the current locale, taken from the given React Router props.
 */
export function localePrefixPath(
  routerProps: RouteComponentProps,
  path: History.LocationDescriptor
): History.LocationDescriptor {
  const locale = localeFromRouter(routerProps);

  if (typeof path === "string") {
    return `/${locale}${path}`;
  }

  return {
    ...path,
    pathname: `/${locale}${path.pathname}`,
  };
}

/**
 * Given a locale-prefixed path (e.g. `/en/boop`), return the same path
 * without the locale prefix (e.g. `/boop`).
 */
export function removeLocalePrefix(path: string): string {
  const pathParts = path.split("/");
  pathParts.splice(1, 1);
  return pathParts.join("/");
}

/**
 * A UI affordance that allows the user to switch locales.
 *
 * Since we currently only have two locales, this just offers a toggle to the
 * other language.
 */
export const LocaleSwitcher = withRouter(function LocaleSwitcher(props: RouteComponentProps) {
  const to = (toLocale: SupportedLocale) =>
    `/${toLocale}${removeLocalePrefix(props.location.pathname)}`;

  return (
    <span className="language-toggle">
      <NavLink
        to={to("en")}
        onClick={() => {
          logAmplitudeEvent("switchToEnglish");
          window.gtag("event", "switch-to-english");
        }}
      >
        EN
      </NavLink>
      /
      <NavLink
        to={to("es")}
        onClick={() => {
          logAmplitudeEvent("switchToSpanish");
          window.gtag("event", "switch-to-spanish");
        }}
      >
        ES
      </NavLink>
    </span>
  );
});

/**
 * A UI affordance that allows the user to switch to the locale that isn't currently present.
 *
 * Since we currently only have two locales, this just offers a toggle to the
 * other language.
 */
export const LocaleSwitcherWithFullLanguageName = withRouter(function LocaleSwitcher(
  props: RouteComponentProps
) {
  const to = (toLocale: SupportedLocale) =>
    `/${toLocale}${removeLocalePrefix(props.location.pathname)}`;
  const currentLocale = localeFromRouter(props);

  return currentLocale === "en" ? (
    <NavLink
      to={to("es")}
      onClick={() => {
        logAmplitudeEvent("switchToSpanish");
        window.gtag("event", "switch-to-spanish");
      }}
    >
      Español
    </NavLink>
  ) : (
    <NavLink
      to={to("en")}
      onClick={() => {
        logAmplitudeEvent("switchToEnglish");
        window.gtag("event", "switch-to-english");
      }}
    >
      English
    </NavLink>
  );
});

/**
 * Like React Router's <NavLink>, but it prefixes the passed-in `to` prop with
 * the current locale.
 *
 * Note that this doesn't localize the actual *text* of the link--it only localizes
 * the path!
 */
export function LocaleNavLink(props: NavLinkProps & { to: string }): JSX.Element {
  return (
    <Route render={(rProps) => <NavLink {...props} to={localePrefixPath(rProps, props.to)} />} />
  );
}

/**
 * Like React Router's <Link>, but it prefixes the passed-in `to` prop with
 * the current locale.
 *
 * Note that this doesn't localize the actual *text* of the link--it only localizes
 * the path!
 */
export function LocaleLink(props: LinkProps & { to: string }): JSX.Element {
  return <Route render={(rProps) => <Link {...props} to={localePrefixPath(rProps, props.to)} />} />;
}

/**
 * Like React Router's <Redirect>, but it prefixes the passed-in `to` prop with
 * the current locale.
 */
export function LocaleRedirect(
  props: Omit<RedirectProps, "to"> & { to: LocationDescriptorObject }
): JSX.Element {
  return (
    <Route render={(rProps) => <Redirect {...props} to={localePrefixPath(rProps, props.to)} />} />
  );
}
