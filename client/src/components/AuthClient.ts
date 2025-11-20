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

export enum ResetStatusCode {
  Success = 200,
  Accepted = 202,
  Invalid = 400,
  Expired = 410,
  Unknown = 500,
}

type PasswordResetResponse = Omit<VerifyEmailResponse, "statusCode"> & {
  statusCode: ResetStatusCode;
};

let _user: JustfixUser | undefined;
const user = () => _user;
const fetchUser = async () => {
  const authCheck = await userAuthenticated();

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

/**
 * Authenticates a user with the given email and password.
 * Creates an account for this user if one does not already exist.
 */
const register = async (
  username: string,
  password: string,
  userType: string,
  phoneNumber?: string
) => {
  const json = await postAuthRequest(`${BASE_URL}auth/register`, {
    username: username.toLowerCase(),
    password,
    user_type: userType,
    ...(phoneNumber ? { phone_number: phoneNumber } : undefined),
  });
  fetchUser();
  return json;
};

/**
 * Authenticates a user, returning an access token, a refresh token,
 * and expiry time.
 */
const login = async (username: string, password: string) => {
  const json = await postLoginCredentials(`${BASE_URL}auth/login`, {
    username: username.toLowerCase(),
    password,
  });
  return json;
};

/**
 * Revokes the current access token, if one is present
 */
const logout = async () => {
  return await postAuthRequest(`${BASE_URL}auth/logout`);
};

/**
 * Sends request to send a password reset link to the user's email
 */
const resetPasswordRequest = async (username?: string) => {
  try {
    if (username) {
      await postAuthRequest(`${BASE_URL}auth/reset_password_request`, {
        username: username.toLowerCase(),
      });
    } else {
      const params = new URLSearchParams(window.location.search);
      await postAuthRequest(
        `${BASE_URL}auth/reset_password_request_with_token?token=${params.get("token")}`
      );
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Sends an unauthenticated request to checks if the password reset token is valid
 */
const resetPasswordCheck = async () => {
  const params = new URLSearchParams(window.location.search);

  let result: PasswordResetResponse = {
    statusCode: ResetStatusCode.Unknown,
    statusText: "",
  };

  try {
    const response = await postAuthRequest(
      `${BASE_URL}auth/reset_password/check?token=${params.get("token")}`
    );
    result.statusCode = response.status_code;
    result.statusText = response.status_text;
  } catch (e) {
    if (e instanceof Error) {
      result.error = e.message;
    }
  }
  return result;
};

const resetPassword = async (token: string, newPassword: string) => {
  let result: PasswordResetResponse = {
    statusCode: ResetStatusCode.Unknown,
    statusText: "",
  };

  try {
    const response = await postAuthRequest(`${BASE_URL}auth/set_password?token=${token}`, {
      new_password: newPassword,
    });
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
 * Sends request to resend the account verification link to the user's email
 */
const resendVerifyEmail = async (token?: string) => {
  try {
    if (token) {
      await postAuthRequest(`${BASE_URL}auth/resend_verification_with_token?u=${token}`);
    } else {
      await postAuthRequest(`${BASE_URL}auth/resend_verification`);
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Sends an authenticated request to update the user email
 */
const updateEmail = async (newEmail: string) => {
  return await postAuthRequest(`${BASE_URL}auth/update`, { new_email: newEmail.toLowerCase() });
};

/**
 * Sends an authenticated request to change the user password
 */
const updatePassword = async (currentPassword: string, newPassword: string) => {
  return await postAuthRequest(`${BASE_URL}auth/change_password`, {
    current_password: currentPassword,
    new_password: newPassword,
  });
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

  try {
    if (result.ok) {
      return await result.json();
    } else {
      return await result.json();
    }
  } catch {
    return result;
  }
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

  return await result.json();
};

// TODO shakao Move shared APIClient functions to util
const friendlyFetch: typeof fetch = async (input, init) => {
  let response: Response;
  try {
    response = await fetch(input, init);
    console.log(response);
  } catch (e) {
    if (e instanceof Error) {
      window.Rollbar.error(e.message, { input, init });
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
  register,
  login,
  logout,
  verifyEmail,
  resendVerifyEmail,
  updateEmail,
  updatePassword,
  resetPasswordRequest,
  resetPasswordCheck,
  resetPassword,
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
