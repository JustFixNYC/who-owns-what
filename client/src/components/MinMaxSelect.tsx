import React from "react";
import { Trans, t } from "@lingui/macro";
import { i18n } from "@lingui/core";
import classnames from "classnames";
import helpers from "util/helpers";
import { Alert } from "./Alert";
import { FilterNumberRange, NUMBER_RANGE_DEFAULT } from "./PropertiesList";

type MinMaxErrors = { min: boolean; max: boolean; msg: JSX.Element | undefined };
const MIN_MAX_ERRORS_DEFAULT = { min: false, max: false, msg: undefined };

function MinMaxSelect(props: {
  options: FilterNumberRange;
  onApply: (selections: FilterNumberRange[]) => void;
  id?: string;
  onFocusInput?: () => void;
}) {
  const { options, onApply, id, onFocusInput } = props;
  const [minMax, setMinMax] = React.useState<FilterNumberRange[]>([NUMBER_RANGE_DEFAULT]);
  const [minMaxErrors, setMinMaxErrors] = React.useState<MinMaxErrors>(MIN_MAX_ERRORS_DEFAULT);

  return (
    <form id={id} className="minmax-container">
      {minMaxErrors.min || minMaxErrors.max ? (
        <div className="alerts-container">
          <Alert type="error" variant="primary" closeType="none" role="status">
            {minMaxErrors.msg}
          </Alert>
        </div>
      ) : (
        <></>
      )}
      <div className="label-input-container">
        <div className="labels-container">
          <label htmlFor={`${id || "minmax-select"}_min-input`}>
            <Trans>MIN</Trans>
          </label>
          <label htmlFor={`${id || "minmax-select"}_max-input`}>
            <Trans>MAX</Trans>
          </label>
        </div>
        <div className="inputs-container">
          <input
            id={`${id || "minmax-select"}_min-input`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            aria-describedby={`${id || "minmax-select"}__a11y-text`}
            min={options.min}
            max={options.min}
            value={isFinite(minMax[0].min) ? minMax[0].min : ""}
            onKeyDown={helpers.preventNonNumericalInput}
            onChange={(e) => {
              setMinMaxErrors(MIN_MAX_ERRORS_DEFAULT);
              setMinMax([
                { min: cleanNumberInput(e.target.value) || -Infinity, max: minMax[0].max },
              ]);
            }}
            onFocus={onFocusInput}
            className={classnames("min-input", { hasError: minMaxErrors.min })}
          />
          <span>
            <Trans>and</Trans>
          </span>
          <input
            id={`${id || "minmax-select"}_max-input`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            aria-describedby={`${id || "minmax-select"}__a11y-text`}
            min={options.max}
            max={options.max}
            value={isFinite(minMax[0].max) ? minMax[0].max : ""}
            onKeyDown={helpers.preventNonNumericalInput}
            onChange={(e) => {
              setMinMaxErrors(MIN_MAX_ERRORS_DEFAULT);
              setMinMax([
                { min: minMax[0].min, max: cleanNumberInput(e.target.value) || Infinity },
              ]);
            }}
            onFocus={onFocusInput}
            className={classnames("max-input", { hasError: minMaxErrors.max })}
          />
          <span
            id={`${id || "minmax-select"}__a11y-text`}
            className="minmaxselect__a11y-text"
            hidden
          >
            <Trans>
              Enter minimum and maximum number of units, or leave either blank. Set both to blank to
              clear filter.
            </Trans>
          </span>
        </div>
      </div>
      <button
        className="button is-primary"
        aria-label={i18n._(t`Apply selections and get results`)}
        onClick={(e) => {
          e.preventDefault();
          const errors = minMaxHasError(minMax[0], options);
          if (errors.min || errors.max) {
            setMinMaxErrors(errors);
          } else {
            onApply(minMax);
          }
        }}
      >
        <Trans>Apply</Trans>
      </button>
    </form>
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
