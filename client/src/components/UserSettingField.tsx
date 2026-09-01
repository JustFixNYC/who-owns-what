import React, { useContext, useState } from "react";

import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans } from "@lingui/macro";
import { I18n } from "@lingui/core";

import "styles/EmailAlertSignup.css";
import "styles/UserSettingField.css";
import { useInput } from "util/helpers";
import { UserContext } from "./UserContext";
import { JustfixUser } from "state-machine";
import EmailInput from "./EmailInput";
import AuthClient from "./AuthClient";
import { Alert } from "./Alert";
import { Button, Icon } from "@justfixnyc/component-library";
import { CodeEntry } from "./CodeEntry";
import { reloginToVerify } from "./EmailAlertSignup";
import { Nobr } from "./Nobr";

const BRANCH_NAME = process.env.REACT_APP_BRANCH;

export const mapSettingAuthError = (error: string | undefined, i18n: I18n): string => {
  switch (error) {
    case "Invalid OTP.":
      return i18n._(t`The code you entered is incorrect.`);
    case "OTP has expired. Please request a new code.":
      return i18n._(t`That code has expired. Request a new one.`);
    case "Too many invalid attempts. Please request a new code.":
      return i18n._(t`Too many attempts. Request a new code.`);
    case "Too many requests":
      return i18n._(t`Too many requests. Please try again later.`);
    case "Email already in use":
      return i18n._(t`That email is already used.`);
    default:
      return i18n._(t`Something went wrong. Please try again.`);
  }
};

type EmailSettingFieldProps = withI18nProps & {
  currentValue: string;
};

