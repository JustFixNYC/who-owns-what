import React, { useCallback, useState } from "react";
import Select, {
  components,
  Props,
  ContainerProps,
  GroupBase,
  MultiValueRemoveProps,
  OptionProps,
  InputProps,
} from "react-select";
import { I18n } from "@lingui/react";
import { t, Trans } from "@lingui/macro";
import { Alert } from "./Alert";
import { CloseIcon, CheckIcon } from "./Icons";
import classnames from "classnames";

// Example of separating out selected values
// https://github.com/JedWatson/react-select/discussions/4850

export type Option = {
  value: string;
  label: string;
  [key: string]: string;
};

interface CustomMultiselectProps {
  onApply: (selectedList: any) => void;
  defaultSelections?: Option[];
  isOpen: boolean;
  onError?: () => void;
  previewSelectedNum?: number;
  infoAlert?: JSX.Element;
}

interface CustomSelectProps {
  removeValue: (removed: any) => void;
  onApply: (selectedList: any) => void;
  setSelections: (x: any) => void;
  previewSelectedNum: number;
  showAllSelections: boolean;
  setShowAllSelections: (x: any) => void;
}

const ariaLiveGuidanceGeneral = `Type to refine list of options. Use Up and Down to choose options, 
  press Enter to select the currently focused option, press Escape to exit the menu. 
  Use Left and Right to toggle between selected values, 
  press Backspace to remove the currently focused value`;

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
  defaultSelections,
  isOpen,
  onApply,
  infoAlert,
  onChange,
  onInputChange,
  onError,
  previewSelectedNum,
  ...props
}: Props<Option, IsMulti, GroupType> & CustomMultiselectProps) {
  const [selections, setSelections] = useState<Option[]>([]);
  const [hasError, setHasError] = useState(false);
  const [showAllSelections, setShowAllSelections] = useState(false);
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (!isOpen) {
      setSelections(defaultSelections as Option[]);
    }
  }, [isOpen, defaultSelections]); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (!newValue) setHasError(false);
      if (!["input-blur", "menu-close", "set-value"].includes(actionMeta.action)) {
        setInputValue(newValue);
      }
    },
    [onInputChange]
  );

  // Passing custom prop to make accessible to child compnents via selectProps
  const removeValue = useCallback(
    // @ts-ignore (value isn't recognizing the available properties of Option type)
    (removed) => setSelections(selections.filter((v) => v.value !== removed.value)),
    [selections]
  );

  const handleApply = () => {
    // @ts-ignore (value isn't recognizing the available properties of Option type)
    const selectedValues: string[] = selections.map((v) => (v.value || v.label).toString());
    if (!selectedValues.length && !!inputValue) {
      onError && onError();
      setHasError(true);
    } else {
      onApply(selectedValues);
    }
  };

  return (
    <I18n>
      {({ i18n }) => (
        <div className={classnames("multiselect-container", { "has-error": hasError })}>
          {hasError && (
            <Alert type="error" variant="primary" closeType="none" role="status">
              <Trans>Make a selection from the list or clear search text</Trans>
            </Alert>
          )}
          <CustomSelect
            isMulti={true as IsMulti}
            classNamePrefix="multiselect"
            className="multiselect__select-container"
            options={options}
            value={selections}
            onChange={handleChange}
            inputValue={inputValue}
            onInputChange={handleInputChange}
            placeholder={i18n._(t`Search`) + `... (${options!.length})`}
            controlShouldRenderValue={false}
            hideSelectedOptions={false}
            openMenuOnFocus={true}
            closeMenuOnSelect={false}
            blurInputOnSelect={false}
            backspaceRemovesValue={false}
            tabSelectsValue={false}
            components={{
              DropdownIndicator: () => null,
              IndicatorSeparator: () => null,
              IndicatorsContainer: () => null,
              ClearIndicator: () => null,
              SelectContainer: SelectContainer,
              Option: CustomOption,
              Input: CustomInput,
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

          {infoAlert}

          <button
            className="button is-primary"
            aria-label={i18n._(t`Apply selections and get results`)}
            onClick={handleApply}
            // By default, when multiselect option list is open mouseDown outside
            // closes the list, so because the Apply button is below, if you try to
            // click apply while it's open it moves on you before you can mouseUp.
            onMouseDown={handleApply}
            onTouchStart={handleApply}
          >
            <Trans>Apply</Trans>
          </button>
        </div>
      )}
    </I18n>
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
          Remove: CustomMultiValueRemove,
        }}
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
        {/* @ts-ignore (value isn't recognizing the available properties of Option type) */}
        {opt.label}
      </components.MultiValue>
    );
  };

  const numSelections = getValue().length;

  return (
    <I18n>
      {({ i18n }) => (
        <div className={`${classNamePrefix}__selected-value-container`}>
          {getValue()
            .map(toMultiValue)
            .filter((_value, i) => showAllSelections || i < previewSelectedNum)}
          {!showAllSelections && numSelections > previewSelectedNum && (
            <button
              className={`${classNamePrefix}__show-more-button`}
              aria-label={i18n._(t`Show all ${numSelections} selections`)}
              onClick={() => setShowAllSelections((prev: boolean) => !prev)}
            >
              +{numSelections - previewSelectedNum}
            </button>
          )}
        </div>
      )}
    </I18n>
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
      {/* @ts-ignore (wants extra props defined like above, but since were an extra level nested it's unclear what they should be) */}
      <SelectedValuesContainer {...commonProps} />

      <I18n>
        {({ i18n }) => (
          <div className={`${classNamePrefix}__selected-value-control-container`}>
            {showAllSelections && getValue().length > previewSelectedNum && (
              <button
                className={`${classNamePrefix}__show-less-button button is-text`}
                onClick={() => setShowAllSelections((prev: boolean) => !prev)}
                aria-label={i18n._(t`Show only ${previewSelectedNum} selections`)}
              >
                <Trans>Show less</Trans>
              </button>
            )}
            {getValue().length > 0 && (
              <button
                className={`${classNamePrefix}__clear-value-button button is-text`}
                aria-label={i18n._(t`Clear all selections`)}
                onClick={() => {
                  setSelections([]);
                  onApply([]);
                }}
              >
                <Trans>Clear selections</Trans>
              </button>
            )}
          </div>
        )}
      </I18n>
      {children}
    </components.SelectContainer>
  );
}

