import React, { useState } from "react";

import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans } from "@lingui/macro";

import "styles/EmailAlertSignup.css";
import PasswordInput from "./PasswordInput";

type PasswordSettingFieldProps = withI18nProps & {
  onSubmit: (currentPassword: string, newPassword: string) => void;
};

const PasswordSettingFieldWithoutI18n = (props: PasswordSettingFieldProps) => {
  const { i18n, onSubmit } = props;
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const handleCurrentPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPassword(e.target.value);
  };

  const handleSubmit = () => {
    onSubmit(currentPassword, newPassword);
  };

  return (
    <UserSettingField title={i18n._(t`Password`)} preview="**********" onSubmit={handleSubmit}>
      <Trans render="label">Enter your old password</Trans>
      <div className="password-input">
        <input
          type={showCurrentPassword ? "text" : "password"}
          className="input"
          placeholder={`Enter your current password`}
          onChange={handleCurrentPasswordChange}
          value={currentPassword}
        />
        <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
          Show
        </button>
      </div>
      <Trans render="label">Create a new password</Trans>
      <PasswordInput onChange={setNewPassword} />
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
  const [value, setValue] = useState(currentValue);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSubmit = () => {
    onSubmit(value);
  };

  return (
    <UserSettingField
      title={i18n._(t`Email address`)}
      preview={currentValue}
      onSubmit={handleSubmit}
    >
      <Trans render="label">Email address</Trans>
      <input
        type="email"
        className="input"
        placeholder={i18n._(t`Enter new email address`)}
        onChange={handleValueChange}
        value={value}
      />
    </UserSettingField>
  );
};

export const EmailSettingField = withI18n()(EmailSettingFieldWithoutI18n);

type UserSettingFieldProps = withI18nProps & {
  title: string;
  preview: string;
  onSubmit: () => void;
  children: React.ReactNode;
};

const UserSettingFieldWithoutI18n = (props: UserSettingFieldProps) => {
  const { title, preview, onSubmit, children } = props;
  const [editing, setEditing] = useState(false);
  return (
    <div className={`UserSetting`}>
      <form onSubmit={onSubmit} className="input-group">
        {editing ? (
          <>
            {children}
            <div className="user-setting-actions">
              <input type="submit" className="button is-primary" value={`Save`} />
              <button
                type="button"
                className="button is-secondary"
                onClick={() => setEditing(false)}
              >
                <Trans>Cancel</Trans>
              </button>
            </div>
          </>
        ) : (
          <>
            <Trans render="label">{title}</Trans>
            <div>
              <span>{preview}</span>
              <button type="button" className="link-button" onClick={() => setEditing(true)}>
                <Trans>Edit</Trans>
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

const UserSettingField = withI18n()(UserSettingFieldWithoutI18n);

export default UserSettingField;
