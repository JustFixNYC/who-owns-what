import React, { InputHTMLAttributes } from "react";
import { Trans, t } from "@lingui/macro";
import { I18n } from "@lingui/react";
import classnames from "classnames";
import helpers from "util/helpers";
import { Alert } from "./Alert";
import { FilterNumberRange, NUMBER_RANGE_DEFAULT } from "./PropertiesList";

type CustomRangeErrors = { min: boolean; max: boolean; msg: JSX.Element | undefined };
const CUSTOM_RANGE_ERRORS_DEFAULT = { min: false, max: false, msg: undefined };

type Preset = FilterNumberRange & { checked: boolean };
const PRESETS_DEFAULT = [
  { min: 1, max: 5, checked: false },
  { min: 6, max: 29, checked: false },
  { min: 30, max: 59, checked: false },
  { min: 60, max: 99, checked: false },
  { min: 100, max: 199, checked: false },
  { min: 200, max: Infinity, checked: false },
];

function MinMaxSelect(props: {
  options: FilterNumberRange;
  onApply: (selections: FilterNumberRange[]) => void;
  onError?: () => void;
  id?: string;
  onFocusInput?: () => void;
}) {
  const { options, onApply, onError, id, onFocusInput } = props;
  const [customRange, setCustomRange] = React.useState<FilterNumberRange>(NUMBER_RANGE_DEFAULT);
  const [customRangeErrors, setCustomRangeErrors] = React.useState<CustomRangeErrors>(
    CUSTOM_RANGE_ERRORS_DEFAULT
  );
  const [presets, setPresets] = React.useState<Preset[]>(PRESETS_DEFAULT);

  const hasCustomInputs = isFinite(customRange.min) || isFinite(customRange.max);

  const handlePresetChange = (preset: Preset, i: number) => {
    setPresets((prev) => {
      prev.splice(i, 1, { ...preset, checked: !preset.checked });
      return [...prev];
    });
  };

  const handleApply = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    if (isFinite(customRange.min) || isFinite(customRange.max)) {
      const errors = minMaxHasError(customRange, options);
      if (errors.min || errors.max) {
        onError && onError();
        setCustomRangeErrors(errors);
        return;
      }
      onApply([customRange]);
    } else {
      const presetSelections = presets
        .filter((preset) => preset.checked)
        .map((preset) => {
          const { checked, ...range } = preset;
          return range;
        });
      const selections = presetSelections.length ? presetSelections : [NUMBER_RANGE_DEFAULT];
      onApply(selections);
    }
  };

  const commonInputProps: InputHTMLAttributes<HTMLInputElement> = {
    type: "text",
    inputMode: "numeric",
    pattern: "[0-9]*",
    "aria-autocomplete": "none",
    autoComplete: "off",
    "aria-describedby": `${id || "minmax-select"}__custom-a11y-text`,
    min: options.min,
    max: options.min,
    onKeyDown: helpers.preventNonNumericalInput,
    onFocus: onFocusInput,
  };

  return (
    <div id={id} className="minmaxselect-container">
      <fieldset
        className="minmaxselect__presets-container"
        aria-labelledby={`${id || "minmax-select"}__preset-a11y-text`}
        tabIndex={hasCustomInputs ? 0 : -1}
      >
        {presets.map((preset, i) => (
          <div className="minmaxselect__preset-value" key={i}>
            <input
              type="checkbox"
              id={`minmaxselect__preset-${i}`}
              name={`minmaxselect__preset-${i}`}
              className={classnames({ checked: preset.checked })}
              aria-describedby={`${id || "minmax-select"}__preset-a11y-text`}
              onChange={() => handlePresetChange(preset, i)}
              disabled={hasCustomInputs}
              aria-hidden={hasCustomInputs}
              checked={preset.checked}
            />
            <label htmlFor={`minmaxselect__preset-${i}`}>
              {preset.min}
              {isFinite(preset.max) ? `-${preset.max}` : "+"}
            </label>
          </div>
        ))}
        <span
          id={`${id || "minmax-select"}__preset-a11y-text`}
          className="minmaxselect__a11y-text"
          hidden
        >
          {hasCustomInputs ? (
            <Trans>Clear custom range inputs to use preset ranges.</Trans>
          ) : (
            <Trans>
              Select one or more ranges of building units, or set a custom range, then apply
              selections to filter the list of portfolio properties.
            </Trans>
          )}
        </span>
      </fieldset>
      <details>
        <summary className="minmaxselect__custom-range-summary">
          <span>
            <Trans>Custom Range</Trans>
          </span>
        </summary>
        <form id={`${id || "minmaxselect"}__form`} className="minmaxselect__custom-range-container">
          {customRangeErrors.min || customRangeErrors.max ? (
            <div className="minmaxselect__alerts-container">
              <Alert type="error" variant="primary" closeType="none" role="alert">
                {customRangeErrors.msg}
              </Alert>
            </div>
          ) : (
            <></>
          )}
          <div className="minmaxselect__label-input-container">
            <div className="minmaxselect__labels-container">
              <label htmlFor={`${id || "minmax-select"}_min-input`}>
                <Trans>MIN</Trans>
              </label>
              <label htmlFor={`${id || "minmax-select"}_max-input`}>
                <Trans>MAX</Trans>
              </label>
            </div>
            <div className="minmaxselect__inputs-container">
              <input
                id={`${id || "minmax-select"}_min-input`}
                className={classnames("minmaxselect__min-input", {
                  hasError: customRangeErrors.min,
                })}
                value={isFinite(customRange.min) ? customRange.min : ""}
                onChange={(e) => {
                  setCustomRangeErrors(CUSTOM_RANGE_ERRORS_DEFAULT);
                  setCustomRange({
                    min: cleanNumberInput(e.target.value) || -Infinity,
                    max: customRange.max,
                  });
                }}
                {...commonInputProps}
              />
              <span>
                <Trans>and</Trans>
              </span>
              <input
                id={`${id || "minmax-select"}_max-input`}
                className={classnames("minmaxselect__max-input", {
                  hasError: customRangeErrors.max,
                })}
                value={isFinite(customRange.max) ? customRange.max : ""}
                onChange={(e) => {
                  setCustomRangeErrors(CUSTOM_RANGE_ERRORS_DEFAULT);
                  setCustomRange({
                    min: customRange.min,
                    max: cleanNumberInput(e.target.value) || Infinity,
                  });
                }}
                {...commonInputProps}
              />
              <span
                id={`${id || "minmax-select"}__custom-a11y-text`}
                className="minmaxselect__a11y-text"
                hidden
              >
                <Trans>
                  Enter minimum and maximum number of units, or leave either blank, then apply
                  selections to filter the list of portfolio properties. Set both to blank and apply
                  to clear filter.
                </Trans>
              </span>
            </div>
          </div>
        </form>
      </details>
      <I18n>
        {({ i18n }) => (
          <button
            type="submit"
            form={`${id || "minmaxselect"}__form`}
            className="button is-primary"
            aria-label={i18n._(t`Apply selections and get results`)}
            onClick={handleApply}
          >
            <Trans>Apply</Trans>
          </button>
        )}
      </I18n>
    </div>
  );
}

