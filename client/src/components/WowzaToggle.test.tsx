import { Trans } from "@lingui/react";
import { parseLocaleFromPath, removeLocalePrefix } from "i18n";
import React from "react";
import { useHistory, useLocation } from "react-router-dom";

/**
 * Determines whether a url corresponds to a new WOWZA portfolio mapping page vs an original.
 */
const isWowzaPath = (pathname: string) => removeLocalePrefix(pathname).startsWith("/wowza");

/**
 * If the user is on a normal WOW address page, this function generates a pathname for the corresponding
 * WOWZA page with updated portfolio mapping, and vice versa.
 */
const getPathForOtherPortfolioMethod = (pathname: string) => {
  if (isWowzaPath(pathname)) {
    return pathname.replace("/wowza", "");
  } else {
    const locale = parseLocaleFromPath(pathname);
    return `/${locale}/wowza${removeLocalePrefix(pathname)}`;
  }
};

describe("isWowzaPath()", () => {
  it("works", () => {
    expect(isWowzaPath("/boop")).toBe(false);
    expect(isWowzaPath("/wowza")).toBe(false);
    expect(isWowzaPath("/en/address/1425/wowza/avenue")).toBe(false);
    expect(isWowzaPath("/en/wowza/blah?bee=1")).toBe(true);
  });
});

describe("getPathForOtherPortfolioMethod()", () => {
  it("works", () => {
    expect(getPathForOtherPortfolioMethod("/en/address/boop")).toBe("/en/wowza/address/boop");
    expect(getPathForOtherPortfolioMethod("/es/wowza/address/blah")).toBe("/es/address/blah");
  });
});
