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

const setToken = (newToken: AuthToken) => {
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
    token = {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      tokenType: json.token_type,
    }
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
    token = {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      tokenType: json.token_type,
    }
    onSuccess(json);
  } catch (err) {
    onError?.(err);
  }
};

/**
 * Sends a request to refresh the access token
 */
// TODO shakao factor out try/catch, success/error?
const refresh = async (onSuccess: (result: any) => void, onError?: (err: any) => void) => {
  try {
    if (token?.refreshToken) {
      const result = await friendlyFetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        mode: "cors",
        body: `refresh_token=${encodeURIComponent(token.refreshToken)}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      const json = await result.json();
      token = {
        accessToken: json.access_token,
        refreshToken: json.refresh_token,
        tokenType: json.token_type,
      }
      onSuccess(json);
    }
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
    if (token?.accessToken) {
      const result = await friendlyFetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        mode: "cors",
        body: `token=${encodeURIComponent(token.accessToken)}`,
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
  refresh,
  logout,
  updateEmail,
  authenticate,
};

export default Client;
