import React, { createContext, useState, useEffect, useMemo, useCallback } from "react";
import { JustfixUser } from "state-machine";
import AuthClient from "./AuthClient";

type UserContextProps = {
  user?: JustfixUser;
  login: (user: JustfixUser) => void;
};

const initialState: UserContextProps = {
  login: (user: JustfixUser) => {},
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

  const login = useCallback((_user: JustfixUser) => {
    setUser(_user);
  }, []);

  const providerValue = useMemo(
    () => ({
      user,
      login,
    }),
    [user, login]
  );

  return <UserContext.Provider value={providerValue}>{children}</UserContext.Provider>;
};
