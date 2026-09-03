import { NetworkError } from "error-reporting";
import { JustfixUser } from "state-machine";
import browser from "../util/browser";
import { District } from "./APIDataTypes";

const BASE_URL = browser.addTrailingSlash(process.env.REACT_APP_API_BASE_URL);

export enum VerifyStatusCode {
  Success = 200,
  AlreadyVerified = 208,
  Failure = 400,
  Expired = 404,
  Unknown = 500,
}

type VerifyEmailResponse = {
  statusCode: VerifyStatusCode;
  statusText: string;
  error?: string;
};

export type VerifyMagicLinkResponse = VerifyEmailResponse & {
  user?: JustfixUser;
  networkError?: boolean;
};

let _user: JustfixUser | undefined;
const user = () => _user;
const fetchUser = async () => {
  let authCheck;
  try {
    authCheck = await userAuthenticated();
  } catch (e) {
    if (e instanceof NetworkError) return;
    throw e;
  }

  if (!authCheck) {
    clearUser();
    return;
  }

  const buildingSubscriptions =
    authCheck["subscriptions"]?.map((s: any) => {
      return { ...s };
    }) || [];
  const districtSubscriptions =
    authCheck["district_subscriptions"]?.map((s: any) => {
      return { ...s };
    }) || [];
  _user = {
    email: authCheck["email"],
    verified: authCheck["verified"],
    id: authCheck["id"],
    type: authCheck["type"],
    buildingSubscriptions,
    districtSubscriptions,
    subscriptionLimit: authCheck["subscription_limit"],
  };
  return _user;
};
const setUser = (user: JustfixUser) => (_user = user);
const clearUser = () => (_user = undefined);

export type PendingBuildingSubscription = {
  bbl: string;
  housenumber: string;
  streetname: string;
  zip: string;
  boro: string;
};

export type SendLoginCodeOptions = {
  userType?: string;
  phoneNumber?: string;
  building?: PendingBuildingSubscription;
};

type StartLoginResponse = {
  created?: boolean;
  error?: string;
};

/**
 * Upsert-only login step: create or fetch account by email without sending OTP.
 */
const startLogin = async (email: string): Promise<StartLoginResponse> => {
  return await postAuthRequest(`${BASE_URL}auth/login/start`, {
    email: email.toLowerCase(),
  });
};

/**
 * Issue OTP and send login email with code + magic link.
 * Requires a prior startLogin for the same email.
 */
const sendLoginCode = async (email: string, options?: SendLoginCodeOptions) => {
  const params: { [key: string]: string } = {
    email: email.toLowerCase(),
  };
  if (options?.userType) params.user_type = options.userType;
  if (options?.phoneNumber) params.phone_number = options.phoneNumber;
  if (options?.building) {
    params.bbl = options.building.bbl;
    params.housenumber = options.building.housenumber;
    params.streetname = options.building.streetname;
    params.zip = options.building.zip;
    params.boro = options.building.boro;
  }
  return await withOtpDeliveryError(
    await postAuthRequest(`${BASE_URL}auth/login/send-code`, params)
  );
};

/**
 * Verify a login OTP code and establish a session (httponly cookies via proxy).
 */
const verifyOtp = async (email: string, code: string) => {
  return await postLoginCredentials(`${BASE_URL}auth/verify-otp`, {
    email: email.toLowerCase(),
    code,
  });
};

/**
 * Validate a magic-link code and establish a session (httponly cookies via proxy).
 * Success requires a `user` in the body — legacy verify-only JSON (status 200, no user,
 * no cookies) is not treated as a logged-in session.
 */
const verifyMagicLink = async (
  code: string,
  utmSource?: string
): Promise<VerifyMagicLinkResponse> => {
  const params: { [key: string]: string } = { code };
  if (utmSource) params.utm_source = utmSource;

  let result: VerifyMagicLinkResponse = {
    statusCode: VerifyStatusCode.Unknown,
    statusText: "",
  };

  try {
    const response = await postAuthRequest(`${BASE_URL}auth/verify-magic-link`, params);
    if (response.user) {
      result.statusCode = VerifyStatusCode.Success;
      result.statusText = response.status_text || "";
      result.user = response.user;
    } else if (response.status_code === VerifyStatusCode.AlreadyVerified) {
      result.statusCode = VerifyStatusCode.AlreadyVerified;
      result.statusText = response.status_text;
    } else if (response.status_code === VerifyStatusCode.Expired) {
      result.statusCode = VerifyStatusCode.Expired;
      result.statusText = response.status_text;
    } else if (response.error) {
      result.statusCode = VerifyStatusCode.Failure;
      result.error = response.error;
    } else {
      // Includes legacy `{ status_code: 200 }` verify-only JSON (no user, no session).
      result.statusCode = VerifyStatusCode.Failure;
      result.statusText = response.status_text || "";
    }
  } catch (e) {
    if (e instanceof NetworkError) {
      result.error = e.message;
      result.networkError = true;
    } else if (e instanceof Error) {
      result.error = e.message;
    }
  }
  return result;
};

