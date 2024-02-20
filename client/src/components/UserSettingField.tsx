import React, { useState } from "react";

import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans } from "@lingui/macro";

import "styles/EmailAlertSignup.css";
import PasswordInput from "./PasswordInput";
import { useInput } from "util/helpers";

type PasswordSettingFieldProps = withI18nProps & {
  onSubmit: (currentPassword: string, newPassword: string) => void;
};

const PasswordSettingFieldWithoutI18n = (props: PasswordSettingFieldProps) => {
  const { i18n, onSubmit } = props;
  const { value: currentPassword, onChange: onChangeCurrentPassword } = useInput("");
  const { value: newPassword, onChange: onChangeNewPassword } = useInput("");
  // const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const handleSubmit = () => {
    onSubmit(currentPassword, newPassword);
  };

  return (
    <UserSettingField title={i18n._(t`Password`)} preview="**********" onSubmit={handleSubmit}>
      <Trans render="label">Password</Trans>
      <PasswordInput
        labelText={i18n._(t`Enter your old password`)}
        password={currentPassword}
        onChange={onChangeCurrentPassword}
      />

      {/* <div className="password-input">
        <input
          type={showCurrentPassword ? "text" : "password"}
          className="input"
          onChange={handleCurrentPasswordChange}
          value={currentPassword}
        />
        <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
          Show
        </button>
      </div> */}
      <PasswordInput
        labelText={i18n._(t`Create a new password`)}
        showPasswordRules={true}
        password={newPassword}
        onChange={onChangeNewPassword}
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
      <Trans render="p">This is used for logging in and for receiving weekly data updates.</Trans>
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
              <button type="button" className="button is-text" onClick={() => setEditing(true)}>
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
