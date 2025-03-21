import { t, Trans, Plural } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";
import classnames from "classnames";
import React from "react";
import { InfoIcon } from "./Icons";
import { Icon } from "@justfixnyc/component-library";
import {
  FilterContext,
  PortfolioAnalyticsEvent,
  NUMBER_RANGE_DEFAULT,
  FilterNumberRangeSelections,
  filterAddresses,
} from "./PropertiesList";
import FocusTrap from "focus-trap-react";
import { FocusTarget } from "focus-trap";
import { Alert } from "./Alert";
import Modal from "./Modal";
import { LocaleLink } from "i18n";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { isLegacyPath } from "./WowzaToggle";
import { useLocation } from "react-router-dom";
import helpers from "util/helpers";
import MultiSelect, { Option } from "./Multiselect";
import MinMaxSelect from "./MinMaxSelect";
import _groupBy from "lodash/groupBy";
import { withMachineInStateProps } from "state-machine";

import "styles/PortfolioFilters.scss";
import { AddressRecord } from "./APIDataTypes";
import { sortContactsByImportance } from "./DetailView";

type PortfolioFilterProps = withMachineInStateProps<"portfolioFound"> &
  withI18nProps & {
    logPortfolioAnalytics: PortfolioAnalyticsEvent;
  };

const PortfolioFiltersWithoutI18n = React.memo(
  React.forwardRef<HTMLDivElement, PortfolioFilterProps>((props, ref) => {
    const { width } = helpers.useWindowSize();
    const isMobile = !!width && width <= 599;

    const [showInfoModal, setShowInfoModal] = React.useState(false);

    const { pathname } = useLocation();
    const { about, methodology, legacy } = createWhoOwnsWhatRoutePaths();

    const { filterContext, setFilterContext } = React.useContext(FilterContext);
    const { filterSelections, filteredBuildings, viewType } = filterContext;
    const {
      ownernames: ownernamesOptions,
      zip: zipOptions,
      unitsres: unitsresOptions,
    } = filterContext.filterOptions;
    const {
      ownernames: ownernamesSelections,
      unitsres: unitsresSelections,
      zip: zipSelections,
    } = filterSelections;

    const { i18n, logPortfolioAnalytics } = props;

    const { assocAddrs } = props.state.context.portfolioData;

    React.useEffect(() => {
      setFilterContext({
        ...filterContext,
        filterOptions: {
          ownernames: getOwnernamesOptions(assocAddrs),
          unitsres: getUnitsresOptions(assocAddrs),
          zip: getZipOptions(assocAddrs),
        },
      });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    React.useEffect(() => {
      setFilterContext((prevContext) => ({
        ...prevContext,
        totalBuildings: assocAddrs.length,
        filteredBuildings: filterAddresses(assocAddrs, filterSelections).length,
      }));
    }, [filterSelections]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <div className="filters-container">
          <div className="view-type-toggle-container">
            <button
              aria-pressed={viewType === "table"}
              className="view-type-toggle"
              onClick={() => setFilterContext((prev) => ({ ...prev, viewType: "table" }))}
            >
              <Trans>Table</Trans>
            </button>
            <button
              aria-pressed={viewType === "map"}
              className="view-type-toggle"
              onClick={() => setFilterContext((prev) => ({ ...prev, viewType: "map" }))}
            >
              <Trans>Map</Trans>
            </button>
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
              <div className="checkbox">{rsunitslatestActive && <Icon icon="check" />}</div>
              <span>
                <Trans>Rent Stabilized Units</Trans>
              </span>
            </button>
            <FilterAccordion
              title={i18n._(t`Landlord`)}
              subtitle={i18n._(t`Person/Entity`)}
              infoIconAriaLabel={i18n._(
                t`Learn more about what it means for someone to be listed as a landlord`
              )}
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
                options={unitsresOptions}
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
              {filteredBuildings === 0 && ZeroResultsAlert}
              {!!filteredBuildings && rsunitslatestActive && RsUnitsResultAlert}
            </div>
          )}
        </div>

        <Modal key={1} showModal={showInfoModal} width={40} onClose={() => setShowInfoModal(false)}>
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
            {isOpen ? (
              <Icon icon="xmark" className="closeIcon" />
            ) : (
              <Icon icon="chevronDown" className="chevronIcon" />
            )}
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
            {resultsCount === 0 && ZeroResultsAlert}
          </div>
        </details>
      </div>
    </FocusTrap>
  );
};

const RsUnitsResultAlert = (
  <Alert
    className="filter-results-alert"
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
    <Trans>The same owner may have spelled their name several ways in official documents.</Trans>
  </Alert>
);

type FilterAccordionProps = withI18nProps & {
  title: string;
  subtitle?: string;
  infoIconAriaLabel?: string;
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
    infoIconAriaLabel,
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
            <Icon icon="chevronDown" className="chevronIcon" />
          </summary>
          <div className="dropdown-container">
            {subtitle && (
              <div className="filter-subtitle-container">
                {subtitle && <span className="filter-subtitle">{subtitle}</span>}
                {infoModalContents && (
                  <button
                    className="filter-info"
                    aria-label={infoIconAriaLabel}
                    onClick={() => {
                      setShowInfoModal(true);
                      onInfoClick && onInfoClick();
                    }}
                  >
                    <InfoIcon />
                  </button>
                )}
              </div>
            )}
            {children}
          </div>
        </details>
      </FocusTrap>
      {infoModalContents && (
        <Modal showModal={showInfoModal} width={40} onClose={() => setShowInfoModal(false)}>
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

function getOwnernamesOptions(addrs: AddressRecord[]) {
  const allContactNames = addrs.map((addr) => {
    // Group all contact info by the name of each person/corporate entity (same as on overview tab)
    var ownerList =
      addr.allcontacts &&
      Object.entries(_groupBy(addr.allcontacts, "value"))
        .sort(sortContactsByImportance)
        .map((contact) => contact[0]);
    return ownerList || [];
  });

  // put corporations like "123 Fake St, LLC" at the end so real names are shown first
  return Array.from(new Set(allContactNames.flat())).sort(compareAlphaNumLast);
}

function compareAlphaNumLast(a: string, b: string) {
  if (startsNumeric(a) === startsNumeric(b)) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  }
  return startsNumeric(a) ? 1 : -1;
}

function startsNumeric(x: string) {
  return /^\d/.test(x);
}

function getUnitsresOptions(addrs: AddressRecord[]) {
  const allUnitsres = addrs.map((addr) => addr.unitsres || 0);
  return allUnitsres.length
    ? { min: Math.min(...allUnitsres), max: Math.max(...allUnitsres) }
    : NUMBER_RANGE_DEFAULT;
}

function getZipOptions(addrs: AddressRecord[]) {
  const allZips = addrs.map((addr) => addr.zip).filter((zip) => zip != null) as string[];
  return Array.from(new Set(allZips)).sort();
}

const PortfolioFilters = withI18n()(PortfolioFiltersWithoutI18n);

export default PortfolioFilters;