/**
 * Authenticated proof of a new email: issue OTP + magic link to new_email.
 */
const sendEmailChangeCode = async (newEmail: string) => {
  return await withOtpDeliveryError(
    await postAuthRequest(`${BASE_URL}auth/email/change/send-code`, {
      new_email: newEmail.toLowerCase(),
    })
  );
};

/**
 * Authenticated OTP proof of new_email, then swap username / WowProfile.email.
 */
const verifyEmailChangeOtp = async (newEmail: string, code: string) => {
  return await postAuthRequest(`${BASE_URL}auth/email/change/verify-otp`, {
    new_email: newEmail.toLowerCase(),
    code,
  });
};

/**
 * Revokes the current access token, if one is present
 */
const logout = async () => {
  return await postAuthRequest(`${BASE_URL}auth/logout`);
};

/**
 * Checks to see if a user is currently authenticated (via httponly cookie)
 */
const userAuthenticated = async () => {
  return await postAuthRequest(`${BASE_URL}auth/auth_check`);
};

const isEmailAlreadyUsed = async (email: string) => {
  const sanitizedEmail = email.toLowerCase();

  const result = await friendlyFetch(`${BASE_URL}auth/account_exists/${sanitizedEmail}`, {
    method: "GET",
    mode: "cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return result.ok;
};

/**
 * Sends an unauthenticated request to verify the user email
 */
const verifyEmail = async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const utm_source = params.get("utm_source") || "";

  let result: VerifyEmailResponse = {
    statusCode: VerifyStatusCode.Unknown,
    statusText: "",
  };

  try {
    let url = `${BASE_URL}auth/verify_email?code=${code}`;
    if (utm_source) url += `&utm_source=${utm_source}`;

    const response = await postAuthRequest(url);
    result.statusCode = response.status_code;
    result.statusText = response.status_text;
  } catch (e) {
    if (e instanceof Error) {
      result.error = e.message;
    }
  }
  return result;
};

/**
 * Sends an authenticated request to update the user email
 */
const updateEmail = async (newEmail: string) => {
  return await postAuthRequest(`${BASE_URL}auth/update`, { new_email: newEmail.toLowerCase() });
};

/**
 * Sends an authenticated request to subscribe the user to the building
 */
const subscribeBuilding = async (
  bbl: string,
  housenumber: string,
  streetname: string,
  zip: string,
  boro: string
) => {
  const post_data = {
    bbl,
    housenumber,
    streetname,
    zip,
    boro,
  };
  return await postAuthRequest(`${BASE_URL}auth/subscribe/building`, post_data);
};

/**
 * Sends an authenticated request to unsubscribe the user from the building
 */
const unsubscribeBuilding = async (bbl: string) => {
  return await postAuthRequest(
    `${BASE_URL}auth/unsubscribe/building/${bbl}`,
    undefined,
    undefined,
    "DELETE"
  );
};

/**
 * Sends an authenticated request to unsubscribe the user from all buildings
 */
const unsubscribeAllBuilding = async (bbl: string) => {
  return await postAuthRequest(
    `${BASE_URL}auth/unsubscribe_all/building`,
    undefined,
    undefined,
    "DELETE"
  );
};

/**
 * Sends an unauthenticated request to unsubscribe the user from the building
 */
const emailUnsubscribeBuilding = async (bbl: string, token: string) => {
  return await postAuthRequest(`${BASE_URL}auth/email/unsubscribe/building/${bbl}?u=${token}`);
}; /**

/**
 * Sends an unauthenticated request to unsubscribe the user from all buildings
 */
const emailUnsubscribeAllBuilding = async (token: string) => {
  return await postAuthRequest(`${BASE_URL}auth/email/unsubscribe_all/building?u=${token}`);
};

/**
 * Sends an authenticated request to subscribe the user to the district
 */
const subscribeDistrict = async (district: District) => {
  const post_data = { district: JSON.stringify(district) };
  return await postAuthRequest(`${BASE_URL}auth/subscribe/district`, post_data);
};

/**
 * Sends an authenticated request to unsubscribe the user from the district
 */
const unsubscribeDistrict = async (subscription_id: string) => {
  return await postAuthRequest(
    `${BASE_URL}auth/unsubscribe/district/${subscription_id}`,
    undefined,
    undefined,
    "DELETE"
  );
};

/**
 * Sends an authenticated request to unsubscribe the user from all districts
 */
const unsubscribeAllDistrict = async (subscription_id: string) => {
  return await postAuthRequest(
    `${BASE_URL}auth/unsubscribe_all/district`,
    undefined,
    undefined,
    "DELETE"
  );
};

/**
 * Sends an unauthenticated request to unsubscribe the user from the district
 */
const emailUnsubscribeDistrict = async (subscription_id: string, token: string) => {
  return await postAuthRequest(
    `${BASE_URL}auth/email/unsubscribe/district/${subscription_id}?u=${token}`
  );
};

/**
 * Sends an unauthenticated request to unsubscribe the user from all districts
 */
const emailUnsubscribeAllDistrict = async (token: string) => {
  return await postAuthRequest(`${BASE_URL}auth/email/unsubscribe_all/district?u=${token}`);
};

/**
 * Fetches the list of all subscriptions associated with a user
 */
const emailUserSubscriptions = async (token: string) => {
  return await postAuthRequest(`${BASE_URL}auth/email/subscriptions?u=${token}`);
};

/**
 * Wrapper function for authentication POST requests
 */

const withOtpDeliveryError = (response: any) => {
  if (response?.error) return response;
  const status = response?.otp?.status;
  if (status && status !== "sent") {
    return {
      ...response,
      error: response.otp.message || "Email delivery failed",
    };
  }
  return response;
};

const parseAuthResponse = async (result: Response) => {
  try {
    return await result.json();
  } catch {
    return { error: `Auth request failed (${result.status})` };
  }
};

const postAuthRequest = async (
  url: string,
  params?: { [key: string]: string },
  headers?: { [key: string]: string },
  method: string = "POST"
) => {
  const body = params
    ? Object.keys(params)
        .map((k) => `${k}=${encodeURIComponent(params[k])}`)
        .join("&")
    : "";
  const result = await friendlyFetch(url, {
    method,
    mode: "cors",
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...headers,
    },
    credentials: "include",
  });

  return await parseAuthResponse(result);
};

