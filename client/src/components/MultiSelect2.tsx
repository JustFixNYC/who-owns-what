import React, { useCallback, useState } from "react";
import Select, { components, Props, ContainerProps, GroupBase } from "react-select";
import { I18n } from "@lingui/core";
import { t, Trans } from "@lingui/macro";
import { Alert } from "./Alert";
import "../styles/MultiSelect2.scss";
import classNames from "classnames";

// Example of separating out selected values (sadly with many typescript errors, which I've tried to address)
// https://github.com/JedWatson/react-select/discussions/4850

export type Option = {
  value: string;
  label: string;
  [key: string]: string;
};

interface CustomMultiselectProps {
  onApply: (selectedList: any) => void;
  i18n: I18n;
  previewSelectedNum?: number;
  infoAlert?: React.ReactNode;
}

interface CustomSelectProps {
  removeValue: (removed: any) => void;
}

function MultiSelect<
  Option,
  IsMulti extends boolean = true,
  GroupType extends GroupBase<Option> = GroupBase<Option>
>({
  options,
  onApply,
  infoAlert,
  onChange,
  onInputChange,
  i18n,
  ...props
}: Props<Option, IsMulti, GroupType> & CustomMultiselectProps) {
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

  // Passing custom prop to make accessible to child compnents via selectProps
  const removeValue = useCallback(
    // @ts-ignore (TODO: says property 'value' doesn't exist on type Option)
    (removed) => setValue(selections.filter((v) => v.value !== removed.value)),
    [selections]
  );

  const styles = {
    valueContainer: (css: any) => ({ ...css, display: "grid" }),
    multiValueRemove: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#ff0000" : "inherit",
    }),
  };

  return (
    <div className="multiselect-container2">
      <Select
        isMulti={true as IsMulti}
        classNamePrefix="multiselect"
        options={options}
        value={selections}
        onChange={handleChange}
        inputValue={inputValue}
        removeValue={removeValue}
        onInputChange={handleInputChange}
        placeholder={i18n._(t`Search`) + `... (${options!.length})`}
        controlShouldRenderValue={false}
        hideSelectedOptions={false}
        closeMenuOnSelect={false}
        escapeClearsValue={true}
        backspaceRemovesValue={false}
        tabSelectsValue={false}
        components={{
          DropdownIndicator: () => null,
          IndicatorSeparator: () => null,
          IndicatorContainer: () => null,
          ClearIndicator: () => null,
          // @ts-ignore
          SelectContainer,
        }}
        style={styles}
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
          // @ts-ignore (TODO: says properties 'value' & 'label' don't exist on type Option)
          const selectedValues = selections.map((v) => ({ name: v.value || "", id: v.label }));
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
}

function SelectedValuesContainer<
  Option,
  IsMulti extends boolean = true,
  GroupType extends GroupBase<Option> = GroupBase<Option>
>({ isDisabled, getValue, ...props }: ContainerProps<Option, IsMulti, GroupType>) {
  const { getOptionValue, removeValue, classNamePrefix } = props.selectProps as Props<
    Option,
    IsMulti,
    GroupType
  > &
    CustomSelectProps;

  const getKey = (opt: Option, index: number) =>
    `${getOptionValue ? getOptionValue(opt) : "option"}-${index}`;

  const toMultiValue = (opt: Option, index: number) => {
    return (
      <components.MultiValue
        getValue={getValue}
        {...props}
        components={{
          Container: components.MultiValueContainer,
          Label: components.MultiValueLabel,
          Remove: components.MultiValueRemove,
        }}
        // TODO: Can't know when it's "focused" via arrow key navigation, it's not using ::focus,
        // and the classes don't change. The screen-reader works though, and can close with curosr.
        // https://github.com/JedWatson/react-select/issues/4017
        // isFocused={?}
        isDisabled={isDisabled}
        key={getKey(opt, index)}
        index={index}
        removeProps={{
          onClick: () => removeValue(opt),
          onTouchEnd: () => removeValue(opt),
          onMouseDown: (e) => {
            e.preventDefault();
            e.stopPropagation();
          },
        }}
        data={opt}
      >
        {/* @ts-ignore (TODO: says properties 'value' & 'label' don't exist on type Option) */}
        {opt.label}
      </components.MultiValue>
    );
  };

  return (
    <div
      className={`${classNamePrefix}__selected-value-container`}
      style={{ margin: ".5rem 0", display: "flex", flexFlow: "row wrap" }}
    >
      {getValue().map(toMultiValue)}
    </div>
  );
}

const SelectContainer = ({
  children,
  className,
  innerProps,
  isFocused,
  ...commonProps
}: ContainerProps) => {
  const selectContainerProps = {
    ...commonProps,
  };

  return (
    <components.SelectContainer
      className={className}
      innerProps={innerProps}
      isFocused={isFocused}
      {...selectContainerProps}
    >
      {/* @ts-ignore (TODO: wants extra props defined like above, but I'm not sure what to use, and in the sample it works correctly) */}
      <SelectedValuesContainer {...commonProps} />
      <div tabIndex={0}>clear</div>
      {children}
    </components.SelectContainer>
  );
};

export default MultiSelect;
