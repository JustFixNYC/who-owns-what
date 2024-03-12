import { NetworkError } from "error-reporting";
import { JustfixUser } from "state-machine";
import browser from "../util/browser";

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

let _user: JustfixUser | undefined;
const user = () => _user;
const fetchUser = async () => {
  if (!_user) {
    const authCheck = await userAuthenticated();

    if (!!authCheck) {
      const subscriptions =
        authCheck["subscriptions"]?.map((s: any) => {
          return { ...s };
        }) || [];
      _user = {
        email: authCheck["email"],
        verified: authCheck["verified"],
        subscriptions,
      };
    } else {
      clearUser();
    }
  }
  return _user;
};
const setUser = (user: JustfixUser) => (_user = user);
const clearUser = () => (_user = undefined);

/**
 * Authenticates a user with the given email and password.
 * Creates an account for this user if one does not already exist.
 */
const register = async (username: string, password: string, userType: string) => {
  const json = await postAuthRequest(`${BASE_URL}auth/register`, {
    username,
    password,
    user_type: userType,
  });
  fetchUser();
  return json;
};

/**
 * Authenticates a user, returning an access token, a refresh token,
 * and expiry time.
 */
const login = async (username: string, password: string) => {
  const json = await postLoginCredentials(`${BASE_URL}auth/login`, { username, password });
  return json;
};

/**
 * Revokes the current access token, if one is present
 */
const logout = async () => {
  return await postAuthRequest(`${BASE_URL}auth/logout`);
};

const resetPasswordRequest = async (username: string) => {
  return await postAuthRequest(`${BASE_URL}auth/reset_password`, { username });
};

const resetPassword = async (token: string, newPassword: string) => {
  return await postAuthRequest(`${BASE_URL}auth/set_password?token=${token}`, {
    new_password: newPassword,
  });
};

/**
 * Checks to see if a user is currently authenticated (via httponly cookie)
 */
const userAuthenticated = async () => {
  return await postAuthRequest(`${BASE_URL}auth/auth_check`);
};

/**
 * Sends an authenticated request to verify the user email
 */
const verifyEmail = async () => {
  const params = new URLSearchParams(window.location.search);

  let result: VerifyEmailResponse = {
    statusCode: VerifyStatusCode.Unknown,
    statusText: "",
  };

  try {
    const response = await postAuthRequest(
      `${BASE_URL}auth/verify_email?code=${params.get("code")}`
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

/**
 * Sends request to resend the account verification link to the user's email
 */
const resendVerifyEmail = async () => {
  try {
    await postAuthRequest(`${BASE_URL}auth/resend_verify_email`);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sends an authenticated request to update the user email
 */
const updateEmail = async (newEmail: string) => {
  return await postAuthRequest(`${BASE_URL}auth/update`, { new_email: newEmail });
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
const buildingSubscribe = async (
  bbl: string,
  housenumber: string,
  streetname: string,
  zip: string,
  boro: string
) => {
  const post_data = {
    housenumber,
    streetname,
    zip,
    boro,
  };
  return await postAuthRequest(`${BASE_URL}auth/subscriptions/${bbl}`, post_data);
};

/**
 * Sends an authenticated request to unsubscribe the user from the building
 */
const buildingUnsubscribe = async (bbl: string) => {
  return await postAuthRequest(
    `${BASE_URL}auth/subscriptions/${bbl}`,
    undefined,
    undefined,
    "DELETE"
  );
};

const isEmailAlreadyUsed = async (email: string) => {
  const result = await friendlyFetch(`${BASE_URL}auth/account_exists/${email}`, {
    method: "GET",
    mode: "cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return result.ok;
};

/**
 * Sends an unauthenticated request to unsubscribe the user from the building
 */
const emailUnsubscribeBuilding = async (bbl: string, token: string) => {
  return await postAuthRequest(`${BASE_URL}auth/unsubscribe/${bbl}?u=${token}`);
};

/**
 * Sends an unauthenticated request to unsubscribe the user from all buildings
 */
const emailUnsubscribeAll = async (token: string) => {
  return await postAuthRequest(`${BASE_URL}auth/email/unsubscribe?u=${token}`);
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
  resetPassword,
  buildingSubscribe,
  buildingUnsubscribe,
  emailUserSubscriptions,
  emailUnsubscribeBuilding,
  emailUnsubscribeAll,
};

export default Client;
