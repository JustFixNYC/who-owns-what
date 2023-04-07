import React, { useCallback, useState } from "react";
import Select, { components, Props, ContainerProps, GroupBase } from "react-select";
import { I18n } from "@lingui/core";
import { t, Trans } from "@lingui/macro";
import { Alert } from "./Alert";
import "../styles/MultiSelect2.scss";

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
  onApply: (selectedList: any) => void;
  setSelections: (x: any) => void;
  previewSelectedNum: number;
  showAllSelections: boolean;
  setShowAllSelections: (x: any) => void;
}

function CustomSelect<
  Option,
  IsMulti extends boolean = true,
  GroupType extends GroupBase<Option> = GroupBase<Option>
>(props: Props<Option, IsMulti, GroupType> & CustomSelectProps) {
  return <Select {...props} />;
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
  previewSelectedNum,
  i18n,
  ...props
}: Props<Option, IsMulti, GroupType> & CustomMultiselectProps) {
  const [selections, setSelections] = useState<Option[]>([]);
  const [hasError, setHasError] = useState(false);
  const [showAllSelections, setShowAllSelections] = useState(false);
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);

  const handleChange = useCallback(
    (newValue, actionMeta) => {
      if (onChange) onChange(newValue, actionMeta);
      setSelections(newValue);
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
    (removed) => setSelections(selections.filter((v) => v.value !== removed.value)),
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
      <CustomSelect
        isMulti={true as IsMulti}
        classNamePrefix="multiselect"
        options={options}
        value={selections}
        onChange={handleChange}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        placeholder={i18n._(t`Search`) + `... (${options!.length})`}
        controlShouldRenderValue={false}
        hideSelectedOptions={false}
        closeMenuOnSelect={false}
        escapeClearsValue={true}
        backspaceRemovesValue={false}
        tabSelectsValue={false}
        styles={styles}
        components={{
          DropdownIndicator: () => null,
          IndicatorSeparator: () => null,
          IndicatorsContainer: () => null,
          ClearIndicator: () => null,
          // @ts-ignore
          SelectContainer,
        }}
        // Custom props passed through SelectProps to composable components
        removeValue={removeValue}
        onApply={onApply}
        setSelections={setSelections}
        showAllSelections={showAllSelections}
        setShowAllSelections={setShowAllSelections}
        previewSelectedNum={previewSelectedNum || 5}
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
  const {
    getOptionValue,
    removeValue,
    classNamePrefix,
    showAllSelections,
    setShowAllSelections,
    previewSelectedNum,
  } = props.selectProps as Props<Option, IsMulti, GroupType> & CustomSelectProps;

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
    <div className={`${classNamePrefix}__selected-value-container`}>
      {getValue()
        .map(toMultiValue)
        .filter((_value, i) => showAllSelections || i < previewSelectedNum)}
      {!showAllSelections && getValue().length > previewSelectedNum && (
        <button
          className={`${classNamePrefix}__show-more-button`}
          onClick={() => setShowAllSelections((prev: boolean) => !prev)}
        >
          +{getValue().length - previewSelectedNum}
        </button>
      )}
    </div>
  );
}

function SelectContainer<
  Option,
  IsMulti extends boolean = true,
  GroupType extends GroupBase<Option> = GroupBase<Option>
>({
  children,
  className,
  innerProps,
  isFocused,
  ...commonProps
}: ContainerProps<Option, IsMulti, GroupType>) {
  const selectContainerProps = { ...commonProps };
  const { getValue } = commonProps;
  const {
    classNamePrefix,
    onApply,
    setSelections,
    previewSelectedNum,
    showAllSelections,
    setShowAllSelections,
  } = commonProps.selectProps as Props<Option, IsMulti, GroupType> & CustomSelectProps;

  return (
    <components.SelectContainer
      className={className}
      innerProps={innerProps}
      isFocused={isFocused}
      {...selectContainerProps}
    >
      {/* @ts-ignore (TODO: wants extra props defined like above, but I'm not sure what to use, and in the sample it works correctly) */}
      <SelectedValuesContainer {...commonProps} />
      <div className={`${classNamePrefix}__selected-value-control-container`} tabIndex={0}>
        {showAllSelections && getValue().length > previewSelectedNum && (
          <button
            className={`${classNamePrefix}__show-less-button button is-text`}
            onClick={() => setShowAllSelections((prev: boolean) => !prev)}
          >
            <Trans>Show less</Trans>
          </button>
        )}
        {getValue().length > 0 && (
          <button
            className={`${classNamePrefix}__clear-value-button button is-text`}
            onClick={() => {
              setSelections([]);
              onApply([]);
            }}
          >
            <Trans>Clear</Trans>
          </button>
        )}
      </div>
      {children}
    </components.SelectContainer>
  );
}

export default MultiSelect;
