import { NetworkError } from "error-reporting";
import { NETWORK_AUTH_ERROR, isExpectedAuthError, reportUnexpectedAuthError } from "./auth-errors";

describe("reportUnexpectedAuthError", () => {
  let errMock: jest.Mock;

  beforeEach(() => {
    errMock = jest.fn();
    console.error = errMock;
  });

  it("does not report expected OTP and rate-limit errors", () => {
    expect(isExpectedAuthError("Invalid OTP.")).toBe(true);
    reportUnexpectedAuthError("Invalid OTP.");
    reportUnexpectedAuthError("Email delivery failed");
    reportUnexpectedAuthError(NETWORK_AUTH_ERROR);
    expect(errMock).not.toHaveBeenCalled();
  });

  it("does not report NetworkError when shouldReport is false", () => {
    reportUnexpectedAuthError(new NetworkError("offline"));
    expect(errMock).not.toHaveBeenCalled();
  });

  it("reports unexpected API errors and 502s", () => {
    reportUnexpectedAuthError("Login must be started first");
    reportUnexpectedAuthError("Auth service unavailable");
    expect(errMock).toHaveBeenCalledWith("Login must be started first");
    expect(errMock).toHaveBeenCalledWith("Auth service unavailable");
  });
});
