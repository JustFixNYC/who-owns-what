import React, { useCallback, useState } from "react";
import Select, {
  components,
  Props,
  ValueContainerProps,
  MultiValueProps,
  GroupBase,
  MultiValueRemoveProps,
  OptionProps,
  InputProps,
} from "react-select";
import { I18n } from "@lingui/react";
import { t, Trans } from "@lingui/macro";
import { Alert } from "./Alert";
import classnames from "classnames";
import { Button, Icon } from "@justfixnyc/component-library";

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
              ValueContainer: CustomValueContainer,
              MultiValueRemove: CustomMultiValueRemove,
              Option: CustomOption,
              Input: CustomInput,
            }}
            classNames={{
              multiValue: ({ isFocused }) =>
                classnames({ "multiselect__multi-value--is-focused": isFocused }),
            }}
            // Custom props passed through SelectProps to composable components
            onApply={onApply}
            setSelections={setSelections}
            showAllSelections={showAllSelections}
            setShowAllSelections={setShowAllSelections}
            previewSelectedNum={previewSelectedNum || 5}
            {...props}
          />

          {infoAlert}

          <Button
            onClick={handleApply}
            // By default, when multiselect option list is open mouseDown outside
            // closes the list, so because the Apply button is below, if you try to
            // click apply while it's open it moves on you before you can mouseUp.
            onMouseDown={handleApply}
            onTouchStart={handleApply}
            labelText={i18n._("Apply")}
            size="small"
          />
        </div>
      )}
    </I18n>
  );
}

function CustomValueContainer<
  Option,
  IsMulti extends boolean = true,
  GroupType extends GroupBase<Option> = GroupBase<Option>
>({ children, ...props }: ValueContainerProps<Option, IsMulti, GroupType>) {
  const {
    classNamePrefix,
    onApply,
    setSelections,
    previewSelectedNum,
    showAllSelections,
    setShowAllSelections,
  } = props.selectProps as Props<Option, IsMulti, GroupType> & CustomSelectProps;

  // Keep the native values so focus, removal, and accessibility stay in sync.
  // react-select renders its values (or placeholder) followed by the input.
  const values = React.Children.toArray(children);
  const input = values.pop();
  const hasFocusedValue = values.some(
    (value) =>
      React.isValidElement<MultiValueProps<Option, IsMulti, GroupType>>(value) &&
      value.props.isFocused
  );
  const showValues = showAllSelections || hasFocusedValue;
  const numSelections = props.getValue().length;

  return (
    <>
      <I18n>
        {({ i18n }) => (
          <>
            <div
              className={`${classNamePrefix}__selected-value-container`}
              onMouseDown={(event) => event.stopPropagation()}
              onTouchEnd={(event) => event.stopPropagation()}
            >
              {props.hasValue &&
                values.filter((_value, index) => showValues || index < previewSelectedNum)}
              {!showValues && numSelections > previewSelectedNum && (
                <button
                  className={`${classNamePrefix}__show-more-button`}
                  aria-label={i18n._(t`Show all ${numSelections} selections`)}
                  onClick={() => setShowAllSelections(true)}
                >
                  +{numSelections - previewSelectedNum}
                </button>
              )}
            </div>
            <div
              className={`${classNamePrefix}__selected-value-control-container`}
              onMouseDown={(event) => event.stopPropagation()}
              onTouchEnd={(event) => event.stopPropagation()}
            >
              {showAllSelections && numSelections > previewSelectedNum && (
                <button
                  className={`${classNamePrefix}__show-less-button button is-text`}
                  onClick={() => setShowAllSelections(false)}
                  aria-label={i18n._(t`Show only ${previewSelectedNum} selections`)}
                >
                  <Trans>Show less</Trans>
                </button>
              )}
              {numSelections > 0 && (
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
          </>
        )}
      </I18n>
      <components.ValueContainer {...props}>
        {!props.hasValue && values}
        {input}
      </components.ValueContainer>
    </>
  );
}

function CustomMultiValueRemove<
  Option,
  IsMulti extends boolean = true,
  GroupType extends GroupBase<Option> = GroupBase<Option>
>(props: MultiValueRemoveProps<Option, IsMulti, GroupType>) {
  return (
    <components.MultiValueRemove {...props}>
      <Icon icon="xmark" />
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
        placeholder={
          props.hasValue && typeof props.selectProps.placeholder === "string"
            ? props.selectProps.placeholder
            : undefined
        }
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
        {isSelected && <Icon icon="check" />}
      </div>
      <div className={`${classNamePrefix}__option-label`} tabIndex={-1}>
        {/* @ts-ignore (value isn't recognizing the available properties of Option type) */}
        {data.label}
      </div>
    </components.Option>
  );
}

export default MultiSelect;