function CustomMultiValueRemove<
  Option,
  IsMulti extends boolean = true,
  GroupType extends GroupBase<Option> = GroupBase<Option>
>(props: MultiValueRemoveProps<Option, IsMulti, GroupType>) {
  return (
    <components.MultiValueRemove {...props}>
      <CloseIcon />
    </components.MultiValueRemove>
  );
}

function CustomInput<
  Option,
  IsMulti extends boolean = true,
  GroupType extends GroupBase<Option> = GroupBase<Option>
>(props: InputProps<Option, IsMulti, GroupType>) {
  const id = `aria-label-${Math.floor(Math.random() * 100)}`;
  return (
    <>
      <components.Input
        {...props}
        aria-autocomplete="none"
        autoComplete="off"
        aria-describedby={id}
      />
      <span hidden id={id}>
        {ariaLiveGuidanceGeneral}
      </span>
    </>
  );
}

function CustomOption<
  Option,
  IsMulti extends boolean = true,
  GroupType extends GroupBase<Option> = GroupBase<Option>
>(props: OptionProps<Option, IsMulti, GroupType>) {
  const { classNamePrefix } = props.selectProps;
  const { data, isSelected } = props;
  return (
    <components.Option {...props}>
      <div className={`${classNamePrefix}__option-checkbox`} role="presentation" tabIndex={-1}>
        {isSelected && <CheckIcon />}
      </div>
      <div className={`${classNamePrefix}__option-label`} tabIndex={-1}>
        {/* @ts-ignore (value isn't recognizing the available properties of Option type) */}
        {data.label}
      </div>
    </components.Option>
  );
}

export default MultiSelect;
