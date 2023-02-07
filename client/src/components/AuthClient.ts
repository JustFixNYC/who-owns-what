import { NetworkError, HTTPError } from "error-reporting";

// TODO shakao update URL for development/prod
const BASE_URL = "http://127.0.0.1:8000";
const AUTH_SERVER_BASE_URL = "http://127.0.0.1:8080";

let userEmail: string | undefined;
const getUserEmail = () => userEmail;
const fetchUserEmail = async () => {
  if (!userEmail) {
    try {
      const authCheck = await userAuthenticated();
      userEmail = authCheck?.["email"];
    } catch {}
  }
  return userEmail;
};
const setUserEmail = (email: string) => (userEmail = email);

/**
 * Authenticates a user with the given email and password.
 * Creates an account for this user if one does not already exist.
 */
const authenticate = async (username: string, password: string) => {
  const json = await postAuthRequest(`${BASE_URL}/auth/authenticate`, { username, password });
  setUserEmail(username);
  return json;
};

/**
 * Authenticates a user, returning an access token, a refresh token,
 * and expiry time.
 */
const login = async (username: string, password: string) => {
  const json = await postAuthRequest(`${BASE_URL}/auth/login`, { username, password });
  return json;
};

/**
 * Revokes the current access token, if one is present
 */
const logout = async () => {
  const json = await postAuthRequest(`${BASE_URL}/auth/logout`);
  userEmail = undefined;
  return json;
};

/**
 * Checks to see if a user account with this email exists
 */
const userExists = async (username: string) => {
  try {
    const response = await fetch(`${AUTH_SERVER_BASE_URL}/user/?email=${username}`);
    return !!response.ok;
  } catch (e) {
    console.log(e);
  }
};

/**
 * Checks to see if a user is currently authenticated (via httponly cookie)
 */
const userAuthenticated = async () => {
  return await postAuthRequest(`${BASE_URL}/auth/auth_check`);
};

/**
 * Sends an authenticated request to update the user email
 */
const updateEmail = async (newEmail: string) => {
  return await postAuthRequest(`${BASE_URL}/user/update`, { new_email: newEmail });
};

/**
 * Wrapper function for authentication POST requests
 */

const postAuthRequest = async (
  url: string,
  params?: { [key: string]: string },
  headers?: { [key: string]: string }
) => {
  const body = params
    ? Object.keys(params)
        .map((k) => `${k}=${params[k]}`)
        .join("&")
    : "";
  const result = await friendlyFetch(url, {
    method: "POST",
    mode: "cors",
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...headers,
    },
    credentials: "include",
  });
  const json = await result.json();
  return json;
};

// TODO shakao Move shared APIClient functions to util
const friendlyFetch: typeof fetch = async (input, init) => {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (e) {
    throw new NetworkError(e.message);
  }
  if (!response.ok) {
    throw new HTTPError(response);
  }
  return response;
};

const Client = {
  userExists,
  userAuthenticated,
  getUserEmail,
  fetchUserEmail,
  authenticate,
  login,
  logout,
  updateEmail,
};

export default Client;
