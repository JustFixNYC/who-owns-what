import { NetworkError, HTTPError } from "error-reporting";

// TODO shakao update URL for development/prod
const BASE_URL = "http://127.0.0.1:8000";
const AUTH_SERVER_BASE_URL = "http://127.0.0.1:8080";
let token: string | undefined;

const setToken = (newToken: string) => {
  token = newToken;
};

const getToken = () => token;

/**
 * Authenticates a user with the given email and password.
 * Creates an account for this user if one does not already exist.
 */
const authenticate = async (
  username: string,
  password: string,
  onSuccess: (result: any) => void,
  onError?: (err: any) => void
) => {
  try {
    const result = await friendlyFetch(`${BASE_URL}/auth/authenticate`, {
      method: "POST",
      mode: "cors",
      body: `username=${encodeURIComponent(username)}&password=${password}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const json = await result.json();
    token = json.access_token;
    onSuccess(json);
  } catch (err) {
    onError?.(err);
  }
};

/**
 * Authenticates a user, returning an access token, a refresh token,
 * and expiry time.
 */
const login = async (
  username: string,
  password: string,
  onSuccess: (result: any) => void,
  onError?: (err: any) => void
) => {
  try {
    const result = await friendlyFetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      mode: "cors",
      body: `username=${encodeURIComponent(username)}&password=${password}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const json = await result.json();
    token = json.access_token;
    onSuccess(json);
  } catch (err) {
    onError?.(err);
  }
};

/**
 * Revokes the current access token, if one is present
 */
// TODO shakao factor out try/catch, success/error?
const logout = async (onSuccess: (result: any) => void, onError?: (err: any) => void) => {
  try {
    if (token) {
      const result = await friendlyFetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        mode: "cors",
        body: `token=${encodeURIComponent(token)}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      token = undefined;
      const json = await result.json();
      onSuccess(json);
    }
  } catch (err) {
    onError?.(err);
  }
};

/**
 * Sends an authenticated request to update the user email
 */
const updateEmail = async (
  newEmail: string,
  onSuccess: (result: any) => void,
  onError?: (err: any) => void
) => {
  try {
    if (token) {
      const result = await friendlyFetch(`${AUTH_SERVER_BASE_URL}/user/update`, {
        mode: "cors",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          // TODO shakao store entire token in memory, pull auth type as well
          Authorization: `Bearer ${getToken()}`,
        },
        body: `new_email=${encodeURIComponent(newEmail)}`,
      });
      const json = await result.json();
      onSuccess(json);
    }
  } catch (err) {
    onError?.(err);
  }
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
  login,
  logout,
  updateEmail,
  authenticate,
};

export default Client;
