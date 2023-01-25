import { NetworkError, HTTPError } from "error-reporting";

// TODO shakao update URL for development/prod
const BASE_URL = "http://127.0.0.1:8000";

const login = async (
  email: string,
  password: string,
  onSuccess: (result: any) => void,
  onError: (err: any) => void
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
    onSuccess(json);
  } catch (err) {
    onError(err);
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
  login,
};

export default Client;
