import { getPathForOtherPortfolioMethod, isWowzaPath } from "./WowzaToggle";

describe("isWowzaPath()", () => {
  it("works", () => {
    expect(isWowzaPath("/boop")).toBe(true);
    expect(isWowzaPath("/wowza")).toBe(true);
    expect(isWowzaPath("/en/address/1425/wowza/avenue")).toBe(true);
    expect(isWowzaPath("/en/legacy/blah?bee=1")).toBe(false);
  });
});

describe("getPathForOtherPortfolioMethod()", () => {
  it("works", () => {
    expect(getPathForOtherPortfolioMethod("/en/address/boop")).toBe("/en/legacy/address/boop");
    expect(getPathForOtherPortfolioMethod("/es/legacy/address/blah")).toBe("/es/address/blah");
  });
});
