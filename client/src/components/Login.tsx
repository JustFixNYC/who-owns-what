import React, { useState, useContext, useEffect } from "react";
import { Trans, t } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";
import { I18n } from "@lingui/core";
import { useHistory, useLocation } from "react-router-dom";
import { Button } from "@justfixnyc/component-library";

import "styles/_input.scss";
import { JustfixUser } from "state-machine";
import { UserContext } from "./UserContext";
import helpers, { useInput } from "util/helpers";
import EmailInput from "./EmailInput";
import UserTypeInput from "./UserTypeInput";
import PhoneNumberInput from "./PhoneNumberInput";
import { Alert } from "./Alert";
import { CodeEntry } from "./CodeEntry";
import { SendLoginCodeOptions } from "./AuthClient";
import { NETWORK_AUTH_ERROR, reportUnexpectedAuthError } from "./auth-errors";
import { JFCLLocaleLink } from "i18n";
import { createRouteForAddressPage, createWhoOwnsWhatRoutePaths } from "routes";
import { AddressRecord, District } from "./APIDataTypes";
import { isLegacyPath } from "./WowzaToggle";

const BRANCH_NAME = process.env.REACT_APP_BRANCH;

enum Step {
  CheckEmail,
  RegisterPhoneNumber,
  RegisterUserType,
  CodeEntry,
  LoginSuccess,
}

export const mapAuthError = (error: string | undefined, i18n: I18n): string => {
  switch (error) {
    case "Invalid OTP.":
      return i18n._(t`The code you entered is incorrect.`);
    case "OTP has expired. Please request a new code.":
      return i18n._(t`That code has expired. Request a new one.`);
    case "Too many invalid attempts. Please request a new code.":
      return i18n._(t`Too many attempts. Request a new code.`);
    case "Too many requests":
      return i18n._(t`Too many requests. Please try again later.`);
    case "Email delivery failed":
      return i18n._(t`We couldn't send the email. Please try again.`);
    case NETWORK_AUTH_ERROR:
    case "Auth service unavailable":
    default:
      return i18n._(t`Something went wrong. Please try again.`);
  }
};

