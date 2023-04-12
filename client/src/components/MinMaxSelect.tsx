import React, { InputHTMLAttributes } from "react";
import { Trans, t } from "@lingui/macro";
import { i18n } from "@lingui/core";
import classnames from "classnames";
import helpers from "util/helpers";
import { Alert } from "./Alert";
import { FilterNumberRange, NUMBER_RANGE_DEFAULT } from "./PropertiesList";

type MinMaxErrors = { min: boolean; max: boolean; msg: JSX.Element | undefined };
const MIN_MAX_ERRORS_DEFAULT = { min: false, max: false, msg: undefined };

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
  id?: string;
  onFocusInput?: () => void;
}) {
  const { options, onApply, id, onFocusInput } = props;
  const [minMax, setMinMax] = React.useState<FilterNumberRange>(NUMBER_RANGE_DEFAULT);
  const [minMaxErrors, setMinMaxErrors] = React.useState<MinMaxErrors>(MIN_MAX_ERRORS_DEFAULT);
  const [presets, setPresets] = React.useState<Preset[]>(PRESETS_DEFAULT);

  const handlePresetChange = (i: number) => {
    const updatedPresets = presets;
    updatedPresets[i].checked = !updatedPresets[i].checked;
    setPresets(updatedPresets);
  };

  const handleApply = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    let selections: FilterNumberRange[];
    if (isFinite(minMax.min) || isFinite(minMax.max)) {
      const errors = minMaxHasError(minMax, options);
      if (errors.min || errors.max) {
        setMinMaxErrors(errors);
        return;
      }
      selections = [minMax];
    } else {
      selections = presets
        .filter((preset) => preset.checked)
        .map((preset) => {
          const { checked, ...range } = preset;
          return range;
        });
    }
    onApply(selections || [NUMBER_RANGE_DEFAULT]);
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
      <fieldset className="minmaxselect__presets-container">
        {PRESETS_DEFAULT.map((rng, i) => (
          <div className="minmaxselect__preset-value" key={i}>
            <input
              type="checkbox"
              id={`minmaxselect__preset-${i}`}
              name={`minmaxselect__preset-${i}`}
              aria-describedby={`${id || "minmax-select"}__preset-a11y-text`}
              onChange={() => handlePresetChange(i)}
              disabled={isFinite(minMax.min) || isFinite(minMax.max)}
            />
            <label htmlFor={`minmaxselect__preset-${i}`}>
              {rng.min}
              {isFinite(rng.max) ? `-${rng.max}` : "+"}
            </label>
          </div>
        ))}
        <span
          id={`${id || "minmax-select"}__preset-a11y-text`}
          className="minmaxselect__a11y-text"
          hidden
        >
          <Trans>
            Select one or more ranges of building units, or set a custom range, then apply
            selections to filter the list of portfolio properties.
          </Trans>
        </span>
      </fieldset>
      <details>
        <summary className="minmaxselect__custom-range-summary">
          <Trans>Custom Range</Trans>
        </summary>
        <form id={`${id || "minmaxselect"}__form`} className="minmaxselect__custom-range-container">
          {minMaxErrors.min || minMaxErrors.max ? (
            <div className="minmaxselect__alerts-container">
              <Alert type="error" variant="primary" closeType="none" role="status">
                {minMaxErrors.msg}
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
                className={classnames("minmaxselect__min-input", { hasError: minMaxErrors.min })}
                value={isFinite(minMax.min) ? minMax.min : ""}
                onChange={(e) => {
                  setMinMaxErrors(MIN_MAX_ERRORS_DEFAULT);
                  setMinMax({
                    min: cleanNumberInput(e.target.value) || -Infinity,
                    max: minMax.max,
                  });
                }}
                {...commonInputProps}
              />
              <span>
                <Trans>and</Trans>
              </span>
              <input
                id={`${id || "minmax-select"}_max-input`}
                className={classnames("minmaxselect__max-input", { hasError: minMaxErrors.max })}
                value={isFinite(minMax.max) ? minMax.max : ""}
                onChange={(e) => {
                  setMinMaxErrors(MIN_MAX_ERRORS_DEFAULT);
                  setMinMax({ min: minMax.min, max: cleanNumberInput(e.target.value) || Infinity });
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
      <button
        type="submit"
        form={`${id || "minmaxselect"}__form`}
        className="button is-primary"
        aria-label={i18n._(t`Apply selections and get results`)}
        onClick={handleApply}
      >
        <Trans>Apply</Trans>
      </button>
    </div>
  );
}

function cleanNumberInput(value: string): number | undefined {
  if (!new RegExp("[0-9+]").test(value)) return undefined;
  return Number(value);
}

function minMaxHasError(values: FilterNumberRange, options: FilterNumberRange): MinMaxErrors {
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