function cleanNumberInput(value: string): number | undefined {
  if (!new RegExp("[0-9+]").test(value)) return undefined;
  return Number(value);
}

function minMaxHasError(values: FilterNumberRange, options: FilterNumberRange): CustomRangeErrors {
  const { min: minValue, max: maxValue } = values;
  const { min: minOption, max: maxOption } = options;
  let minHasError = false;
  let maxHasError = false;
  let errorMessage: JSX.Element | undefined;

  if (isFinite(minValue) && isFinite(maxValue) && minValue > maxValue) {
    minHasError = true;
    maxHasError = true;
    errorMessage = <Trans>Min must be less than or equal to Max</Trans>;
  }
  if (isFinite(minValue) && minValue < 0) {
    minHasError = true;
    errorMessage = <Trans>Min must be greater than 0</Trans>;
  }
  if (isFinite(maxValue) && maxValue < 0) {
    minHasError = true;
    errorMessage = <Trans>Max must be greater than 0</Trans>;
  }
  if (isFinite(maxValue) && isFinite(minOption) && maxValue < minOption) {
    maxHasError = true;
    errorMessage = <Trans>Max must be greater than {minOption}</Trans>;
  }
  if (isFinite(minValue) && isFinite(maxOption) && minValue > maxOption) {
    minHasError = true;
    errorMessage = <Trans>Min must be less than {maxOption}</Trans>;
  }

  return { min: minHasError, max: maxHasError, msg: errorMessage };
}

export default MinMaxSelect;
