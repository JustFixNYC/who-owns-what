import React from 'react';
import {
  withRouter,
  RouteComponentProps,
  Route,
  LinkProps,
  Link,
  NavLinkProps,
  Redirect,
  RedirectProps,
  NavLink
} from 'react-router-dom';
import { I18nProvider } from '@lingui/react';

import catalogEn from './locales/en/messages';
import catalogEs from './locales/es/messages';
import { LocationDescriptorObject, History } from 'history';

/**
 * This feature flag determines whether to actively "promote"
 * locales other than English to users. It's useful while we're
 * working on actually translating the app, before we're finished,
 * to ensure that we don't invite users to opt-in to a feature
 * that isn't actually finished yet.
 * 
 * If disabled, we'll still allow other locales' routes to be
 * accessed--we just won't actively send users there, or show links
 * that send them there.
 */
const ENABLE_PUBLIC_FACING_I18N = !!process.env.REACT_APP_ENABLE_PUBLIC_FACING_I18N;

/** Our supported locales. */
type Locale = 'en'|'es';

/** The structure for message catalogs that lingui expects. */
type LocaleCatalog = {
  [P in Locale]: any
};

/** Message catalogs for our supported locales. */
const catalogs: LocaleCatalog = {
  en: catalogEn,
  es: catalogEs,
};

/** A type that maps locales to language names. */
type LocaleLanguages = {
  [P in Locale]: string
};

const languages: LocaleLanguages = {
  en: 'English',
  es: 'Español'
};

/**
 * The fallback default locale to use if we don't support the
 * browser's preferred locale.
 */
const defaultLocale: Locale = 'en';

/**
 * Return the best possible guess at what the default locale
 * should be, taking into account the current browser's language
 * preferences and the locales we support.
 */
function getBestDefaultLocale(): Locale {
  const preferredLocale = navigator.language.slice(0, 2);

  if (isSupportedLocale(preferredLocale) && ENABLE_PUBLIC_FACING_I18N) {
    return preferredLocale;
  }

  return defaultLocale;
}

/**
 * A default renderer for lingui. For details on why we need this, see:
 * 
 *   https://github.com/lingui/js-lingui/issues/592
 */
function defaultI18nRender(props: {translation: string|any[]}): JSX.Element {
  // For some reason using a React fragment here fails with:
  //
  //   React.createElement: type is invalid -- expected a string (for built-in components)
  //   or a class/function (for composite components) but got: undefined. You likely forgot
  //   to export your component from the file it's defined in.
  //
  // I think this has to do with the way that we're being called by lingui.

  return <span>{props.translation}</span>;
}

/** Return whether the given string is a supported locale. */
function isSupportedLocale(code: string): code is Locale {
  return code in catalogs;
}

/**
 * Given a path (e.g. `/en/boop`), return the locale of the first
 * component of the path if it's a supported locale.
 * 
 * Return null if there is no locale, or if it's an unsupported one.
 */
function parseLocaleFromPath(path: string): Locale|null {
  const localeMatch = path.match(/^\/([a-z][a-z])\//);
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
function localeFromRouter(routerProps: RouteComponentProps): Locale {
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
export const I18n = withRouter(function I18nWithoutRouter(props: {children: any} & RouteComponentProps): JSX.Element {
  const { pathname } = props.location;
  const locale = parseLocaleFromPath(pathname);

  if (!locale) {
    return <Redirect to={`/${getBestDefaultLocale()}${pathname}`} />;
  }

  return <I18nProvider language={locale} catalogs={catalogs} defaultRender={defaultI18nRender}>
    {props.children}
  </I18nProvider>
});

/**
 * Prefix the given path with the current locale, taken from the given React Router props.
 */
function localePrefixPath(routerProps: RouteComponentProps, path: History.LocationDescriptor): History.LocationDescriptor {
  const locale = localeFromRouter(routerProps);

  if (typeof(path) === 'string') {
    return `/${locale}${path}`;
  }

  return {
    ...path,
    pathname: `/${locale}${path.pathname}`
  };
}

/**
 * Given a locale-prefixed path (e.g. `/en/boop`), return the same path
 * without the locale prefix (e.g. `/boop`).
 */
function removeLocalePrefix(path: string): string {
  const pathParts = path.split('/');
  pathParts.splice(1, 1);
  return pathParts.join('/');
}

/**
 * A UI affordance that allows the user to switch locales.
 */
export const LocaleSwitcher = withRouter(function LocaleSwitcher(props: RouteComponentProps) {
  const locale = localeFromRouter(props);
  const toLocale: Locale = locale === 'en' ? 'es' : 'en';
  const to = `/${toLocale}${removeLocalePrefix(props.location.pathname)}`;

  return ENABLE_PUBLIC_FACING_I18N
    ? <NavLink to={to}>{languages[toLocale]}</NavLink>
    : null;
});

/**
 * Like React Router's <NavLink>, but it prefixes the passed-in `to` prop with
 * the current locale.
 */
export function LocaleNavLink(props: NavLinkProps & {to: string}): JSX.Element {
  return <Route render={rProps => 
    <NavLink {...props} to={localePrefixPath(rProps, props.to)} />
  } />;
}

/**
 * Like React Router's <Link>, but it prefixes the passed-in `to` prop with
 * the current locale.
 */
export function LocaleLink(props: LinkProps & {to: string}): JSX.Element {
  return <Route render={rProps => 
    <Link {...props} to={localePrefixPath(rProps, props.to)} />
  } />;
}

/**
 * Like React Router's <Redirect>, but it prefixes the passed-in `to` prop with
 * the current locale.
 */
export function LocaleRedirect(props: Omit<RedirectProps, 'to'> & {to: LocationDescriptorObject}): JSX.Element {
  return <Route render={rProps => 
    <Redirect {...props} to={localePrefixPath(rProps, props.to)} />
  } />;
}
