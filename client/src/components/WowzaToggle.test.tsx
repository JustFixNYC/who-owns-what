import { getPathForOtherPortfolioMethod, isLegacyPath } from "./WowzaToggle";

describe("isLegacyPath()", () => {
  it("works", () => {
    expect(isLegacyPath("/boop")).toBe(false);
    expect(isLegacyPath("/en/address/1425/wowza/avenue")).toBe(false);
    expect(isLegacyPath("/en/legacy/blah?bee=1")).toBe(true);
  });
});

describe("getPathForOtherPortfolioMethod()", () => {
  it("works", () => {
    expect(getPathForOtherPortfolioMethod("/en/address/boop")).toBe("/en/legacy/address/boop");
    expect(getPathForOtherPortfolioMethod("/es/legacy/address/blah")).toBe("/es/address/blah");
  });
});
