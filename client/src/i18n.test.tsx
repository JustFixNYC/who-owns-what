import {
  removeLocalePrefix,
  parseLocaleFromPath,
  localeFromRouter,
  localePrefixPath,
} from "./i18n";

function routerProps(pathname: string): any {
  return { location: { pathname } };
}

describe("i18n", () => {
  it("removes locale prefixes from paths", () => {
    expect(removeLocalePrefix("/en/boop")).toBe("/boop");
  });

  it("parses locales from paths when present", () => {
    expect(parseLocaleFromPath("/es/blarf")).toBe("es");
  });

  it("parses nothing from paths when locale is not present", () => {
    expect(parseLocaleFromPath("/blarf")).toBe(null);
  });

  it("extracts locale from router path", () => {
    expect(localeFromRouter(routerProps("/es/boop"))).toBe("es");
  });

  it("raises an assertion failure when locale is not present in router path", () => {
    expect(() => localeFromRouter(routerProps("/boop"))).toThrow(
      '"/boop" does not start with a valid locale!'
    );
  });

  it("prefixes string paths with current locale", () => {
    expect(localePrefixPath(routerProps("/es/narg"), "/boop/flarg")).toBe("/es/boop/flarg");
  });

  it("prefixes object paths with current locale", () => {
    expect(
      localePrefixPath(routerProps("/es/narg"), {
        pathname: "/boop/flarg",
        search: "?foo",
      })
    ).toEqual({
      pathname: "/es/boop/flarg",
      search: "?foo",
    });
  });
});
