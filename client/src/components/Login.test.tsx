import { OTP_LENGTH, sanitizeOtpValue } from "./CodeEntry";
import { mapAuthError } from "./Login";
import { NETWORK_AUTH_ERROR } from "./auth-errors";
import { setupI18n } from "@lingui/core";

describe("login OTP helpers", () => {
  it("keeps a 6-digit numeric code", () => {
    expect(OTP_LENGTH).toBe(6);
    expect(sanitizeOtpValue("123456")).toBe("123456");
  });

  it("strips non-digits and truncates past 6", () => {
    expect(sanitizeOtpValue("12 34-56789")).toBe("123456");
    expect(sanitizeOtpValue("abcdef")).toBe("");
  });
});

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
