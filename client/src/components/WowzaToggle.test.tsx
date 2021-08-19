import { getPathForOtherPortfolioMethod, isWowzaPath } from "./WowzaToggle";

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
