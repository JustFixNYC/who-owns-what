import React, { useState } from "react";

import { withI18n, withI18nProps } from "@lingui/react";
import { Trans } from "@lingui/macro";

import "styles/EmailAlertSignup.css";

type UserSettingFieldProps = withI18nProps & {
  label: string;
  currentValue: string;
  onSubmit: (value: string) => void;
};

const UserSettingFieldWithoutI18n = (props: UserSettingFieldProps) => {
  const { label, currentValue, onSubmit } = props;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
    <div className={`UserSetting`}>
      <form onSubmit={() => onSubmit(value)} className="input-group">
        <Trans render="label">{label}</Trans>
        {editing ? (
          <>
            <input
              type="email"
              className="input"
              placeholder={`Enter email`}
              onChange={handleValueChange}
              value={value}
            />
            <input type="submit" className="button is-primary" value={`Save`} />
            <button className="button is-secondary" onClick={() => setEditing(false)}>
              <Trans>Cancel</Trans>
            </button>
          </>
        ) : (
          <div>
            <span>{currentValue}</span>
            <button onClick={() => setEditing(true)}>
              <Trans>Edit</Trans>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

const UserSettingField = withI18n()(UserSettingFieldWithoutI18n);

export default UserSettingField;
