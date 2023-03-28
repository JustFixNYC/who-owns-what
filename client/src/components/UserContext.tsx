import React, { createContext, useState, useEffect, useMemo, useCallback } from "react";
import { JustfixUser } from "state-machine";
import AuthClient from "./AuthClient";

type UserContextProps = {
  user?: JustfixUser;
  login: (username: string, password: string) => Promise<string | void>;
  logout: () => void;
  subscribe: (bbl: string) => void;
  unsubscribe: (bbl: string) => void;
  updateEmail: (newEmail: string) => void;
};

const initialState: UserContextProps = {
  login: async (username: string, password: string) => {},
  logout: () => {},
  subscribe: (bbl: string) => {},
  unsubscribe: (bbl: string) => {},
  updateEmail: (newEmail: string) => {},
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

  const subscribe = useCallback(
    (bbl: string) => {
      if (user) {
        const asyncSubscribe = async () => {
          const response = await AuthClient.buildingSubscribe(bbl);
          setUser({ ...user, subscriptions: response.subscriptions });
        };
        asyncSubscribe();
      }
    },
    [user]
  );

  const unsubscribe = useCallback(
    (bbl: string) => {
      if (user) {
        const asyncUnsubscribe = async () => {
          const response = await AuthClient.buildingUnsubscribe(bbl);
          setUser({ ...user, subscriptions: response.subscriptions });
        };
        asyncUnsubscribe();
      }
    },
    [user]
  );

  const updateEmail = useCallback(
    (email: string) => {
      if (user) {
        const asyncUpdateEmail = async () => {
          const response = await AuthClient.updateEmail(email);
          setUser({ ...user, email: response.email });
        };
        asyncUpdateEmail();
      }
    },
    [user]
  );

  const providerValue = useMemo(
    () => ({
      user,
      login,
      logout,
      subscribe,
      unsubscribe,
      updateEmail,
    }),
    [user, login, logout, subscribe, unsubscribe, updateEmail]
  );

  return <UserContext.Provider value={providerValue}>{children}</UserContext.Provider>;
};