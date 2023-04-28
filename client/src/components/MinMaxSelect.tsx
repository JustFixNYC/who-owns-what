import React from "react";
import { Trans } from "@lingui/macro";
import classnames from "classnames";
import helpers from "util/helpers";
import { Alert } from "./Alert";
import { FilterNumberRange, MINMAX_DEFAULT } from "./PropertiesList";

function MinMaxSelect(props: {
  options: FilterNumberRange;
  onApply: (selectedList: FilterNumberRange) => void;
  id?: string;
  onFocusInput?: () => void;
}) {
  const { options, onApply, id, onFocusInput } = props;
  const [minMax, setMinMax] = React.useState<FilterNumberRange>(MINMAX_DEFAULT);
  const [minMaxErrors, setMinMaxErrors] = React.useState<MinMaxErrors>([false, false, undefined]);

  return (
    <form id={id} className="minmax-container">
      {minMaxErrors[0] || minMaxErrors[1] ? (
        <div className="alerts-container">
          <Alert type="error" variant="primary" closeType="none" role="status">
            {minMaxErrors[2]}
          </Alert>
        </div>
      ) : (
        <></>
      )}
      <div className="label-input-container">
        <div className="labels-container">
          <label htmlFor="min-input">
            <Trans>MIN</Trans>
          </label>
          <label htmlFor="max-input">
            <Trans>MAX</Trans>
          </label>
        </div>
        <div className="inputs-container">
          <input
            id={`${id || "minmax-select"}_min-input`}
            type="number"
            min={options[0]}
            max={options[1]}
            value={minMax[0] == null ? "" : minMax[0]}
            onKeyDown={helpers.preventNonNumericalInput}
            onChange={(e) => {
              setMinMaxErrors([false, false, undefined]);
              setMinMax([cleanNumberInput(e.target.value), minMax[1]]);
            }}
            onFocus={onFocusInput}
            className={classnames("min-input", { hasError: minMaxErrors[0] })}
          />
          <span>
            <Trans>and</Trans>
          </span>
          <input
            id={`${id || "minmax-select"}_max-input`}
            type="number"
            min={options[0]}
            max={options[1]}
            value={minMax[1] == null ? "" : minMax[1]}
            onKeyDown={helpers.preventNonNumericalInput}
            onChange={(e) => {
              setMinMaxErrors([false, false, undefined]);
              setMinMax([minMax[0], cleanNumberInput(e.target.value)]);
            }}
            onFocus={onFocusInput}
            className={classnames("max-input", { hasError: minMaxErrors[1] })}
          />
        </div>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          const errors = minMaxHasError(minMax, options);
          if (errors[0] || errors[1]) {
            setMinMaxErrors(errors);
          } else {
            onApply(minMax);
          }
        }}
        className="button is-primary"
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

type MinMaxErrors = [boolean, boolean, JSX.Element | undefined];
function minMaxHasError(values: FilterNumberRange, options: FilterNumberRange): MinMaxErrors {
  const [minValue, maxValue] = values;
  const [minOption, maxOption] = options;
  let minHasError = false;
  let maxHasError = false;
  let errorMessage: JSX.Element | undefined;

  if (minValue != null && maxValue != null && minValue > maxValue) {
    minHasError = true;
    maxHasError = true;
    errorMessage = <Trans>Min must be less than or equal to Max</Trans>;
  }
  if (minValue != null && minValue < 0) {
    minHasError = true;
    errorMessage = <Trans>Min must be greater than 0</Trans>;
  }
  if (maxValue != null && maxValue < 0) {
    minHasError = true;
    errorMessage = <Trans>Max must be greater than 0</Trans>;
  }
  if (maxValue != null && minOption != null && maxValue < minOption) {
    maxHasError = true;
    errorMessage = <Trans>Max must be greater than {minOption}</Trans>;
  }
  if (minValue != null && maxOption != null && minValue > maxOption) {
    minHasError = true;
    errorMessage = <Trans>Min must be less than {maxOption}</Trans>;
  }

  return [minHasError, maxHasError, errorMessage];
}

export default MinMaxSelect;
