import { I18n } from "@lingui/core";
import { t, Trans, Plural } from "@lingui/macro";
import classnames from "classnames";
import React from "react";
import { CheckIcon, ChevronIcon, InfoIcon } from "./Icons";
import { Multiselect } from "./Multiselect";
import { FilterContext, FilterNumberRange, MINMAX_DEFAULT } from "./PropertiesList";
import "styles/PortfolioFilters.scss";
import FocusTrap from "focus-trap-react";
import { Alert } from "./Alert";
import Modal from "./Modal";
import { LocaleLink } from "i18n";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { isLegacyPath } from "./WowzaToggle";
import { useLocation } from "react-router-dom";

type PortfolioFiltersProps = {
  i18n: I18n;
};
export const PortfolioFilters = React.memo(
  React.forwardRef<HTMLDivElement, PortfolioFiltersProps>((props, ref) => {
    const { i18n } = props;

    const [showInfoModal, setShowInfoModal] = React.useState(false);
    const [showOwnerModal, setShowOwnerModal] = React.useState(false);
    const { pathname } = useLocation();
    const { about, methodology, legacy } = createWhoOwnsWhatRoutePaths();

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
          <span className="pill-new">
            <Trans>New</Trans>
          </span>
          <Trans>Filters</Trans>:
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
              infoOnClick={() => setShowOwnerModal(true)}
              isActive={ownernamesActive}
              isOpen={ownernamesIsOpen}
              setIsOpen={setOwnernamesIsOpen}
              selectionsCount={filterContext.filterSelections.ownernames.length}
              id="ownernames-accordion"
            >
              <Multiselect
                options={ownernamesOptions.map((value: any) => ({ name: value, id: value }))}
                selectedValues={ownernamesSelections}
                displayValue="name"
                placeholder={i18n._(t`Search`) + `... (${ownernamesOptions.length})`}
                onApply={onOwnernamesApply}
                infoAlert={OwnerInfoAlert}
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
              />
            </FilterAccordion>
            <FilterAccordion
              title={i18n._(t`Zipcode`)}
              isActive={zipActive}
              isOpen={zipIsOpen}
              setIsOpen={setZipIsOpen}
              selectionsCount={filterContext.filterSelections.zip.length}
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
              <button className="results-info" onClick={() => setShowInfoModal(true)}>
                <InfoIcon />
              </button>
              <button className="clear-filters button is-text" onClick={clearFilters}>
                <Trans>Clear Filters</Trans>
              </button>
            </div>
          )}
        </div>
        <Modal key={1} showModal={showInfoModal} width={20} onClose={() => setShowInfoModal(false)}>
          <h4>
            <Trans>How are the results calculated?</Trans>
          </h4>
          <p>
            <Trans>
              We pull data from public records to calculate these results. Our algorithm relies on
              public{" "}
              <a href="https://www.nyc.gov/site/hpd/about/open-data.page">HPD registration data</a>{" "}
              for residential buildings, which contains self-reported landlord contact information
              on about 170,000 properties across the city.
            </Trans>
          </p>
          <LocaleLink to={isLegacyPath(pathname) ? legacy.methodology : methodology}>
            <Trans>Read more in our Methodology section</Trans>
          </LocaleLink>
        </Modal>
        <Modal
          key={2}
          showModal={showOwnerModal}
          width={20}
          onClose={() => setShowOwnerModal(false)}
        >
          <h4>
            <Trans>What’s the difference between a landlord, an owner, and head officer?</Trans>
          </h4>
          <p>
            <Trans>
              While the legal owner of a building is often a company (usually called an “LLC”),
              these names and business addresses registered with HPD offer a clearer picture of who
              really controls the building. People listed here as “Head Officer” or “Owner” usually
              have ties to building ownership, while “Site Managers” are part of management. That
              being said, these names are self reported by the landlord, so they can be misleading.
              Learn more about HPD registrations and how this information powers this tool on the{" "}
              <LocaleLink to={isLegacyPath(pathname) ? legacy.about : about}>About page</LocaleLink>
              .
            </Trans>
          </p>
          <LocaleLink to={isLegacyPath(pathname) ? legacy.methodology : methodology}>
            <Trans>Read more in our Methodology section</Trans>
          </LocaleLink>
        </Modal>
      </div>
    );
  })
);

const OwnerInfoAlert = (
  <Alert
    className="owner-info-alert"
    type="info"
    variant="secondary"
    closeType="session"
    storageId="owner-info-alert-close"
  >
    <Trans>
      Look out for multiple spellings for the same person/entity. Names can be spelled multiple ways
      in official documents.
    </Trans>
  </Alert>
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
  selectionsCount?: number;
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
    selectionsCount,
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
          {!isOpen && isActive && selectionsCount && <> ({selectionsCount})</>}
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
}) {
  const { options, onApply } = props;
  const [minMax, setMinMax] = React.useState(options);
  const [minMaxErrors, setMinMaxErrors] = React.useState([false, false]);

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
      {minMaxErrors[0] || minMaxErrors[1] ? (
        <div className="alerts-container">
          <Alert type="error" variant="primary" closeType="none">
            <Trans>Error</Trans>
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
            setMinMaxErrors([false, false]);
            setMinMax([cleanNumberInput(e.target.value), minMax[1]]);
          }}
          className={classnames("min-input", { hasError: minMaxErrors[0] })}
        />
        <Trans>and</Trans>
        <input
          id="max-input"
          type="number"
          min={options[0]}
          max={options[1]}
          value={minMax[1] == null ? "" : minMax[1]}
          onChange={(e) => {
            setMinMaxErrors([false, false]);
            setMinMax([minMax[0], cleanNumberInput(e.target.value)]);
          }}
          className={classnames("max-input", { hasError: minMaxErrors[1] })}
        />
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

function minMaxHasError(values: FilterNumberRange, options: FilterNumberRange): [boolean, boolean] {
  if (typeof options[0] === "undefined" || typeof options[1] === "undefined") {
    return [true, true];
  }

  const minHasError = typeof values[0] === "undefined" ? false : values[0] < options[0];
  const maxHasError = typeof values[1] === "undefined" ? false : values[1] > options[1];

  return [minHasError, maxHasError];
}