const LoginWithoutI18n = (props: withI18nProps) => {
  const { i18n } = props;

  const userContext = useContext(UserContext);
  const { home, account, termsOfUse, privacyPolicy, areaAlerts } = createWhoOwnsWhatRoutePaths();
  const history = useHistory();
  const { pathname, search, state: locationState } = useLocation();
  const loginParams = new URLSearchParams(search);
  const fromPasswordLink = loginParams.get("from") === "password";

  const [addr, setAddr] = React.useState<AddressRecord>();
  const [district, setDistrict] = React.useState<District>();
  const [returnRoute, setReturnRoute] = React.useState<string>();
  const [fromBuildingAlerts, setFromBuildingAlerts] = React.useState(false);
  const [housenumberDisplay, setHousenumberDisplay] = React.useState<string>();
  const [streetnameDisplay, setStreetnameDisplay] = React.useState<string>();
  // switch to regular state and clear location state since it otherwise persists after reloads
  useEffect(() => {
    setAddr(locationState?.addr);
    setDistrict(locationState?.district);
    setReturnRoute(locationState?.returnRoute);
    setFromBuildingAlerts(!!locationState?.fromBuildingAlerts);
    setHousenumberDisplay(locationState?.housenumber_display);
    setStreetnameDisplay(locationState?.streetname_display);
    window.history.replaceState({ state: undefined }, "");
  }, [locationState]);

  const [step, setStep] = useState(Step.CheckEmail);
  const isCheckEmailStep = step === Step.CheckEmail;
  const isRegisterUserTypeStep = step === Step.RegisterUserType;
  const isRegisterPhoneNumberStep = step === Step.RegisterPhoneNumber;
  const isCodeEntryStep = step === Step.CodeEntry;
  const isLoginSuccessStep = step === Step.LoginSuccess;

  const [isNewUser, setIsNewUser] = useState(false);

  const {
    value: email,
    error: emailError,
    showError: showEmailError,
    setError: setEmailError,
    setShowError: setShowEmailError,
    onChange: onChangeEmail,
  } = useInput(loginParams.get("email") || "");
  const {
    value: userType,
    error: userTypeError,
    showError: showUserTypeError,
    setValue: setUserType,
    setError: setUserTypeError,
    setShowError: setShowUserTypeError,
  } = useInput("");
  const {
    value: phoneNumber,
    setValue: setPhoneNumber,
    error: phoneNumberError,
    showError: showPhoneNumberError,
    setError: setPhoneNumberError,
    setShowError: setShowPhoneNumberError,
  } = useInput("");

  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [otpError, setOtpError] = useState("");

  const eventParams = (user?: JustfixUser) => {
    const customParams = {
      from: !!addr ? "building page" : !!district ? "district page" : "nav",
      branch: BRANCH_NAME,
    };
    const params = !!user?.id
      ? {
          ...customParams,
          user_id: user.id,
          user_type: user.type,
        }
      : customParams;

    return params;
  };

  const getAddrPageRoute = (addr: AddressRecord) => {
    const isLegacy = isLegacyPath(pathname);
    return createRouteForAddressPage({ ...addr, locale: i18n.language }, isLegacy);
  };

  const getAddrReturnRoute = (addr: AddressRecord) => returnRoute ?? getAddrPageRoute(addr);

  const formatAddr = (addr: AddressRecord, withBoro = true) => {
    if (!addr) return;
    const addrWithoutBoro = `${addr.housenumber} ${helpers.titleCase(addr.streetname)}`;
    return withBoro ? `${addrWithoutBoro}, ${helpers.titleCase(addr.boro)}` : addrWithoutBoro;
  };

  const formatDisplayAddr = (addr: AddressRecord, withBoro = true) => {
    if (!addr) return;
    if (fromBuildingAlerts && streetnameDisplay) {
      const hn = housenumberDisplay ?? "";
      const prefix = hn ? `${hn} ` : "";
      const addrWithoutBoro = `${prefix}${helpers.titleCase(streetnameDisplay)}`;
      return withBoro ? `${addrWithoutBoro}, ${helpers.titleCase(addr.boro)}` : addrWithoutBoro;
    }
    return formatAddr(addr, withBoro);
  };

  const subscribeOnSuccess = async (user: JustfixUser) => {
    if (addr) {
      await userContext.subscribeBuilding(
        addr.bbl,
        addr.housenumber,
        addr.streetname,
        addr.zip ?? "",
        addr.boro,
        user,
        fromBuildingAlerts ? housenumberDisplay : undefined,
        fromBuildingAlerts ? streetnameDisplay : undefined
      );
    }

    if (district) {
      await userContext.subscribeDistrict(district, user);
    }
  };

  const resetAlertErrorStates = () => {
    setPageError("");
    setOtpError("");
  };

  const hideInputErrors = () => {
    setShowEmailError(false);
    setShowUserTypeError(false);
    setShowPhoneNumberError(false);
  };

  const cleanedPhone = phoneNumber ? phoneNumber.replace(/\D/g, "").slice(0, 10) : undefined;

  const sendCodeOptions = (): SendLoginCodeOptions | undefined => {
    const options: SendLoginCodeOptions = {};
    if (isNewUser) {
      options.userType = userType;
      options.phoneNumber = cleanedPhone;
    }
    if (addr) {
      options.building = {
        bbl: addr.bbl,
        housenumber: addr.housenumber,
        streetname: addr.streetname,
        zip: addr.zip ?? "",
        boro: addr.boro,
      };
    }
    if (!options.userType && !options.phoneNumber && !options.building) {
      return undefined;
    }
    return options;
  };

  const sendCode = async () => {
    return userContext.sendLoginCode(email, sendCodeOptions());
  };

  const renderPageLevelAlert = (type: "error" | "success" | "info", message: string) => {
    return (
      <Alert
        className={`page-level-alert`}
        variant="primary"
        closeType="none"
        role="status"
        type={type}
      >
        {message}
      </Alert>
    );
  };

  const renderAlert = () => {
    if (pageError) {
      return renderPageLevelAlert("error", pageError);
    }
    if (fromPasswordLink && isCheckEmailStep) {
      return renderPageLevelAlert(
        "info",
        i18n._(t`We no longer use passwords — enter your email for a code or link.`)
      );
    }
  };

  const renderFooter = () => {
    return (
      <div className="login-footer">
        {isRegisterPhoneNumberStep && (
          <span className="privacy-links">
            <Trans>
              Your privacy is important to us. Read our{" "}
              <JFCLLocaleLink to={privacyPolicy} target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </JFCLLocaleLink>{" "}
              and{" "}
              <JFCLLocaleLink to={termsOfUse} target="_blank" rel="noopener noreferrer">
                Terms of Use
              </JFCLLocaleLink>
              .
            </Trans>
          </span>
        )}
      </div>
    );
  };

  const renderLoginSuccess = () => (
    <>
      <Trans render="h1">You are logged in</Trans>
      {!!district ? (
        <Trans render="h2">
          We have added Area Alerts to your weekly emails. Visit your{" "}
          <JFCLLocaleLink to={account.settings}>email settings</JFCLLocaleLink> to manage Area
          Alerts.
        </Trans>
      ) : (
        <Trans render="h2">
          <JFCLLocaleLink to={home}>Search for an address</JFCLLocaleLink> to add to your Building
          Alerts, <JFCLLocaleLink to={areaAlerts}>subscribe to Area Alerts</JFCLLocaleLink>, or
          visit your <JFCLLocaleLink to={account.settings}>email settings</JFCLLocaleLink> page to
          manage subscriptions.
        </Trans>
      )}
    </>
  );

  const finishAuthenticatedSession = (user?: JustfixUser) => {
    window.gtag("event", isNewUser ? "register-success" : "login-success", eventParams(user));

    if (!!addr || !!district) {
      const subscribeEventParams = { ...eventParams(), from: isNewUser ? "register" : "login" };
      const eventName = `subscribe-${!!addr ? "building" : "district"}-via-register-login`;
      window.gtag("event", eventName, { ...subscribeEventParams });

      const redirectTo = {
        pathname: !!addr ? getAddrReturnRoute(addr) : `/${i18n.language}${account.settings}`,
        state: {
          justSubscribed: true,
          justLoggedIn: true,
          subscribedTo: !!addr ? "building" : "district",
        },
      };
      history.push(redirectTo);
      return;
    }

    setStep(Step.LoginSuccess);
  };

  const onEmailSubmit = async () => {
    window.gtag("event", "register-login-email", eventParams());
    if (!email || emailError) {
      setEmailError(true);
      setShowEmailError(true);
      return;
    }

    const resp = await userContext.startLogin(email);
    if (resp?.error) {
      reportUnexpectedAuthError(resp.error);
      setPageError(mapAuthError(resp.error, i18n));
      return;
    }

    if (resp?.created) {
      setIsNewUser(true);
      setStep(Step.RegisterPhoneNumber);
      return;
    }

    setIsNewUser(false);
    window.gtag("event", "login-send-code", eventParams());
    const sendResp = await userContext.sendLoginCode(email, sendCodeOptions());
    if (sendResp?.error) {
      reportUnexpectedAuthError(sendResp.error);
      setPageError(mapAuthError(sendResp.error, i18n));
      return;
    }
    setStep(Step.CodeEntry);
  };

  const onUserTypeSubmit = async () => {
    window.gtag("event", "register-user-type", eventParams());

    if (!userType || userTypeError) {
      setUserTypeError(true);
      setShowUserTypeError(true);
      return;
    }

    window.gtag("event", "login-send-code", { ...eventParams(), from: "register" });
    const sendResp = await userContext.sendLoginCode(email, sendCodeOptions());
    if (sendResp?.error) {
      reportUnexpectedAuthError(sendResp.error);
      setPageError(mapAuthError(sendResp.error, i18n));
      return;
    }
    setStep(Step.CodeEntry);
  };

  const onChangePhoneNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = helpers.formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setShowPhoneNumberError(false);
  };

  const onPhoneNumberSubmit = async () => {
    window.gtag("event", "register-phone-number", eventParams());

    if (phoneNumberError) {
      setShowPhoneNumberError(true);
      return;
    }

    setStep(Step.RegisterUserType);
  };

  const onVerifyOtp = async (code: string) => {
    window.gtag("event", "login-verify-otp", eventParams());
    try {
      const resp = await userContext.verifyOtp(email, code, subscribeOnSuccess);
      if (resp?.error) {
        reportUnexpectedAuthError(resp.error);
        setOtpError(mapAuthError(resp.error, i18n));
        window.gtag("event", "login-otp-invalid", eventParams());
        return;
      }
      finishAuthenticatedSession(resp?.user);
    } catch (err) {
      reportUnexpectedAuthError(err);
      setOtpError(mapAuthError(NETWORK_AUTH_ERROR, i18n));
    }
  };

  const onResendCode = async () => {
    window.gtag("event", "login-code-resend", {
      ...eventParams(),
      from: isNewUser ? "register" : "login",
    });
    setOtpError("");
    const sendResp = await sendCode();
    if (sendResp?.error) {
      reportUnexpectedAuthError(sendResp.error);
      setOtpError(mapAuthError(sendResp.error, i18n));
      throw new Error(sendResp.error);
    }
  };

  let stepProgress = "";
  let headerText: any;
  let subHeaderText: any;
  let onSubmit = async () => {};
  let submitButtonText = "";
  switch (step) {
    case Step.CheckEmail:
      if (addr) {
        headerText = formatDisplayAddr(addr, false);
        subHeaderText = i18n._(t`Log in or sign up to get weekly email updates on this building.`);
      } else {
        headerText = i18n._(t`Log in / Sign up`);
        subHeaderText = district
          ? i18n._(t`Use your account to get weekly email alerts on the areas you select.`)
          : i18n._(t`Use your account to get weekly email alerts on the buildings you select.`);
      }
      onSubmit = onEmailSubmit;
      submitButtonText = i18n._(t`Submit`);
      break;
    case Step.RegisterPhoneNumber:
      stepProgress = i18n._(t`Step 1 of 2`);
      headerText = i18n._(t`Sign up for Email Alerts`);
      subHeaderText = i18n._(
        t`We’ll text you in a few months to ask how we can improve this free service.`
      );
      onSubmit = onPhoneNumberSubmit;
      submitButtonText = i18n._(t`Next`);
      break;
    case Step.RegisterUserType:
      stepProgress = i18n._(t`Step 2 of 2`);
      headerText = i18n._(t`Sign up for Email Alerts`);
      subHeaderText = i18n._(t`Which best describes you?`);
      onSubmit = onUserTypeSubmit;
      submitButtonText = i18n._(t`Sign up`);
      break;
  }

  return (
    <div className="Login">
      {stepProgress && <span className="step-progress">{stepProgress}</span>}
      {renderAlert()}
      {!!headerText && <h1>{headerText}</h1>}
      {!!subHeaderText && <h2>{subHeaderText}</h2>}
      {!isCodeEntryStep && !isLoginSuccessStep && (
        <form
          className="input-group"
          onSubmit={async (e) => {
            e.preventDefault();
            setIsLoading(true);
            resetAlertErrorStates();
            hideInputErrors();
            try {
              await onSubmit();
            } catch (err) {
              reportUnexpectedAuthError(err);
              setPageError(mapAuthError(NETWORK_AUTH_ERROR, i18n));
            } finally {
              setIsLoading(false);
            }
          }}
        >
          {isCheckEmailStep && (
            <EmailInput
              email={email}
              onChange={onChangeEmail}
              error={emailError}
              setError={setEmailError}
              showError={showEmailError}
              autoFocus={true}
              labelText={i18n._(t`Email address`)}
            />
          )}
          {isRegisterUserTypeStep && (
            <UserTypeInput
              setUserType={setUserType}
              error={userTypeError}
              showError={showUserTypeError}
              setError={setUserTypeError}
            />
          )}
          {isRegisterPhoneNumberStep && (
            <PhoneNumberInput
              phone={phoneNumber}
              onChange={onChangePhoneNumber}
              error={phoneNumberError}
              setError={setPhoneNumberError}
              showError={showPhoneNumberError}
              autoFocus={true}
              labelText={i18n._(t`Phone number (optional)`)}
            />
          )}
          <div className="submit-button-group">
            <Button
              type="submit"
              variant="primary"
              size="large"
              labelText={submitButtonText}
              loading={isLoading}
            />
          </div>
        </form>
      )}
      {isCodeEntryStep && (
        <CodeEntry email={email} onVerify={onVerifyOtp} onResend={onResendCode} error={otpError} />
      )}
      {isLoginSuccessStep && renderLoginSuccess()}
      {isRegisterPhoneNumberStep && renderFooter()}
    </div>
  );
};

export const Login = withI18n()(LoginWithoutI18n);

export default Login;
