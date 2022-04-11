import { Trans } from "@lingui/macro";
import { parseLocaleFromPath, removeLocalePrefix } from "i18n";
import React from "react";
import { useHistory, useLocation } from "react-router-dom";
import { isAddressPageRoute } from "routes";

/**
 * Determines whether a url corresponds to a new WOWZA portfolio mapping page vs an old legacy page.
 */
export const isLegacyPath = (pathname: string) =>
  removeLocalePrefix(pathname).startsWith("/legacy");

/**
 * If the user is on a normal WOW address page, this function generates a pathname for the corresponding
 * WOWZA page with updated portfolio mapping, and vice versa.
 */
export const getPathForOtherPortfolioMethod = (pathname: string) => {
  if (isLegacyPath(pathname)) {
    return pathname.replace("/legacy", "");
  } else {
    const locale = parseLocaleFromPath(pathname);
    return `/${locale}/legacy${removeLocalePrefix(pathname)}`;
  }
};

export const ToggleLinkBetweenPortfolioMethods = () => {
  const history = useHistory();
  const { pathname } = useLocation();

  return (
    <button
      onClick={() => {
        history.push(getPathForOtherPortfolioMethod(pathname));
        if (isAddressPageRoute(pathname)) {
          history.go(0);
        }
      }}
    >
      {isLegacyPath(pathname) ? (
        <Trans>Switch to new version</Trans>
      ) : (
        <Trans>Switch to old version</Trans>
      )}
    </button>
  );
};
