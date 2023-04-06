import React, { useCallback, useState, Children } from "react";
import Select, { components, Props, ValueContainerProps } from "react-select";
import { I18n } from "@lingui/core";
import { t, Trans } from "@lingui/macro";
import { Alert } from "./Alert";
import "../styles/MultiSelect2.scss";

export type Option = {
  value: string;
  label: string;
  [key: string]: string;
};

type MultiSelectProps = Omit<Props, "options"> & {
  options: Option[];
  onApply: (selectedList: any) => void;
  i18n: I18n;
  previewSelectedNum?: number;
  infoAlert?: React.ReactNode;
};


const ValueContainer= ({ children, ...props }: ValueContainerProps) => {
  const removedTypes = ["IndicatorsContainer", "Input"];
  const allowedChildren = Children.map(children, (child) => {
    // @ts-ignore
    return child && !removedTypes.includes(child.type.name) ? child : null;
  });
  return (
    <components.ValueContainer {...props}>
        {/* @ts-ignore */}
        {/* <components.MultiValueContainer {...props} /> */}
        {/* @ts-ignore */}
        <components.IndicatorsContainer {...props} />
        {/* @ts-ignore */}
        <components.Input {...props} />
        {allowedChildren}
    </components.ValueContainer>
  );
};

const MultiSelect: React.FC<MultiSelectProps> = ({
  children,
  options,
  onApply,
  infoAlert,
  onChange,
  onInputChange,
  i18n,
  ...props
}) => {
  const [selections, setValue] = useState<Option[]>([]);
  const [hasError, setHasError] = useState(false);
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);

  const handleChange = useCallback(
    (newValue, actionMeta) => {
      if (onChange) onChange(newValue, actionMeta);
      setValue(newValue);
    },
    [onChange]
  );
  const handleInputChange = useCallback(
    (newValue, actionMeta) => {
      if (onInputChange) onInputChange(newValue, actionMeta);
      if (actionMeta.action !== "input-blur" && actionMeta.action !== "menu-close") {
        setInputValue(newValue);
      }
    },
    [onInputChange]
  );

  return (
    <div className="multiselect-container2">
      <Select
        isMulti
        classNamePrefix="multiselect"
        options={options}
        value={selections}
        onChange={handleChange}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        placeholder={i18n._(t`Search`) + `... (${options.length})`}
        hideSelectedOptions={false}
        closeMenuOnSelect={false}
        backspaceRemovesValue={false}
        tabSelectsValue={false}
        components={{
          DropdownIndicator: () => null,
          IndicatorSeparator: () => null,
          // IndicatorsContainer: () => null,
          // Input: () => null,
          ValueContainer
        }}
        {...props}
      />
      {hasError && (
        <Alert type="error" variant="primary" closeType="none" role="status">
          <Trans>Make a selection from the list or clear search text</Trans>
        </Alert>
      )}  
      {infoAlert && infoAlert}
      <button
        className="button is-primary"
        onClick={() => {
          const selectedValues = selections.map((v) => ({ name: v.value, id: v.label }));
          if (!selectedValues.length && !!inputValue) {
            setHasError(true);
            return;
          }
          onApply(selectedValues);
        }}
      >
        <Trans>Apply</Trans>
      </button>
    </div>
  );
};

export default MultiSelect;