const EmailSettingFieldWithoutI18n = (props: EmailSettingFieldProps) => {
  const { i18n, currentValue } = props;
  const userContext = useContext(UserContext);
  const user = userContext.user as JustfixUser;
  const { email: oldEmail, verified } = user;
  const [isEmailResent, setIsEmailResent] = React.useState(false);
  const [isResending, setIsResending] = useState(false);
  const [existingUserError, setExistingUserError] = useState(false);
  const [step, setStep] = useState<"field" | "code">("field");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpError, setOtpError] = useState("");
  const [sendError, setSendError] = useState("");
  const {
    value: email,
    error: emailError,
    showError: showEmailError,
    setError: setEmailError,
    setShowError: setShowEmailError,
    onChange: onChangeEmail,
  } = useInput(oldEmail);

  const eventUserParams = { user_id: user.id, user_type: user.type };

  const handleSubmit = async () => {
    setExistingUserError(false);
    setShowEmailError(false);
    setSendError("");

    if (email === oldEmail) {
      return;
    }

    if (!email || emailError) {
      setEmailError(true);
      setShowEmailError(true);
      throw new Error("Email format error");
    }

    const existingUser = await AuthClient.isEmailAlreadyUsed(email);
    if (existingUser) {
      setExistingUserError(true);
      throw new Error("Existing user error");
    }

    const resp = await userContext.sendEmailChangeCode(email);
    if (resp?.error) {
      if (resp.error === "Email already in use") {
        setExistingUserError(true);
      } else {
        setSendError(mapSettingAuthError(resp.error, i18n));
      }
      throw new Error(resp.error);
    }

    setPendingEmail(email);
    setOtpError("");
    setStep("code");
  };

  const handleVerifyOtp = async (code: string) => {
    const resp = await userContext.verifyEmailChangeOtp(pendingEmail, code);
    if (resp?.error) {
      setOtpError(mapSettingAuthError(resp.error, i18n));
      return;
    }
    window.gtag("event", "account-update-email", { ...eventUserParams, branch: BRANCH_NAME });
    setStep("field");
  };

  const handleResendCode = async () => {
    setOtpError("");
    const resp = await userContext.sendEmailChangeCode(pendingEmail);
    if (resp?.error) {
      setOtpError(mapSettingAuthError(resp.error, i18n));
      throw new Error(resp.error);
    }
  };

  const handleCalloutResend = async () => {
    if (!oldEmail || isResending) return;
    setIsResending(true);
    const resp = await userContext.sendLoginCode(oldEmail);
    const eventParams = { ...eventUserParams, from: "account settings" };
    window.gtag("event", "email-verify-resend", { ...eventParams, branch: BRANCH_NAME });
    setIsResending(false);
    if (resp?.error) {
      return;
    }
    setIsEmailResent(true);
  };

  const verifyCallout = !verified ? (
    <div className="jf-callout">
      <Trans render="p">
        Your email address is not yet verified. Enter the code or click the sign-in link we send to{" "}
        {oldEmail} to start receiving email alerts.
      </Trans>
      {isEmailResent ? (
        <Trans render="p">
          We sent a new code to <Nobr>{oldEmail}</Nobr>
        </Trans>
      ) : (
        <>
          <Trans render="p">Didn’t receive a code?</Trans>
          <Button
            variant="secondary"
            size="small"
            labelText={i18n._(t`Resend`)}
            loading={isResending}
            disabled={isResending}
            onClick={handleCalloutResend}
          />
        </>
      )}
      <Button
        variant="tertiary"
        size="small"
        labelText={i18n._(t`Log in`)}
        onClick={() => reloginToVerify(oldEmail, i18n.language)}
      />
    </div>
  ) : undefined;

  if (step === "code") {
    return (
      <div className="UserSetting email-change-code">
        <CodeEntry
          email={pendingEmail}
          onVerify={handleVerifyOtp}
          onResend={handleResendCode}
          error={otpError}
        />
        <Button
          type="button"
          variant="tertiary"
          size="small"
          labelText={i18n._(t`Cancel`)}
          onClick={() => {
            setStep("field");
            setOtpError("");
          }}
        />
      </div>
    );
  }

  return (
    <UserSettingField
      title={i18n._(t`Email address`)}
      preview={currentValue}
      onSubmit={handleSubmit}
      verifyCallout={verifyCallout}
    >
      {existingUserError && (
        <Alert
          className={`page-level-alert`}
          variant="primary"
          closeType="none"
          role="status"
          type="error"
        >
          <Icon icon="circleExclamation" />
          {i18n._(t`That email is already used.`)}
        </Alert>
      )}
      {!!sendError && (
        <Alert
          className={`page-level-alert`}
          variant="primary"
          closeType="none"
          role="status"
          type="error"
        >
          <Icon icon="circleExclamation" />
          {sendError}
        </Alert>
      )}
      <Trans render="label" className="user-setting-label">
        Email address
      </Trans>
      <Trans render="p">We send alerts to this email.</Trans>
      <EmailInput
        email={email}
        error={emailError}
        showError={showEmailError}
        setError={setEmailError}
        onChange={onChangeEmail}
        autoFocus
        placeholder={i18n._(t`Enter new email address`)}
      />
    </UserSettingField>
  );
};

export const EmailSettingField = withI18n()(EmailSettingFieldWithoutI18n);

type UserSettingFieldProps = withI18nProps & {
  title: string;
  preview: string;
  onSubmit: () => Promise<void>;
  children: React.ReactNode;
  verifyCallout?: React.ReactNode;
};

const UserSettingFieldWithoutI18n = (props: UserSettingFieldProps) => {
  const { title, preview, onSubmit, children, verifyCallout, i18n } = props;
  const [editing, setEditing] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit().then(
      (response) => setEditing(false),
      (error) => {}
    );
  };

  return (
    <div className={`UserSetting`}>
      <form onSubmit={handleSubmit} className="input-group">
        {editing ? (
          <>
            {children}
            <div className="user-setting-actions">
              <Button type="submit" variant="primary" size="small" labelText={i18n._(t`Save`)} />
              <Button
                type="button"
                variant="tertiary"
                size="small"
                labelText={i18n._(t`Cancel`)}
                onClick={() => setEditing(false)}
              />
            </div>
          </>
        ) : (
          <>
            <label className="user-setting-label">{title}</label>
            <div>
              <span>{preview}</span>
              <Button
                type="button"
                variant="tertiary"
                size="small"
                className="edit-button"
                labelText={i18n._(t`Edit`)}
                onClick={() => setEditing(true)}
              />
            </div>
            {!!verifyCallout && verifyCallout}
          </>
        )}
      </form>
    </div>
  );
};

const UserSettingField = withI18n()(UserSettingFieldWithoutI18n);

export default UserSettingField;