/**
 * Wrapper function for POST requests returning JSON response body
 */

const postLoginCredentials = async (
  url: string,
  params?: { [key: string]: string },
  headers?: { [key: string]: string },
  method: string = "POST"
) => {
  const body = params
    ? Object.keys(params)
        .map((k) => `${k}=${encodeURIComponent(params[k])}`)
        .join("&")
    : "";
  const result = await friendlyFetch(url, {
    method,
    mode: "cors",
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...headers,
    },
    credentials: "include",
  });

  return await parseAuthResponse(result);
};

const friendlyFetch: typeof fetch = async (input, init) => {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (e) {
    if (e instanceof Error) {
      throw new NetworkError(e.message);
    } else {
      throw new Error("Unexpected error");
    }
  }
  return response;
};

const Client = {
  userAuthenticated,
  isEmailAlreadyUsed,
  user,
  fetchUser,
  setUser,
  startLogin,
  sendLoginCode,
  verifyOtp,
  verifyMagicLink,
  sendEmailChangeCode,
  verifyEmailChangeOtp,
  logout,
  verifyEmail,
  updateEmail,
  subscribeBuilding,
  unsubscribeBuilding,
  unsubscribeAllBuilding,
  emailUnsubscribeBuilding,
  emailUnsubscribeAllBuilding,
  subscribeDistrict,
  unsubscribeDistrict,
  unsubscribeAllDistrict,
  emailUnsubscribeDistrict,
  emailUnsubscribeAllDistrict,
  emailUserSubscriptions,
};

export default Client;
