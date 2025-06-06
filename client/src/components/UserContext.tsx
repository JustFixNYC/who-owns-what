import React, { createContext, useState, useEffect, useMemo, useCallback } from "react";
import { JustfixUser } from "state-machine";
import AuthClient from "./AuthClient";
import { authRequiredPaths } from "routes";
import { District } from "./APIDataTypes";

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
  subscribeBuilding: (
    bbl: string,
    housenumber: string,
    streetname: string,
    zip: string,
    boro: string,
    _user?: JustfixUser
  ) => void;
  unsubscribeBuilding: (bbl: string) => void;
  subscribeDistrict: (district: District, _user?: JustfixUser) => void;
  unsubscribeDistrict: (subscription_id: string) => void;
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
  subscribeBuilding: (
    bbl: string,
    housenumber: string,
    streetname: string,
    zip: string,
    boro: string,
    _user?: JustfixUser
  ) => {},
  unsubscribeBuilding: (bbl: string) => {},
  subscribeDistrict: (district: District, _user?: JustfixUser) => {},
  unsubscribeDistrict: (subscription_id: string) => {},
  updateEmail: (newEmail: string) => {},
  updatePassword: (currentPassword: string, newPassword: string) => {},
  requestPasswordReset: (email: string) => {},
  resetPassword: (token: string, newPassword: string) => {},
};

export const UserContext = createContext<UserContextProps>(initialState);

export const UserContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<JustfixUser>();

  const updateUserSubscriptions = (_user: JustfixUser | undefined): JustfixUser | undefined => {
    if (!_user) return;
    const updatedUser = {
      ..._user,
      buildingSubscriptions:
        _user.buildingSubscriptions?.map((s: any) => {
          return { ...s };
        }) || [],
      districtSubscriptions:
        _user.districtSubscriptions?.map((s: any) => {
          return { ...s };
        }) || [],
    };
    setUser(updatedUser);
    return updatedUser;
  };

  useEffect(() => {
    const asyncFetchUser = async () => {
      const _user = await AuthClient.fetchUser();
      updateUserSubscriptions(_user);
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
      if (response.error || !response.user) {
        return { error: response.error_description };
      }
      const updatedUser = updateUserSubscriptions(response.user);
      if (onSuccess && updatedUser) onSuccess(updatedUser);
      return { user: updatedUser };
    },
    []
  );

  const login = useCallback(
    async (username: string, password: string, onSuccess?: (user: JustfixUser) => void) => {
      const response = await AuthClient.login(username, password);
      if (response.error || !response.user) {
        return { error: response.error };
      }
      const updatedUser = updateUserSubscriptions(response.user);
      if (onSuccess && updatedUser) onSuccess(updatedUser);
      return { user: updatedUser };
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

  const subscribeBuilding = useCallback(
    (
      bbl: string,
      housenumber: string,
      streetname: string,
      zip: string,
      boro: string,
      _user?: JustfixUser
    ) => {
      const currentUser = !!user?.email ? user : _user;
      if (currentUser) {
        const asyncSubscribe = async () => {
          const response = await AuthClient.subscribeBuilding(
            bbl,
            housenumber,
            streetname,
            zip,
            boro
          );
          setUser({ ...currentUser, buildingSubscriptions: response["building_subscriptions"] });
        };
        asyncSubscribe();
      }
    },
    [user]
  );

  const unsubscribeBuilding = useCallback(
    (bbl: string) => {
      if (user) {
        const asyncUnsubscribe = async () => {
          const response = await AuthClient.unsubscribeBuilding(bbl);
          setUser({ ...user, buildingSubscriptions: response["building_subscriptions"] });
        };
        asyncUnsubscribe();
      }
    },
    [user]
  );

  const subscribeDistrict = useCallback(
    async (district: District, _user?: JustfixUser) => {
      const currentUser = !!user?.email ? user : _user;
      if (currentUser) {
        const asyncSubscribe = async () => {
          const response = await AuthClient.subscribeDistrict(district);
          setUser({ ...currentUser, districtSubscriptions: response["district_subscriptions"] });
        };
        await asyncSubscribe();
      }
    },
    [user]
  );

  const unsubscribeDistrict = useCallback(
    (subscription_id: string) => {
      if (user) {
        const asyncUnsubscribe = async () => {
          const response = await AuthClient.unsubscribeDistrict(subscription_id);
          setUser({ ...user, districtSubscriptions: response["district_subscriptions"] });
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
      subscribeBuilding,
      unsubscribeBuilding,
      subscribeDistrict,
      unsubscribeDistrict,
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
      subscribeBuilding,
      unsubscribeBuilding,
      subscribeDistrict,
      unsubscribeDistrict,
      updateEmail,
      updatePassword,
      requestPasswordReset,
      resetPassword,
    ]
  );

  return <UserContext.Provider value={providerValue}>{children}</UserContext.Provider>;
};
