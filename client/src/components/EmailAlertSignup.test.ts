import AuthClient from "./AuthClient";
import { buildVerifyReloginUrl } from "./EmailAlertSignup";

const SEND_CODE_URL = `${process.env.REACT_APP_API_BASE_URL}/auth/login/send-code`;

describe("EmailVerificationPrompt resend", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("POSTs login/send-code rather than resend_verification", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ otp: { status: "sent" } }));

    await AuthClient.sendLoginCode("tenant@example.com");

    expect(fetchMock.mock.calls).toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toBe(SEND_CODE_URL);
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("resend_verification");
    expect(fetchMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: "email=tenant%40example.com",
      })
    );
  });
});

describe("buildVerifyReloginUrl", () => {
  it("sends unverified sessions to locale login with email prefilled", () => {
    expect(buildVerifyReloginUrl("tenant@example.com", "en")).toBe(
      "/en/account/login?email=tenant%40example.com"
    );
    expect(buildVerifyReloginUrl("tenant@example.com", "es")).toBe(
      "/es/account/login?email=tenant%40example.com"
    );
  });
});
