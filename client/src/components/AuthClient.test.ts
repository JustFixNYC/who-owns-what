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
});
