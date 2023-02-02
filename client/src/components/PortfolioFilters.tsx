import { I18n } from "@lingui/core";
import { t, Trans, Plural } from "@lingui/macro";
import classnames from "classnames";
import React from "react";
import { CheckIcon, ChevronIcon } from "./Icons";
import { Multiselect } from "./multiselect-dropdown/multiselect/Multiselect";
import { FilterContext, FilterNumberRange, MINMAX_DEFAULT } from "./PropertiesList";
import "styles/PortfolioFilters.scss";
import FocusTrap from "focus-trap-react";

type PortfolioFiltersProps = {
  i18n: I18n;
};
export const PortfolioFilters = React.memo(
  React.forwardRef<HTMLDivElement, PortfolioFiltersProps>((props, ref) => {
    const { i18n } = props;
    const { filterContext, setFilterContext } = React.useContext(FilterContext);

    const { filteredBuildings } = filterContext;

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
            <ToggleFilter
              onClick={updateRsunitslatest}
              className="filter-toggle"
              isActive={rsunitslatestActive}
              setIsActive={setRsunitslatestActive}
            >
              <Trans>Rent Stabilized Units</Trans>
            </ToggleFilter>
            <FilterAccordion
              title={i18n._(t`Landlord`)}
              subtitle={i18n._(t`Officer/Owner`)}
              isActive={ownernamesActive}
              isOpen={ownernamesIsOpen}
              setIsOpen={setOwnernamesIsOpen}
              id="ownernames-accordion"
            >
              <MultiSelectFilter
                options={filterContext.filterOptions.ownernames}
                onApply={(selectedList) => {
                  // closeAccordion("#ownernames-accordion");
                  onOwnernamesApply(selectedList);
                }}
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
              <MinMaxFilter
                options={filterContext.filterOptions.unitsres}
                onApply={(selectedList) => {
                  // closeAccordion("#unitsres-accordion");
                  onUnitsresApply(selectedList);
                }}
              />
            </FilterAccordion>
            <FilterAccordion
              title={i18n._(t`Zipcode`)}
              isActive={zipActive}
              isOpen={zipIsOpen}
              setIsOpen={setZipIsOpen}
              id="zip-accordion"
            >
              <MultiSelectFilter
                options={filterContext.filterOptions.zip}
                onApply={(selectedList) => {
                  // closeAccordion("#zip-accordion");
                  onZipApply(selectedList);
                }}
              />
            </FilterAccordion>
          </div>
          {filteredBuildings &&
            [rsunitslatestActive, ownernamesActive, unitsresActive, zipActive].includes(true) && (
              <div className="filter-status">
                <span className="results-count">
                  <Trans>
                    Showing {filteredBuildings}{" "}
                    <Plural value={filteredBuildings} one="result" other="results" />.
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
  children: React.ReactNode;
  isActive: boolean;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
  id: string;
}) {
  const { title, subtitle, children, isActive, isOpen, setIsOpen, className, id } = props;

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
          {subtitle && <span className="filter-subtitle">{subtitle}</span>}
          {children}
        </div>
      </details>
    </FocusTrap>
  );
}

function MultiSelectFilter({
  options,
  onApply,
}: {
  options: any[];
  onApply: (selectedList: any) => void;
}) {
  return (
    <Multiselect
      options={options.map((value: any) => ({ name: value, id: value }))}
      displayValue="name"
      // TODO: localize
      placeholder={`Search... (${options.length})`}
      onApply={onApply}
    />
  );
}

function MinMaxFilter({
  options,
  onApply,
}: {
  options: FilterNumberRange;
  onApply: (selectedList: FilterNumberRange) => void;
}) {
  const [minMax, setMinMax] = React.useState(options);

  return (
    <div className="minmax-container">
      <div className="inputs-container">
        <input
          type="number"
          min={options[0]}
          max={options[1]}
          value={minMax[0]}
          onChange={(value) => setMinMax([Number(value) || undefined, minMax[1]])}
          // TODO: localize
          placeholder="MIN"
          aria-label="Minimum"
          className="min-input"
        />
        <Trans>and</Trans>
        <input
          type="number"
          min={options[0]}
          max={options[1]}
          value={minMax[1]}
          onChange={(value) => setMinMax([minMax[0], Number(value) || undefined])}
          // TODO: localize
          placeholder="MAX"
          aria-label="Maximum"
          className="max-input"
        />
      </div>
      <button onClick={() => onApply(minMax)} className="button is-primary">
        <Trans>Apply</Trans>
      </button>
    </div>
  );
}

function ToggleFilter(props: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  isActive: boolean;
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { onClick, children, className, isActive, setIsActive } = props;
  const handleToggle = () => {
    onClick();
    setIsActive(!isActive);
  };

  return (
    <button aria-pressed={isActive} onClick={handleToggle} className={className}>
      <div className="checkbox">{isActive && <CheckIcon />}</div>
      {children}
    </button>
  );
}
