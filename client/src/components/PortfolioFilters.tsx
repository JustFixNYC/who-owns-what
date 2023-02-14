import { I18n } from "@lingui/core";
import { t, Trans, Plural } from "@lingui/macro";
import classnames from "classnames";
import React from "react";
import { CheckIcon, ChevronIcon } from "./Icons";
import { Multiselect } from "./Multiselect";
import { FilterContext, FilterNumberRange, MINMAX_DEFAULT } from "./PropertiesList";
import "styles/PortfolioFilters.scss";
import FocusTrap from "focus-trap-react";
import { Alert } from "./Alert";

type PortfolioFiltersProps = {
  i18n: I18n;
};
export const PortfolioFilters = React.memo(
  React.forwardRef<HTMLDivElement, PortfolioFiltersProps>((props, ref) => {
    const { i18n } = props;
    const { filterContext, setFilterContext } = React.useContext(FilterContext);

    const { filteredBuildings } = filterContext;
    const { ownernames: ownernamesOptions, zip: zipOptions } = filterContext.filterOptions;
    const { ownernames: ownernamesSelections, zip: zipSelections } = filterContext.filterSelections;

    const [rsunitslatestActive, setRsunitslatestActive] = React.useState(false);
    const updateRsunitslatest = () => {
      setRsunitslatestActive(!rsunitslatestActive);
      setFilterContext({
        ...filterContext,
        filterSelections: {
          ...filterContext.filterSelections,
          rsunitslatest: !filterContext.filterSelections.rsunitslatest,
        },
      });
    };

    const [ownernamesActive, setOwnernamesActive] = React.useState(false);
    const [ownernamesIsOpen, setOwnernamesIsOpen] = React.useState(false);
    const onOwnernamesApply = (selectedList: any) => {
      setOwnernamesActive(!!selectedList.length);
      setOwnernamesIsOpen(false);
      setFilterContext({
        ...filterContext,
        filterSelections: {
          ...filterContext.filterSelections,
          ownernames: selectedList,
        },
      });
    };

    const [unitsresActive, setUnitsresActive] = React.useState(false);
    const [unitsresIsOpen, setUnitsresIsOpen] = React.useState(false);
    const onUnitsresApply = (selectedList: any) => {
      console.log({ onUnitsresApply: selectedList });
      setUnitsresActive(selectedList !== MINMAX_DEFAULT);
      setUnitsresIsOpen(false);
      setFilterContext({
        ...filterContext,
        filterSelections: {
          ...filterContext.filterSelections,
          unitsres: selectedList,
        },
      });
    };

    const [zipActive, setZipActive] = React.useState(false);
    const [zipIsOpen, setZipIsOpen] = React.useState(false);
    const onZipApply = (selectedList: any) => {
      setZipActive(!!selectedList.length);
      setZipIsOpen(false);
      setFilterContext({
        ...filterContext,
        filterSelections: {
          ...filterContext.filterSelections,
          zip: selectedList,
        },
      });
    };

    const clearFilters = () => {
      setRsunitslatestActive(false);
      setOwnernamesActive(false);
      setUnitsresActive(false);
      setZipActive(false);
      setFilterContext({
        ...filterContext,
        filterSelections: {
          rsunitslatest: false,
          ownernames: [],
          unitsres: MINMAX_DEFAULT,
          zip: [],
        },
      });
    };

    return (
      <div className="PortfolioFilters" ref={ref}>
        <div className="filter-for">
          <div className="pill-new">
            <Trans>New</Trans>
          </div>
          <Trans>
            Filter&nbsp;
            <br />
            for
          </Trans>
          :
        </div>
        <div className="filters-container">
          <div className="filters">
            <button
              aria-pressed={rsunitslatestActive}
              onClick={updateRsunitslatest}
              className="filter-toggle"
            >
              <div className="checkbox">{rsunitslatestActive && <CheckIcon />}</div>
              <Trans>Rent Stabilized Units</Trans>
            </button>
            <FilterAccordion
              title={i18n._(t`Landlord`)}
              subtitle={i18n._(t`Officer/Owner`)}
              infoOnClick={() => {}}
              isActive={ownernamesActive}
              isOpen={ownernamesIsOpen}
              setIsOpen={setOwnernamesIsOpen}
              id="ownernames-accordion"
            >
              <Multiselect
                options={ownernamesOptions.map((value: any) => ({ name: value, id: value }))}
                selectedValues={ownernamesSelections}
                displayValue="name"
                // TODO: localize
                placeholder={i18n._(t`Search`) + `... (${ownernamesOptions.length})`}
                onApply={onOwnernamesApply}
              />
            </FilterAccordion>
            <FilterAccordion
              title={i18n._(t`Building Size`)}
              subtitle={i18n._(t`Number of Units`)}
              isActive={unitsresActive}
              isOpen={unitsresIsOpen}
              setIsOpen={setUnitsresIsOpen}
              id="unitsres-accordion"
            >
              <MinMaxSelect
                options={filterContext.filterOptions.unitsres}
                onApply={onUnitsresApply}
                i18n={i18n}
              />
            </FilterAccordion>
            <FilterAccordion
              title={i18n._(t`Zipcode`)}
              isActive={zipActive}
              isOpen={zipIsOpen}
              setIsOpen={setZipIsOpen}
              id="zip-accordion"
            >
              <Multiselect
                options={zipOptions.map((value: any) => ({ name: value, id: value }))}
                selectedValues={zipSelections}
                displayValue="name"
                placeholder={i18n._(t`Search`) + `... (${zipOptions.length})`}
                onApply={onZipApply}
              />
            </FilterAccordion>
          </div>
          {[rsunitslatestActive, ownernamesActive, unitsresActive, zipActive].includes(true) && (
            <div className="filter-status">
              <span className="results-count">
                <Trans>
                  Showing {filteredBuildings || 0}{" "}
                  <Plural value={filteredBuildings || 0} one="result" other="results" />.
                </Trans>
              </span>
              <button className="data-issue button is-text">
                <Trans>Notice an inaccuracy? Click here.</Trans>
              </button>
              <button className="clear-filters button is-text" onClick={clearFilters}>
                <Trans>Clear Filters</Trans>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  })
);

/**
 * We use state to make this a controled component that mimics the original
 * details/summary behaviour. Some helpful info on how/why to do this:
 * https://github.com/facebook/react/issues/15486. Also, because we need to be
 * able to open/close this from outside of the component (eg. via onApply that's
 * passed to the multiselect child component)
 */
function FilterAccordion(props: {
  title: string;
  subtitle?: string;
  infoOnClick?: () => void;
  children: React.ReactNode;
  isActive: boolean;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
  id: string;
}) {
  const {
    title,
    subtitle,
    infoOnClick,
    children,
    isActive,
    isOpen,
    setIsOpen,
    className,
    id,
  } = props;

  return (
    <FocusTrap
      active={isOpen}
      focusTrapOptions={{
        clickOutsideDeactivates: true,
        returnFocusOnDeactivate: false,
        onDeactivate: () => setIsOpen(false),
      }}
    >
      <details
        className={classnames("filter-accordion", className, { active: isActive })}
        id={id}
        open={isOpen}
      >
        <summary
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
        >
          {title}
          <ChevronIcon className="chevonIcon" />
        </summary>
        <div className="dropdown-container">
          <div className="filter-subtitle-container">
            {subtitle && <span className="filter-subtitle">{subtitle}</span>}
            {infoOnClick && (
              <button className="filter-info button is-text" onClick={infoOnClick}>
                <Trans>What's this?</Trans>
              </button>
            )}
          </div>
          {children}
        </div>
      </details>
    </FocusTrap>
  );
}

function MinMaxSelect(props: {
  options: FilterNumberRange;
  onApply: (selectedList: FilterNumberRange) => void;
  i18n: I18n;
}) {
  const { options, onApply, i18n } = props;
  const [minMax, setMinMax] = React.useState(options);
  const [hasError, setHasError] = React.useState(false);

  return (
    <form className="minmax-container">
      <div className="labels-container">
        <label htmlFor="min-input">
          <Trans>MIN</Trans>
        </label>
        <label htmlFor="max-input">
          <Trans>MAX</Trans>
        </label>
      </div>
      {hasError ? (
        <div className="alerts-container">
          <Alert type="error" variant="primary" closeType="none">
            Error
          </Alert>
        </div>
      ) : (
        <></>
      )}
      <div className="inputs-container">
        <input
          id="min-input"
          type="number"
          min={options[0]}
          max={options[1]}
          value={minMax[0] == null ? "" : minMax[0]}
          onChange={(e) => {
            setHasError(false);
            setMinMax([cleanNumberInput(e.target.value), minMax[1]]);
          }}
          placeholder={i18n._(t`MIN`)}
          aria-label={i18n._(t`Minimum`)}
          className="min-input"
        />
        <Trans>and</Trans>
        <input
          id="max-input"
          type="number"
          min={options[0]}
          max={options[1]}
          value={minMax[1] == null ? "" : minMax[1]}
          onChange={(e) => {
            setHasError(false);
            setMinMax([minMax[0], cleanNumberInput(e.target.value)]);
          }}
          placeholder={i18n._(t`MAX`)}
          aria-label={i18n._(t`Maximum`)}
          className="max-input"
        />
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          if (!minMaxIsValid(minMax, options)) {
            setHasError(true);
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

function minMaxIsValid(values: FilterNumberRange, options: FilterNumberRange): boolean {
  if (typeof options[0] === "undefined" || typeof options[1] === "undefined") {
    return true;
  }

  const minValid = typeof values[0] === "undefined" || values[0] >= options[0];
  const maxValid = typeof values[1] === "undefined" || values[1] <= options[1];

  return minValid && maxValid;
}
