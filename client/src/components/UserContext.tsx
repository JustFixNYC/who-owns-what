import React, { createContext, useState, useEffect, useMemo, useCallback } from "react";
import { JustfixUser } from "state-machine";
import AuthClient from "./AuthClient";

export type UserContextProps = {
  user?: JustfixUser;
  login: (username: string, password: string) => Promise<string | void>;
  logout: () => void;
  subscribe: (
    bbl: string,
    housenumber: string,
    streetname: string,
    zip: string,
    boro: string
  ) => void;
  unsubscribe: (bbl: string) => void;
  updateEmail: (newEmail: string) => void;
  updatePassword: (currentPassword: string, newPassword: string) => void;
  requestPasswordReset: (email: string) => void;
  resetPassword: (token: string, newPassword: string) => void;
};

const initialState: UserContextProps = {
  login: async (username: string, password: string) => {},
  logout: () => {},
  subscribe: (
    bbl: string,
    housenumber: string,
    streetname: string,
    zip: string,
    boro: string
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

  const login = useCallback(async (username: string, password: string) => {
    const response = await AuthClient.authenticate(username, password);
    if (!response.error && response.user) {
      setUser({
        ...response.user,
        subscriptions:
          response.user.subscriptions?.map((s: any) => {
            return { ...s };
          }) || [],
      });
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
    (bbl: string, housenumber: string, streetname: string, zip: string, boro: string) => {
      if (user) {
        const asyncSubscribe = async () => {
          const response = await AuthClient.buildingSubscribe(
            bbl,
            housenumber,
            streetname,
            zip,
            boro
          );
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
