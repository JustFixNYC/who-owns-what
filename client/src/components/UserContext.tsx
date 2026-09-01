import React, { createContext, useState, useEffect, useMemo, useCallback } from "react";
import { JustfixUser } from "state-machine";
import AuthClient, { VerifyMagicLinkResponse, VerifyStatusCode } from "./AuthClient";
import { authRequiredPaths } from "routes";
import { District } from "./APIDataTypes";

type UserOrError = {
  user?: JustfixUser;
  error?: string;
};

type StartLoginResult = {
  user?: JustfixUser;
  created?: boolean;
  error?: string;
};

export type UserContextProps = {
  user?: JustfixUser;
  startLogin: (email: string) => Promise<StartLoginResult | void>;
  sendLoginCode: (
    email: string,
    options?: { userType?: string; phoneNumber?: string }
  ) => Promise<{ error?: string } | void>;
  verifyOtp: (
    email: string,
    code: string,
    onSuccess?: (user: JustfixUser) => void
  ) => Promise<UserOrError | void>;
  verifyMagicLink: (code: string, utmSource?: string) => Promise<VerifyMagicLinkResponse>;
  register: (
    username: string,
    password: string,
    userType: string,
    phoneNumber?: string,
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
  sendEmailChangeCode: (newEmail: string) => Promise<{ error?: string } | void>;
  verifyEmailChangeOtp: (newEmail: string, code: string) => Promise<UserOrError | void>;
  updateEmail: (newEmail: string) => void;
  updatePassword: (currentPassword: string, newPassword: string) => void;
  requestPasswordReset: (email: string) => void;
  resetPassword: (token: string, newPassword: string) => void;
};

const initialState: UserContextProps = {
  startLogin: async (email: string) => {},
  sendLoginCode: async (email: string, options?: { userType?: string; phoneNumber?: string }) => {},
  verifyOtp: async (email: string, code: string, onSuccess?: (user: JustfixUser) => void) => {},
  verifyMagicLink: async (code: string, utmSource?: string) => ({
    statusCode: VerifyStatusCode.Unknown,
    statusText: "",
  }),
  register: async (
    username: string,
    password: string,
    userType: string,
    phoneNumber?: string,
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
  sendEmailChangeCode: async (newEmail: string) => {},
  verifyEmailChangeOtp: async (newEmail: string, code: string) => {},
  updateEmail: (newEmail: string) => {},
  updatePassword: (currentPassword: string, newPassword: string) => {},
  requestPasswordReset: (email: string) => {},
  resetPassword: (token: string, newPassword: string) => {},
};

export const UserContext = createContext<UserContextProps>(initialState);

export const UserContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<JustfixUser>();

  const toJustfixUser = (raw: any): JustfixUser | undefined => {
    // `user === undefined` means fetch is still in flight (see LoginPage).
    // Logged-out auth_check returns a user-shaped object with no email — keep it.
    if (raw == null) return undefined;
    return {
      email: raw.email,
      verified: !!raw.verified,
      id: raw.id,
      type: raw.type,
      buildingSubscriptions: raw.buildingSubscriptions || raw.subscriptions || [],
      districtSubscriptions: raw.districtSubscriptions || raw.district_subscriptions || [],
      subscriptionLimit: raw.subscriptionLimit ?? raw.subscription_limit,
    };
  };

  const updateUserSubscriptions = (_user: JustfixUser | undefined): JustfixUser | undefined => {
    const normalized = toJustfixUser(_user);
    if (!normalized) return;
    const updatedUser = {
      ...normalized,
      buildingSubscriptions:
        normalized.buildingSubscriptions?.map((s: any) => {
          return { ...s };
        }) || [],
      districtSubscriptions:
        normalized.districtSubscriptions?.map((s: any) => {
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

  const startLogin = useCallback(async (email: string) => {
    const response = await AuthClient.startLogin(email);
    if (response.error) {
      return { error: response.error };
    }
    return { user: response.user, created: response.created };
  }, []);

  const sendLoginCode = useCallback(
    async (email: string, options?: { userType?: string; phoneNumber?: string }) => {
      const response = await AuthClient.sendLoginCode(email, options);
      if (response.error) {
        return { error: response.error };
      }
    },
    []
  );

  const verifyOtp = useCallback(
    async (email: string, code: string, onSuccess?: (user: JustfixUser) => void) => {
      const response = await AuthClient.verifyOtp(email, code);
      if (response.error || !response.user) {
        return { error: response.error || "Verification failed" };
      }
      const updatedUser = updateUserSubscriptions(response.user);
      if (onSuccess && updatedUser) onSuccess(updatedUser);
      return { user: updatedUser };
    },
    []
  );

  const verifyMagicLink = useCallback(async (code: string, utmSource?: string) => {
    const response = await AuthClient.verifyMagicLink(code, utmSource);
    if (response.statusCode === VerifyStatusCode.Success && response.user) {
      const updatedUser = updateUserSubscriptions(response.user);
      return { ...response, user: updatedUser };
    }
    return response;
  }, []);

  const register = useCallback(
    async (
      username: string,
      password: string,
      userType: string,
      phoneNumber?: string,
      onSuccess?: (user: JustfixUser) => void
    ) => {
      const response = await AuthClient.register(username, password, userType, phoneNumber);
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

  const sendEmailChangeCode = useCallback(async (newEmail: string) => {
    const response = await AuthClient.sendEmailChangeCode(newEmail);
    if (response?.error) {
      return { error: response.error };
    }
  }, []);

  const verifyEmailChangeOtp = useCallback(async (newEmail: string, code: string) => {
    const response = await AuthClient.verifyEmailChangeOtp(newEmail, code);
    if (response?.error || !response?.user) {
      return { error: response?.error || "Verification failed" };
    }
    const updatedUser = updateUserSubscriptions(response.user);
    return { user: updatedUser };
  }, []);

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
      startLogin,
      sendLoginCode,
      verifyOtp,
      verifyMagicLink,
      register,
      login,
      logout,
      subscribeBuilding,
      unsubscribeBuilding,
      subscribeDistrict,
      unsubscribeDistrict,
      sendEmailChangeCode,
      verifyEmailChangeOtp,
      updateEmail,
      updatePassword,
      requestPasswordReset,
      resetPassword,
    }),
    [
      user,
      startLogin,
      sendLoginCode,
      verifyOtp,
      verifyMagicLink,
      register,
      login,
      logout,
      subscribeBuilding,
      unsubscribeBuilding,
      subscribeDistrict,
      unsubscribeDistrict,
      sendEmailChangeCode,
      verifyEmailChangeOtp,
      updateEmail,
      updatePassword,
      requestPasswordReset,
      resetPassword,
    ]
  );

  return <UserContext.Provider value={providerValue}>{children}</UserContext.Provider>;
};
