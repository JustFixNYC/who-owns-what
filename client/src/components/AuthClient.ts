import { NetworkError, HTTPError } from "error-reporting";

interface AuthToken {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

// TODO shakao update URL for development/prod
const BASE_URL = "http://127.0.0.1:8000";
const AUTH_SERVER_BASE_URL = "http://127.0.0.1:8080";
let token: AuthToken | undefined;

const setToken = (json: any) => {
  token = {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    tokenType: json.token_type,
  };
};

const getToken = () => token;

let userEmail: string | undefined;
const getUserEmail = () => userEmail;
const setUserEmail = (email: string) => (userEmail = email);

/**
 * Authenticates a user with the given email and password.
 * Creates an account for this user if one does not already exist.
 */
const authenticate = async (username: string, password: string) => {
  const json = await postAuthRequest(`${BASE_URL}/auth/authenticate`, { username, password });
  setToken(json);
  setUserEmail(username);
  return json;
};

/**
 * Authenticates a user, returning an access token, a refresh token,
 * and expiry time.
 */
const login = async (username: string, password: string) => {
  const json = await postAuthRequest(`${BASE_URL}/auth/login`, { username, password });
  setToken(json);
  return json;
};

/**
 * Sends a request to refresh the access token
 */
const refresh = async () => {
  if (token?.refreshToken) {
    const json = await postAuthRequest(`${BASE_URL}/auth/refresh`, {
      refresh_token: token.refreshToken,
    });
    setToken(json);
    return json;
  }
};

/**
 * Revokes the current access token, if one is present
 */
const logout = async () => {
  if (token?.accessToken) {
    const json = await postAuthRequest(`${BASE_URL}/auth/logout`, { token: token.accessToken });
    token = undefined;
    userEmail = undefined;
    return json;
  }
};

/**
 * Sends an authenticated request to update the user email
 */
const updateEmail = async (newEmail: string) => {
  if (token) {
    return await postAuthRequest(
      `${AUTH_SERVER_BASE_URL}/user/update`,
      { new_email: newEmail },
      { Authorization: `${token.tokenType} ${token.accessToken}` }
    );
  }
};

/**
 * Wrapper function for authentication POST requests
 */

const postAuthRequest = async (
  url: string,
  params: { [key: string]: string },
  headers?: { [key: string]: string }
) => {
  const body = Object.keys(params)
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const result = await friendlyFetch(url, {
    method: "POST",
    mode: "cors",
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...headers,
    },
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
  setToken,
  getToken,
  getUserEmail,
  authenticate,
  login,
  logout,
  refresh,
  updateEmail,
};

export default Client;
