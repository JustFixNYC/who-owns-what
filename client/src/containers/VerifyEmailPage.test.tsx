/**
 * Magic-link landing (`VerifyEmailPage`) uses AuthClient.verifyMagicLink.
 * These cases cover the session vs. verify-only distinction the page relies on.
 */
import AuthClient, { VerifyStatusCode } from "../components/AuthClient";

const VERIFY_URL = `${process.env.REACT_APP_API_BASE_URL}/auth/verify-magic-link`;

describe("VerifyEmailPage magic-link client", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("requires a user on the verify-magic-link response to treat the visit as logged in", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        user: { email: "boop@beep.com", verified: true, id: 1, type: "tenant" },
      })
    );

    const result = await AuthClient.verifyMagicLink("abc", undefined);

    expect(result.statusCode).toBe(VerifyStatusCode.Success);
    expect(result.user).toBeTruthy();
    expect(fetchMock.mock.calls[0][0]).toBe(VERIFY_URL);
    expect(fetchMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({ credentials: "include", method: "POST" })
    );
  });

  it("does not proceed as logged-in for ALREADY_VERIFIED or legacy verify-only JSON", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ status_code: 208, status_text: "email already verified" }),
      { status: 208 }
    );
    const already = await AuthClient.verifyMagicLink("reused");
    expect(already.statusCode).toBe(VerifyStatusCode.AlreadyVerified);
    expect(already.user).toBeUndefined();

    fetchMock.mockResponseOnce(JSON.stringify({ status_code: 200, status_text: "ok" }));
    const legacy = await AuthClient.verifyMagicLink("old-verify");
    expect(legacy.statusCode).not.toBe(VerifyStatusCode.Success);
    expect(legacy.user).toBeUndefined();
  });

  it("flags fetch failures so the landing page can skip Rollbar for offline users", async () => {
    fetchMock.mockRejectOnce(new TypeError("Failed to fetch"));
    const result = await AuthClient.verifyMagicLink("abc");
    expect(result.networkError).toBe(true);
    expect(result.statusCode).toBe(VerifyStatusCode.Unknown);
  });
});
