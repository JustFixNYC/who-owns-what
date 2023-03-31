import { NetworkError, HTTPError } from "error-reporting";
import { JustfixUser } from "state-machine";
import browser from "../util/browser";

const BASE_URL = browser.addTrailingSlash(process.env.REACT_APP_API_BASE_URL);
const AUTH_SERVER_BASE_URL = browser.addTrailingSlash(process.env.REACT_APP_AUTH_SERVER_BASE_URL);

let _user: JustfixUser | undefined;
const user = () => _user;
const fetchUser = async () => {
  if (!_user) {
    try {
      const authCheck = await userAuthenticated();
      const subscriptions =
        authCheck?.["subscriptions"]?.map((s: any) => {
          return { ...s };
        }) || [];
      _user = {
        email: authCheck?.["email"],
        verified: authCheck?.["verified"],
        subscriptions,
      };
    } catch {}
  }
  return _user;
};
const setUser = (user: JustfixUser) => (_user = user);

/**
 * Authenticates a user with the given email and password.
 * Creates an account for this user if one does not already exist.
 */
const authenticate = async (username: string, password: string) => {
  const json = await postAuthRequest(`${BASE_URL}auth/authenticate`, { username, password });
  fetchUser();
  return json;
};

/**
 * Authenticates a user, returning an access token, a refresh token,
 * and expiry time.
 */
const login = async (username: string, password: string) => {
  const json = await postAuthRequest(`${BASE_URL}auth/login`, { username, password });
  return json;
};

/**
 * Revokes the current access token, if one is present
 */
const logout = async () => {
  await postAuthRequest(`${BASE_URL}auth/logout`);
  _user = undefined;
};

/**
 * Checks to see if a user account with this email exists
 */
const userExists = async (username: string) => {
  try {
    const response = await fetch(
      `${AUTH_SERVER_BASE_URL}user/exists/?email=${encodeURIComponent(username)}`
    );
    return !!response.ok;
  } catch (e) {
    if (e instanceof Error) {
      throw new NetworkError(e.message);
    } else {
      throw new Error("Unexpected error");
    }
  }
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
  try {
    await postAuthRequest(`${BASE_URL}auth/verify_email?code=${params.get("code")}`);
    return true;
  } catch {
    return false;
  }
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

/**
 * Sends an unauthenticated request to unsubscribe the user from the building
 */
const emailBuildingUnsubscribe = async (bbl: string, token: string) => {
  return await postAuthRequest(`${BASE_URL}auth/unsubscribe/${bbl}?u=${token}`);
};

/**
 * Fetches the list of all subscriptions associated with a user
 */
const userSubscriptions = async (token: string) => {
  return await postAuthRequest(`${BASE_URL}auth/subscriptions?u=${token}`);
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
    const json = await result.json();
    return json;
  } catch {
    return result;
  }
};

// TODO shakao Move shared APIClient functions to util
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
  if (!response.ok) {
    throw new HTTPError(response);
  }
  return response;
};

const Client = {
  userExists,
  userAuthenticated,
  user,
  fetchUser,
  setUser,
  authenticate,
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
  userSubscriptions,
  emailBuildingUnsubscribe,
};

export default Client;
