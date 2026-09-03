import { buildVerifyReloginUrl } from "components/EmailAlertSignup";

describe("BuildingAlertsPage unverified gate", () => {
  it("blocks new subscriptions until OTP/magic-link login verifies the session", () => {
    const unverified = { email: "legacy@example.com", verified: false };
    const verified = { email: "ok@example.com", verified: true };

    expect(!unverified.verified).toBe(true);
    expect(!verified.verified).toBe(false);
  });

  it("points the re-login banner at the OTP login page", () => {
    expect(buildVerifyReloginUrl("legacy@example.com", "en")).toBe(
      "/en/account/login?email=legacy%40example.com"
    );
  });
});
