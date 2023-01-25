import { NetworkError, HTTPError } from "error-reporting";

// TODO shakao update URL for development/prod
const BASE_URL = "http://127.0.0.1:8000";
let token: string | undefined;

const setToken = (newToken: string) => {
  token = newToken;
};

const getToken = () => token;

const login = async (
  email: string,
  password: string,
  onSuccess: (result: any) => void,
  onError?: (err: any) => void
) => {
  try {
    const result = await friendlyFetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      mode: "cors",
      body: `username=${encodeURIComponent(email)}&password=${password}`,
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
};

export default Client;
