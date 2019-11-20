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

type Locale = 'en'|'es';

type LocaleCatalog = {
  [P in Locale]: any
};

const catalogs: LocaleCatalog = {
  en: catalogEn,
  es: catalogEs,
};

const defaultLocale: Locale = 'en';

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

function isSupportedLocale(code: string): boolean {
  return code in catalogs;
}

function parseLocaleFromPath(path: string): Locale|null {
  const localeMatch = path.match(/^\/([a-z][a-z])\//);
  if (localeMatch) {
    const code = localeMatch[1];
    if (isSupportedLocale(code)) {
      return code as Locale;
    }
  }

  return null;
}

function localeFromRouter(routerProps: RouteComponentProps): Locale {
  const { pathname } = routerProps.location;
  const locale = parseLocaleFromPath(pathname);

  if (!locale) {
    throw new Error(`"${pathname}" does not start with a valid locale!`);
  }

  return locale;
}

export const I18n = withRouter(function I18nWithoutRouter(props: {children: any} & RouteComponentProps): JSX.Element {
  const { pathname } = props.location;
  const locale = parseLocaleFromPath(pathname);

  if (!locale) {
    return <Redirect to={`/${defaultLocale}${pathname}`} />;
  }

  return <I18nProvider language={locale} catalogs={catalogs} defaultRender={defaultI18nRender}>
    {props.children}
  </I18nProvider>
});

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

export function LocaleNavLink(props: NavLinkProps & {to: string}): JSX.Element {
  return <Route render={rProps => 
    <NavLink {...props} to={localePrefixPath(rProps, props.to)} />
  } />;
}

export function LocaleLink(props: LinkProps & {to: string}): JSX.Element {
  return <Route render={rProps => 
    <Link {...props} to={localePrefixPath(rProps, props.to)} />
  } />;
}

export function LocaleRedirect(props: Omit<RedirectProps, 'to'> & {to: LocationDescriptorObject}): JSX.Element {
  return <Route render={rProps => 
    <Redirect {...props} to={localePrefixPath(rProps, props.to)} />
  } />;
}
