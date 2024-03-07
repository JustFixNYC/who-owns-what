import React, { createContext, useState, useEffect, useMemo, useCallback } from "react";
import { JustfixUser } from "state-machine";
import AuthClient from "./AuthClient";
import { authRequiredPaths } from "routes";

type UserOrError = {
  user?: JustfixUser;
  error?: string;
};

export type UserContextProps = {
  user?: JustfixUser;
  register: (
    username: string,
    password: string,
    userType: string,
    onSuccess?: (user: JustfixUser) => void
  ) => Promise<UserOrError | void>;
  login: (
    username: string,
    password: string,
    onSuccess?: (user: JustfixUser) => void
  ) => Promise<UserOrError | void>;
  logout: (fromPath: string) => void;
  subscribe: (
    bbl: string,
    housenumber: string,
    streetname: string,
    zip: string,
    boro: string,
    _user?: JustfixUser
  ) => void;
  unsubscribe: (bbl: string) => void;
  updateEmail: (newEmail: string) => void;
  updatePassword: (currentPassword: string, newPassword: string) => void;
  requestPasswordReset: (email: string) => void;
  resetPassword: (token: string, newPassword: string) => void;
};

const initialState: UserContextProps = {
  register: async (
    username: string,
    password: string,
    userType: string,
    onSuccess?: (user: JustfixUser) => void
  ) => {},
  login: async (username: string, password: string, onSuccess?: (user: JustfixUser) => void) => {},
  logout: (fromPath: string) => {},
  subscribe: (
    bbl: string,
    housenumber: string,
    streetname: string,
    zip: string,
    boro: string,
    _user?: JustfixUser
  ) => {},
  unsubscribe: (bbl: string) => {},
  updateEmail: (newEmail: string) => {},
  updatePassword: (currentPassword: string, newPassword: string) => {},
  requestPasswordReset: (email: string) => {},
  resetPassword: (token: string, newPassword: string) => {},
};

export const UserContext = createContext<UserContextProps>(initialState);

export const UserContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<JustfixUser>();
  useEffect(() => {
    const asyncFetchUser = async () => {
      const _user = await AuthClient.fetchUser();
      if (_user) {
        setUser({
          ..._user,
          subscriptions:
            _user.subscriptions?.map((s: any) => {
              return { ...s };
            }) || [],
        });
      }
    };
    asyncFetchUser();
  }, []);

  const register = useCallback(
    async (
      username: string,
      password: string,
      userType: string,
      onSuccess?: (user: JustfixUser) => void
    ) => {
      const response = await AuthClient.register(username, password, userType);
      if (!response.error && response.user) {
        const _user = {
          ...response.user,
          subscriptions:
            response.user.subscriptions?.map((s: any) => {
              return { ...s };
            }) || [],
        };
        setUser(_user);
        if (onSuccess) onSuccess(_user);
        return { user: _user };
      } else {
        return { error: response.error_description };
      }
    },
    []
  );

  const login = useCallback(
    async (username: string, password: string, onSuccess?: (user: JustfixUser) => void) => {
      const response = await AuthClient.login(username, password);
      console.log(response);
      if (!response.error && response.user) {
        const _user = {
          ...response.user,
          subscriptions:
            response.user.subscriptions?.map((s: any) => {
              return { ...s };
            }) || [],
        };
        setUser(_user);
        if (onSuccess) onSuccess(_user);
        return { user: _user };
      } else {
        return { error: response.error };
      }
    },
    []
  );

  const logout = useCallback(async (fromPath: string) => {
    const asyncLogout = async () => {
      await AuthClient.logout();
      setUser(undefined);
      if (authRequiredPaths().includes(fromPath)) {
        document.location.href = `${window.location.origin}`;
      }
    };
    asyncLogout();
  }, []);

  const subscribe = useCallback(
    (
      bbl: string,
      housenumber: string,
      streetname: string,
      zip: string,
      boro: string,
      _user?: JustfixUser
    ) => {
      const currentUser = user || _user;
      if (currentUser) {
        const asyncSubscribe = async () => {
          const response = await AuthClient.buildingSubscribe(
            bbl,
            housenumber,
            streetname,
            zip,
            boro
          );
          setUser({ ...currentUser, subscriptions: response.subscriptions });
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
          setUser({ ...user, email: response.email, verified: false });
        };
        asyncUpdateEmail();
      }
    },
    [user]
  );

  const updatePassword = useCallback(
    (currentPassword: string, newPassword: string) => {
      if (user) {
        const asyncUpdatePassword = async () => {
          await AuthClient.updatePassword(currentPassword, newPassword);
        };
        asyncUpdatePassword();
      }
    },
    [user]
  );

  const requestPasswordReset = useCallback((email: string) => {
    const asyncRequestResetPassword = async () => {
      await AuthClient.resetPasswordRequest(email);
    };
    asyncRequestResetPassword();
  }, []);

  const resetPassword = useCallback((token: string, newPassword: string) => {
    const asyncResetPassword = async () => {
      await AuthClient.resetPassword(token, newPassword);
    };
    asyncResetPassword();
  }, []);

  const providerValue = useMemo(
    () => ({
      user,
      register,
      login,
      logout,
      subscribe,
      unsubscribe,
      updateEmail,
      updatePassword,
      requestPasswordReset,
      resetPassword,
    }),
    [
      user,
      register,
      login,
      logout,
      subscribe,
      unsubscribe,
      updateEmail,
      updatePassword,
      requestPasswordReset,
      resetPassword,
    ]
  );

  return <UserContext.Provider value={providerValue}>{children}</UserContext.Provider>;
};
