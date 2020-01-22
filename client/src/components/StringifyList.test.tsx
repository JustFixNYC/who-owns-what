import { stringifyListWithConjunction } from "./StringifyList";
import { setupI18n } from "@lingui/core";

describe("stringifyListWithConjunction()", () => {
  const i18n = setupI18n();

  it("works", () => {
    expect(stringifyListWithConjunction(i18n, [])).toBe("");
    expect(stringifyListWithConjunction(i18n, ["blah"])).toBe("blah");
    expect(stringifyListWithConjunction(i18n, ["blah", "boop"])).toBe("blah and boop");
    expect(stringifyListWithConjunction(i18n, ["blah", "boop", "bap"])).toBe("blah, boop, and bap");
  });
});
