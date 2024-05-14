import { ChangeEvent, useState } from "react";
import { Trans, t } from "@lingui/macro";
import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";

import { Icon, RadioButton, TextInput } from "@justfixnyc/component-library";

type UserTypeInputProps = {
  i18n: I18n;
  error: boolean;
  showError: boolean;
  setError: React.Dispatch<React.SetStateAction<boolean>>;
  setUserType: React.Dispatch<React.SetStateAction<string>>;
  required?: boolean;
};

const UserTypeInputWithoutI18n = (props: UserTypeInputProps) => {
  const { i18n, error, showError, setError, setUserType, required } = props;

  const [activeRadio, setActiveRadio] = useState("");
  const [userTypeText, setUserTypeText] = useState("");

  const USER_TYPES = {
    tenant: i18n._(t`Tenant`),
    organizer: i18n._(t`Tenant Organizer`),
    advocate: i18n._(t`Tenant Advocate`),
    legal: i18n._(t` Legal Worker/Lawyer`),
    government: i18n._(t`Government Worker (non-lawyer)`),
    other: i18n._(t`Other`),
  };

  const handleRadioChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === USER_TYPES.other.toLocaleUpperCase("en")) {
      setUserType(!!userTypeText ? userTypeText : value);
    } else {
      setUserType(value);
    }
    setActiveRadio(value);
    setError(false);
  };

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserType(!!value ? value : activeRadio);
    setUserTypeText(value);
  };

  return (
    <div className="user-type-container">
      {showError && error && (
        <span id="input-field-error" className="mb-4">
          <Icon icon="circleExclamation" className="alert-icon mr-3" />
          <Trans>Please select an option.</Trans>
        </span>
      )}
      <div className="user-type-radio-group">
        <RadioButton
          id="user-type-input-tenant"
          labelText={USER_TYPES.tenant}
          required={required}
          aria-required={required}
          value={USER_TYPES.tenant.toLocaleUpperCase("en")}
          checked={activeRadio === USER_TYPES.tenant.toLocaleUpperCase("en")}
          onChange={handleRadioChange}
          name="user-type"
        />
        <RadioButton
          id="user-type-input-organizer"
          labelText={USER_TYPES.organizer}
          required={required}
          aria-required={required}
          value={USER_TYPES.organizer.toLocaleUpperCase("en")}
          checked={activeRadio === USER_TYPES.organizer.toLocaleUpperCase("en")}
          onChange={handleRadioChange}
          name="user-type"
        />
        <RadioButton
          id="user-type-input-advocate"
          labelText={USER_TYPES.advocate}
          required={required}
          aria-required={required}
          value={USER_TYPES.advocate.toLocaleUpperCase("en")}
          checked={activeRadio === USER_TYPES.advocate.toLocaleUpperCase("en")}
          onChange={handleRadioChange}
          name="user-type"
        />
        <RadioButton
          id="user-type-input-legal"
          labelText={USER_TYPES.legal}
          required={required}
          aria-required={required}
          value={USER_TYPES.legal.toLocaleUpperCase("en")}
          checked={activeRadio === USER_TYPES.legal.toLocaleUpperCase("en")}
          onChange={handleRadioChange}
          name="user-type"
        />
        <RadioButton
          id="user-type-input-government"
          labelText={USER_TYPES.government}
          required={required}
          aria-required={required}
          value={USER_TYPES.government.toLocaleUpperCase("en")}
          checked={activeRadio === USER_TYPES.government.toLocaleUpperCase("en")}
          onChange={handleRadioChange}
          name="user-type"
        />
        <RadioButton
          id="user-type-input-other"
          labelText={USER_TYPES.other}
          required={required}
          aria-required={required}
          value={USER_TYPES.other.toLocaleUpperCase("en")}
          checked={activeRadio === USER_TYPES.other.toLocaleUpperCase("en")}
          onChange={handleRadioChange}
          name="user-type"
        />
      </div>
      {activeRadio === USER_TYPES.other.toLocaleUpperCase("en") && (
        <TextInput
          autoFocus
          labelText={USER_TYPES.other} // required field but hidden by css
          id="user-type-input-other-text"
          name="user-type"
          value={userTypeText}
          onChange={handleTextChange}
        />
      )}
    </div>
  );
};

const UserTypeInput = withI18n()(UserTypeInputWithoutI18n);

export default UserTypeInput;
