import React, { useContext, useState } from "react";

import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans } from "@lingui/macro";

import "styles/EmailAlertSignup.css";
import PasswordInput from "./PasswordInput";
import { useInput } from "util/helpers";
import { UserContext } from "./UserContext";
import { JustfixUser } from "state-machine";
import EmailInput from "./EmailInput";
import AuthClient from "./AuthClient";
import { Alert } from "./Alert";
import { AlertIconOutline } from "./Icons";

type PasswordSettingFieldProps = withI18nProps & {
  onSubmit: (currentPassword: string, newPassword: string) => void;
};

const PasswordSettingFieldWithoutI18n = (props: PasswordSettingFieldProps) => {
  const { i18n, onSubmit } = props;
  const userContext = useContext(UserContext);
  const { email } = userContext.user as JustfixUser;
  const {
    value: currentPassword,
    error: currentPasswordError,
    showError: showCurrentPasswordError,
    setError: setCurrentPasswordError,
    setShowError: setShowCurrentPasswordError,
    onChange: onChangeCurrentPassword,
  } = useInput("");
  const {
    value: newPassword,
    error: newPasswordError,
    showError: showNewPasswordError,
    setError: setNewPasswordError,
    setShowError: setShowNewPasswordError,
    onChange: onChangeNewPassword,
  } = useInput("");
  const [invalidAuthError, setInvalidAuthError] = useState(false);

  const handleSubmit = async () => {
    setInvalidAuthError(false);
    setShowCurrentPasswordError(false);
    setShowNewPasswordError(false);

    if (!currentPassword) {
      setCurrentPasswordError(true);
      setShowCurrentPasswordError(true);
      throw new Error("Current password missing");
    }

    if (!newPassword || newPasswordError) {
      setNewPasswordError(true);
      setShowNewPasswordError(true);
      throw new Error("New password format error");
    }

    // context doesn't update immediately so need to reurn user to check verified status
    const resp = await userContext.login(email, currentPassword);

    if (!!resp?.error) {
      setInvalidAuthError(true);
      throw new Error("Incorrect current password");
    }

    onSubmit(currentPassword, newPassword);
  };

  return (
    <UserSettingField title={i18n._(t`Password`)} preview="**********" onSubmit={handleSubmit}>
      {invalidAuthError && (
        <Alert
          className={`page-level-alert`}
          variant="primary"
          closeType="none"
          role="status"
          type="error"
        >
          <AlertIconOutline />
          {i18n._(t`The old password you entered is incorrect`)}
        </Alert>
      )}
      <Trans render="label" className="user-setting-label">
        Password
      </Trans>
      <PasswordInput
        labelText={i18n._(t`Enter your old password`)}
        password={currentPassword}
        error={currentPasswordError}
        showError={showCurrentPasswordError}
        setError={setCurrentPasswordError}
        onChange={onChangeCurrentPassword}
        id="old-password-input"
      />
      <PasswordInput
        labelText={i18n._(t`Create a new password`)}
        showPasswordRules={true}
        password={newPassword}
        error={newPasswordError}
        showError={showNewPasswordError}
        setError={setNewPasswordError}
        onChange={onChangeNewPassword}
        id="new-password-input"
      />
    </UserSettingField>
  );
};

export const PasswordSettingField = withI18n()(PasswordSettingFieldWithoutI18n);

type EmailSettingFieldProps = withI18nProps & {
  currentValue: string;
  onSubmit: (newEmail: string) => void;
};

const EmailSettingFieldWithoutI18n = (props: EmailSettingFieldProps) => {
  const { i18n, currentValue, onSubmit } = props;
  const userContext = useContext(UserContext);
  const { email: oldEmail, verified } = userContext.user as JustfixUser;
  const [existingUserError, setExistingUserError] = useState(false);
  const {
    value: email,
    error: emailError,
    showError: showEmailError,
    setError: setEmailError,
    setShowError: setShowEmailError,
    onChange: onChangeEmail,
  } = useInput(oldEmail);

  const handleSubmit = async () => {
    setExistingUserError(false);
    setShowEmailError(false);

    if (email === oldEmail) {
      return;
    }

    if (!email || emailError) {
      setEmailError(true);
      setShowEmailError(true);
      throw new Error("Email format error");
    }

    if (!!email && !emailError) {
      const existingUser = await AuthClient.isEmailAlreadyUsed(email);
      if (existingUser) {
        setExistingUserError(true);
        throw new Error("Existing user error");
      }
    }

    onSubmit(email);
  };

  const verifyCallout = !verified ? (
    <div className="jf-callout">
      <Trans>
        Email address not verified. Click the link we sent to {email} start receiving emails.
      </Trans>
      <br />
      <br />
      <button className="button is-text" onClick={() => AuthClient.resendVerifyEmail()}>
        <Trans>Resend email</Trans>
      </button>
    </div>
  ) : undefined;

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
          <AlertIconOutline />
          {i18n._(t`That email is already used.`)}
        </Alert>
      )}
      <Trans render="label" className="user-setting-label">
        Email address
      </Trans>
      <Trans render="p">We send data updates to this email.</Trans>
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
  const { title, preview, onSubmit, children, verifyCallout } = props;
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
              <button type="submit" className="button is-primary">
                <Trans>Save</Trans>
              </button>
              <button type="button" className="button is-text" onClick={() => setEditing(false)}>
                <Trans>Cancel</Trans>
              </button>
            </div>
          </>
        ) : (
          <>
            <Trans render="label" className="user-setting-label">
              {title}
            </Trans>
            <div>
              <span>{preview}</span>
              <button
                type="button"
                className="button is-text edit-button"
                onClick={() => setEditing(true)}
              >
                <Trans>Edit</Trans>
              </button>
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
