import { mapAuthError } from "./Login";
import { NETWORK_AUTH_ERROR } from "./auth-errors";
import { setupI18n } from "@lingui/core";

describe("mapAuthError", () => {
  const i18n = setupI18n();

  it("maps expected OTP and delivery errors", () => {
    expect(mapAuthError("Invalid OTP.", i18n)).toBe("The code you entered is incorrect.");
    expect(mapAuthError("Email delivery failed", i18n)).toBe(
      "We couldn't send the email. Please try again."
    );
    expect(mapAuthError(NETWORK_AUTH_ERROR, i18n)).toBe("Something went wrong. Please try again.");
    expect(mapAuthError("Auth service unavailable", i18n)).toBe(
      "Something went wrong. Please try again."
    );
  });
});
