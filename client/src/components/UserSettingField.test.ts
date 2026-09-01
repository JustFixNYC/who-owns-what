import AuthClient from "./AuthClient";
import { mapSettingAuthError } from "./UserSettingField";
import { setupI18n } from "@lingui/core";

const CHANGE_SEND_URL = `${process.env.REACT_APP_API_BASE_URL}/auth/email/change/send-code`;
const CHANGE_VERIFY_URL = `${process.env.REACT_APP_API_BASE_URL}/auth/email/change/verify-otp`;

describe("EmailSettingField email-change proof", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("sends OTP to the new address without calling the immediate-swap update endpoint", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ otp: { status: "sent" } }));

    await AuthClient.sendEmailChangeCode("new@example.com");

    expect(fetchMock.mock.calls[0][0]).toBe(CHANGE_SEND_URL);
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("/auth/update");
    expect(fetchMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: "new_email=new%40example.com",
      })
    );
  });

  it("verifies the new-address OTP before swapping", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ user: { email: "new@example.com", verified: true, id: 1, type: "tenant" } })
    );

    const result = await AuthClient.verifyEmailChangeOtp("new@example.com", "123456");

    expect(result.user.email).toBe("new@example.com");
    expect(fetchMock.mock.calls[0][0]).toBe(CHANGE_VERIFY_URL);
    expect(fetchMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        method: "POST",
        body: "new_email=new%40example.com&code=123456",
      })
    );
  });
});

describe("mapSettingAuthError", () => {
  const i18n = setupI18n();

  it("maps OTP and ownership errors to existing settings copy", () => {
    expect(mapSettingAuthError("Invalid OTP.", i18n)).toBe("The code you entered is incorrect.");
    expect(mapSettingAuthError("Email already in use", i18n)).toBe("That email is already used.");
  });
});
