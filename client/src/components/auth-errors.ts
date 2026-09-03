import { NetworkError, reportError } from "error-reporting";

/** Stable client sentinel when fetch fails before an API JSON body exists. */
export const NETWORK_AUTH_ERROR = "NETWORK_ERROR";

/**
 * User-facing / expected auth-provider errors. Do not send these to Rollbar;
 * invalid OTP, rate limits, and email-delivery pending are not client bugs.
 */
const EXPECTED_AUTH_ERRORS = new Set([
  "Invalid OTP.",
  "OTP has expired. Please request a new code.",
  "Too many invalid attempts. Please request a new code.",
  "Too many requests",
  "Email already in use",
  "Email delivery failed",
  "new_email must be different",
  "new_email is required",
  "email is required",
  "email and code are required",
  "new_email and code are required",
  "code is required",
  NETWORK_AUTH_ERROR,
]);

export function isExpectedAuthError(error?: string): boolean {
  return !!error && EXPECTED_AUTH_ERRORS.has(error);
}

export function reportUnexpectedAuthError(error: unknown): void {
  if (error instanceof NetworkError) {
    reportError(error);
    return;
  }
  if (typeof error === "string") {
    if (isExpectedAuthError(error)) return;
    reportError(error);
    return;
  }
  if (error instanceof Error) {
    if (isExpectedAuthError(error.message)) return;
    reportError(error);
  }
}
