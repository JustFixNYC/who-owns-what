import { t, Trans, Plural } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";
import classnames from "classnames";
import React from "react";
import { CheckIcon, ChevronIcon, CloseIcon, InfoIcon } from "./Icons";
import {
  FilterContext,
  PortfolioAnalyticsEvent,
  NUMBER_RANGE_DEFAULT,
  FilterNumberRangeSelections,
} from "./PropertiesList";
import FocusTrap from "focus-trap-react";
import { FocusTarget } from "focus-trap";
import { Alert } from "./Alert";
import Modal from "./Modal";
import { LocaleLink } from "i18n";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { isLegacyPath } from "./WowzaToggle";
import { useLocation } from "react-router-dom";
import Browser from "../util/browser";
import helpers from "util/helpers";
import MultiSelect, { Option } from "./Multiselect";
import MinMaxSelect from "./MinMaxSelect";

import "styles/PortfolioFilters.scss";

type PortfolioFilterProps = withI18nProps & {
  logPortfolioAnalytics: PortfolioAnalyticsEvent;
};

const PortfolioFiltersWithoutI18n = React.memo(
  React.forwardRef<HTMLDivElement, PortfolioFilterProps>((props, ref) => {
    const isMobile = Browser.isMobile();

    const [showInfoModal, setShowInfoModal] = React.useState(false);

    const { pathname } = useLocation();
    const { about, methodology, legacy } = createWhoOwnsWhatRoutePaths();

    const { filterContext, setFilterContext } = React.useContext(FilterContext);
    const { filteredBuildings } = filterContext;
    const { ownernames: ownernamesOptions, zip: zipOptions } = filterContext.filterOptions;
    const {
      ownernames: ownernamesSelections,
      unitsres: unitsresSelections,
      zip: zipSelections,
    } = filterContext.filterSelections;

    const { i18n, logPortfolioAnalytics } = props;

    const [rsunitslatestActive, setRsunitslatestActive] = React.useState(false);
    const updateRsunitslatest = () => {
      logPortfolioAnalytics(rsunitslatestActive ? "filterCleared" : "filterApplied", {
        column: "rsunitslatest",
      });
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
    const onOwnernamesApply = (selectedList: string[]) => {
      logPortfolioAnalytics(!selectedList.length ? "filterCleared" : "filterApplied", {
        column: "ownernames",
      });
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
    const onUnitsresApply = (selections: FilterNumberRangeSelections) => {
      const updatedIsActive = selections.type !== "default";
      logPortfolioAnalytics(!updatedIsActive ? "filterCleared" : "filterApplied", {
        column: "unitsres",
      });
      setUnitsresActive(updatedIsActive);
      setUnitsresIsOpen(false);
      setFilterContext({
        ...filterContext,
        filterSelections: {
          ...filterContext.filterSelections,
          unitsres: selections,
        },
      });
    };

    const [zipActive, setZipActive] = React.useState(false);
    const [zipIsOpen, setZipIsOpen] = React.useState(false);
    const onZipApply = (selectedList: string[]) => {
      logPortfolioAnalytics(!selectedList.length ? "filterCleared" : "filterApplied", {
        column: "zip",
      });
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
      logPortfolioAnalytics("filterCleared", { column: "_all" });
      setRsunitslatestActive(false);
      setOwnernamesActive(false);
      setUnitsresActive(false);
      setZipActive(false);
      setFilterContext({
        ...filterContext,
        filterSelections: {
          rsunitslatest: false,
          ownernames: [],
          unitsres: { type: "default", values: [NUMBER_RANGE_DEFAULT] },
          zip: [],
        },
      });
    };

    const activeFilters = { rsunitslatestActive, ownernamesActive, unitsresActive, zipActive };

    const ownernamesInfoModalContents = React.useMemo(
      () => (
        <>
          <h4>
            <Trans>What’s the difference between a landlord, an owner, and head officer?</Trans>
          </h4>
          <p>
            <Trans>
              While the legal owner of a building is often a company (usually called an “LLC”),
              these names and business addresses registered with the Department of Housing
              Preservation and Development (“HPD”) offer a clearer picture of who really controls
              the building. People listed here as “Head Officer” or “Owner” usually have ties to
              building ownership, while “Site Managers” are part of management. That being said,
              these names are self reported by the landlord, so they can be misleading. Learn more
              about HPD registrations and how this information powers this tool on the{" "}
              <LocaleLink to={isLegacyPath(pathname) ? legacy.about : about}>About page</LocaleLink>
              .
            </Trans>
          </p>
          <LocaleLink to={isLegacyPath(pathname) ? legacy.methodology : methodology}>
            <Trans>Read more in our Methodology section</Trans>
          </LocaleLink>
        </>
      ),
      [] // eslint-disable-line react-hooks/exhaustive-deps
    );

    return (
      <div className="PortfolioFilters" ref={ref}>
        <div className="filter-new-container">
          <span className="pill-new">
            <Trans>New</Trans>
          </span>
          {!isMobile && (
            <span>
              <Trans>Filters:</Trans>
            </span>
          )}
        </div>
        <FiltersWrapper
          isMobile={isMobile}
          activeFilters={activeFilters}
          resultsCount={filteredBuildings}
        >
          <button
            aria-pressed={rsunitslatestActive}
            onClick={updateRsunitslatest}
            className="filter filter-toggle"
            aria-label={i18n._(t`Rent Stabilized Units filter`)}
          >
            <div className="checkbox">{rsunitslatestActive && <CheckIcon />}</div>
            <span>
              <Trans>Rent Stabilized Units</Trans>
            </span>
          </button>
          <FilterAccordion
            title={i18n._(t`Landlord`)}
            subtitle={i18n._(t`Person/Entity`)}
            infoLabel={i18n._(t`Who are they?`)}
            infoModalContents={ownernamesInfoModalContents}
            isActive={ownernamesActive}
            isOpen={ownernamesIsOpen}
            setIsOpen={setOwnernamesIsOpen}
            onOpen={() => logPortfolioAnalytics("filterOpened", { column: "ownernames" })}
            selectionsCount={filterContext.filterSelections.ownernames.length}
            className="ownernames-accordion"
          >
            <MultiSelect
              id="filter-ownernames-multiselect"
              options={valuesAsMultiselectOptions(ownernamesOptions)}
              onApply={onOwnernamesApply}
              onError={() => logPortfolioAnalytics("filterError", { column: "ownernames" })}
              infoAlert={OwnernamesInfoAlert}
              aria-label={i18n._(t`Landlord filter`)}
              isOpen={ownernamesIsOpen}
              defaultSelections={valuesAsMultiselectOptions(ownernamesSelections)}
            />
          </FilterAccordion>
          <FilterAccordion
            title={i18n._(t`Building Size`)}
            subtitle={i18n._(t`Number of Units`)}
            isActive={unitsresActive}
            isOpen={unitsresIsOpen}
            onOpen={() => logPortfolioAnalytics("filterOpened", { column: "unitsres" })}
            setIsOpen={setUnitsresIsOpen}
            className="unitsres-accordion"
          >
            <MinMaxSelect
              options={filterContext.filterOptions.unitsres}
              onApply={onUnitsresApply}
              onError={() => logPortfolioAnalytics("filterError", { column: "unitsres" })}
              id="filter-unitsres-minmax"
              isOpen={unitsresIsOpen}
              defaultSelections={unitsresSelections}
            />
          </FilterAccordion>
          <FilterAccordion
            title={i18n._(t`Zip Code`)}
            isActive={zipActive}
            isOpen={zipIsOpen}
            setIsOpen={setZipIsOpen}
            onOpen={() => logPortfolioAnalytics("filterOpened", { column: "zip" })}
            selectionsCount={filterContext.filterSelections.zip.length}
            className="zip-accordion"
          >
            <MultiSelect
              id="filter-zip-multiselect"
              options={valuesAsMultiselectOptions(zipOptions)}
              onApply={onZipApply}
              noOptionsMessage={() => i18n._(t`ZIP code is not applicable`)}
              onError={() => logPortfolioAnalytics("filterError", { column: "zip" })}
              aria-label={i18n._(t`Zip code filter`)}
              onKeyDown={helpers.preventNonNumericalInput}
              isOpen={zipIsOpen}
              defaultSelections={valuesAsMultiselectOptions(zipSelections)}
            />
          </FilterAccordion>
        </FiltersWrapper>

        {(rsunitslatestActive || ownernamesActive || unitsresActive || zipActive) && (
          <div className="filter-status">
            <div className="filter-status-info">
              <span className="results-count" role="status">
                <Trans>
                  Showing {filteredBuildings || 0}{" "}
                  <Plural value={filteredBuildings || 0} one="result" other="results" />
                </Trans>
              </span>
              <button
                className="results-info"
                onClick={() => setShowInfoModal(true)}
                aria-label={i18n._(t`Learn more about how the results are calculated`)}
              >
                <InfoIcon />
              </button>
              <button className="clear-filters button is-text" onClick={clearFilters}>
                <Trans>Clear Filters</Trans>
              </button>
            </div>
            {filteredBuildings === 0 ? ZeroResultsAlert : <></>}
          </div>
        )}

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
      </div>
    );
  })
);

type ActiveFilters = {
  rsunitslatestActive: boolean;
  ownernamesActive: boolean;
  unitsresActive: boolean;
  zipActive: boolean;
};

const FiltersWrapper = (props: {
  isMobile: boolean;
  activeFilters: ActiveFilters;
  resultsCount: number | undefined;
  children: React.ReactNode;
}) => {
  const { isMobile, activeFilters, resultsCount, children } = props;
  const numActiveFilters = Object.values(activeFilters).filter(Boolean).length;
  const [isOpen, setIsOpen] = React.useState(false);

  return !isMobile ? (
    <div className="filters">{children}</div>
  ) : (
    <FocusTrap
      active={isOpen}
      focusTrapOptions={{
        clickOutsideDeactivates: true,
        returnFocusOnDeactivate: false,
        onDeactivate: () => setIsOpen(false),
      }}
    >
      <div className="filters">
        <details
          className={classnames("filter filter-accordion filters-mobile-wrapper", {
            active: numActiveFilters > 0,
          })}
          open={isOpen}
        >
          <summary
            onClick={(e) => {
              e.preventDefault();
              setIsOpen(!isOpen);
            }}
          >
            <Trans>Filters</Trans>
            {!isOpen && !!numActiveFilters && (
              <span className="active-filter-count">{numActiveFilters}</span>
            )}
            {isOpen ? <CloseIcon className="closeIcon" /> : <ChevronIcon className="chevronIcon" />}
          </summary>
          <div className="dropdown-container scroll-gradient mobile-wrapper-dropdown">
            {children}
            {numActiveFilters > 0 && (
              <button
                className="button is-primary"
                onClick={() => {
                  setIsOpen(!isOpen);
                }}
              >
                <Trans>View Results</Trans>
                {resultsCount != null && <span className="view-results-count">{resultsCount}</span>}
              </button>
            )}
            {resultsCount === 0 ? ZeroResultsAlert : <></>}
          </div>
        </details>
      </div>
    </FocusTrap>
  );
};

export const OwnernamesResultAlert = (
  <Alert
    className="filter-result-alert"
    type="info"
    variant="secondary"
    closeType="session"
    storageId="filter-ownernames-results-alert"
    role="status"
  >
    <Trans>
      Expand the Person/ Entity column in the Table to see all contacts associated with that
      building.
    </Trans>
  </Alert>
);

export const RsUnitsResultAlert = (
  <Alert
    className="filter-result-alert"
    type="info"
    variant="secondary"
    closeType="session"
    storageId="filter-rsunits-results-alert"
    role="status"
  >
    <Trans>
      Rent stabilized units are self-reported in yearly tax statements by building owners. As a
      result, many buildings with rent stabilized units may not be documented.
    </Trans>
  </Alert>
);

const ZeroResultsAlert = (
  <Alert
    className="zero-results-alert"
    type="info"
    variant="secondary"
    closeType="none"
    role="status"
  >
    <Trans>Try adjusting or clearing the filters to show more than 0 results.</Trans>
  </Alert>
);

const OwnernamesInfoAlert = (
  <Alert
    className="ownernames-info-alert"
    type="info"
    variant="secondary"
    closeType="session"
    storageId="owner-info-alert-close"
    role="status"
  >
    <Trans>
      Look out for multiple spellings of the same person/entity. Names can be spelled multiple ways
      in official documents.
    </Trans>
  </Alert>
);

type FilterAccordionProps = withI18nProps & {
  title: string;
  subtitle?: string;
  infoLabel?: string;
  onInfoClick?: () => void;
  infoModalContents?: JSX.Element;
  children: React.ReactNode;
  isActive: boolean;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onOpen?: () => void;
  initialFocus?: FocusTarget;
  selectionsCount?: number;
  className?: string;
};

/**
 * We use state to make this a controled component that mimics the original
 * details/summary behaviour. Some helpful info on how/why to do this:
 * https://github.com/facebook/react/issues/15486. Also, because we need to be
 * able to open/close this from outside of the component (eg. via onApply that's
 * passed to the multiselect child component)
 */
const FilterAccordion = withI18n()((props: FilterAccordionProps) => {
  const {
    title,
    subtitle,
    infoLabel,
    onInfoClick,
    infoModalContents,
    children,
    isActive,
    isOpen,
    setIsOpen,
    onOpen,
    initialFocus,
    selectionsCount,
    className,
    i18n,
  } = props;
  const [showInfoModal, setShowInfoModal] = React.useState(false);

  return (
    <>
      <FocusTrap
        active={isOpen}
        paused={showInfoModal}
        focusTrapOptions={{
          clickOutsideDeactivates: true,
          returnFocusOnDeactivate: false,
          onDeactivate: () => setIsOpen(false),
          initialFocus: initialFocus,
        }}
      >
        <details
          className={classnames("filter filter-accordion", className, { active: isActive })}
          open={isOpen}
        >
          <summary
            onClick={(e) => {
              e.preventDefault();
              !isOpen && onOpen && onOpen();
              setIsOpen(!isOpen);
            }}
            data-selections={selectionsCount}
            aria-label={i18n._(t`Filter`)}
          >
            {title}
            {isActive && selectionsCount && (
              <span className="filter-selection-count">{selectionsCount}</span>
            )}
            <ChevronIcon className="chevronIcon" />
          </summary>
          <div className="dropdown-container">
            {subtitle && (
              <div className="filter-subtitle-container">
                {subtitle && <span className="filter-subtitle">{subtitle}</span>}
                {infoLabel && (
                  <button
                    className="filter-info button is-text"
                    onClick={() => {
                      setShowInfoModal(true);
                      onInfoClick && onInfoClick();
                    }}
                  >
                    {infoLabel}
                  </button>
                )}
              </div>
            )}
            {children}
          </div>
        </details>
      </FocusTrap>
      {infoModalContents && (
        <Modal showModal={showInfoModal} width={20} onClose={() => setShowInfoModal(false)}>
          {infoModalContents}
        </Modal>
      )}
    </>
  );
});

function valuesAsMultiselectOptions(values: string[]): Option[] {
  const formattedOptions: Option[] = values
    ? values.map((val: string) => ({ value: val, label: val }))
    : [];
  return formattedOptions;
}

const PortfolioFilters = withI18n()(PortfolioFiltersWithoutI18n);

export default PortfolioFilters;
