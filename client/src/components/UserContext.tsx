import React, { createContext, useState, useEffect, useMemo, useCallback } from "react";
import { JustfixUser } from "state-machine";
import AuthClient from "./AuthClient";

type UserContextProps = {
  user?: JustfixUser;
  login: (username: string, password: string) => Promise<string | void>;
  logout: () => void;
};

const initialState: UserContextProps = {
  login: async (username: string, password: string) => {},
  logout: () => {},
};

export const UserContext = createContext<UserContextProps>(initialState);

export const UserContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<JustfixUser>();
  useEffect(() => {
    const asyncFetchUser = async () => {
      const _user = await AuthClient.fetchUser();
      setUser(_user);
    };
    asyncFetchUser();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await AuthClient.authenticate(username, password);
    if (!response.error && response.user) {
      setUser(response.user);
      return;
    } else {
      return response.error_description;
    }
  }, []);

  const logout = useCallback(() => {
    const asyncLogout = async () => {
      await AuthClient.logout();
      setUser(undefined);
    };
    asyncLogout();
  }, []);

  const providerValue = useMemo(
    () => ({
      user,
      login,
      logout,
    }),
    [user, login, logout]
  );

  return <UserContext.Provider value={providerValue}>{children}</UserContext.Provider>;
};
