import AuthClient, { VerifyStatusCode } from "./AuthClient";

const VERIFY_URL = `${process.env.REACT_APP_API_BASE_URL}/auth/verify-magic-link`;

const sampleUser = {
  email: "tenant@example.com",
  verified: true,
  id: 42,
  type: "tenant",
};

describe("AuthClient.verifyMagicLink", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("POSTs verify-magic-link with credentials and treats a user payload as login success", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ user: sampleUser }));

    const result = await AuthClient.verifyMagicLink("signed-code", "email");

    expect(result.statusCode).toBe(VerifyStatusCode.Success);
    expect(result.user).toEqual(sampleUser);
    expect(fetchMock.mock.calls).toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toBe(VERIFY_URL);
    expect(fetchMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: "code=signed-code&utm_source=email",
      })
    );
  });

  it("does not treat legacy verify-only JSON as a logged-in session", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ status_code: 200, status_text: "email verified" }));

    const result = await AuthClient.verifyMagicLink("signed-code");

    expect(result.statusCode).toBe(VerifyStatusCode.Failure);
    expect(result.user).toBeUndefined();
  });

  it("does not log in on ALREADY_VERIFIED", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ status_code: 208, status_text: "email already verified" }),
      { status: 208 }
    );

    const result = await AuthClient.verifyMagicLink("signed-code");

    expect(result.statusCode).toBe(VerifyStatusCode.AlreadyVerified);
    expect(result.user).toBeUndefined();
  });

  it("maps expired links without a session user", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ status_code: 404, status_text: "expired" }), {
      status: 404,
    });

    const result = await AuthClient.verifyMagicLink("signed-code");

    expect(result.statusCode).toBe(VerifyStatusCode.Expired);
    expect(result.user).toBeUndefined();
  });

  it("marks fetch failures as networkError without treating them as login success", async () => {
    fetchMock.mockRejectOnce(new TypeError("Failed to fetch"));

    const result = await AuthClient.verifyMagicLink("signed-code");

    expect(result.statusCode).toBe(VerifyStatusCode.Unknown);
    expect(result.networkError).toBe(true);
    expect(result.user).toBeUndefined();
  });
});

const SEND_CODE_URL = `${process.env.REACT_APP_API_BASE_URL}/auth/login/send-code`;
const START_URL = `${process.env.REACT_APP_API_BASE_URL}/auth/login/start`;
const VERIFY_OTP_URL = `${process.env.REACT_APP_API_BASE_URL}/auth/verify-otp`;

describe("AuthClient sendLoginCode and verifyOtp errors", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("treats otp.status pending as a delivery error", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ otp: { status: "pending", message: "Email delivery failed" } })
    );

    const result = await AuthClient.sendLoginCode("tenant@example.com");

    expect(result.error).toBe("Email delivery failed");
    expect(fetchMock.mock.calls[0][0]).toBe(SEND_CODE_URL);
  });

  it("returns a structured error when start-login is not JSON", async () => {
    fetchMock.mockResponseOnce("<html>upstream 502</html>", { status: 502 });

    const result = await AuthClient.startLogin("tenant@example.com");

    expect(result.error).toMatch(/Auth request failed/);
    expect(fetchMock.mock.calls[0][0]).toBe(START_URL);
  });

  it("returns a structured error when verify-otp is not JSON", async () => {
    fetchMock.mockResponseOnce("Internal Server Error", { status: 500 });

    const result = await AuthClient.verifyOtp("tenant@example.com", "123456");

    expect(result.error).toMatch(/Auth request failed/);
    expect(fetchMock.mock.calls[0][0]).toBe(VERIFY_OTP_URL);
  });
});
