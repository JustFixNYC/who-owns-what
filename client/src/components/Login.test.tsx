import { OTP_LENGTH, sanitizeOtpValue } from "./CodeEntry";

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
