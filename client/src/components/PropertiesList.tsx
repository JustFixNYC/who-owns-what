import { withI18n, withI18nProps } from "@lingui/react";
import React from "react";
import { withMachineInStateProps } from "state-machine";
import "styles/PropertiesList.css";
import { defaultLocale, SupportedLocale } from "../i18n-base";
import _groupBy from "lodash/groupBy";
import { FixedLoadingLabel } from "./Loader";
import PortfolioFilters from "./PortfolioFilters";
import PortfolioTable from "./PortfolioTable";
import { AmplitudeEvent, EventProperties, logAmplitudeEvent } from "./Amplitude";
import PropertiesMap from "./PropertiesMap";
import { AddressPageRoutes } from "routes";
import { AddressRecord } from "./APIDataTypes";

// Pattern for context provider to update context from child components
// https://stackoverflow.com/a/67710693/7051239

export type FilterNumberRange = { min: number; max: number };
export const NUMBER_RANGE_DEFAULT = { min: -Infinity, max: Infinity };
export type FilterNumberRangeSelections = {
  type: "default" | "presets" | "custom";
  values: FilterNumberRange[];
};

export type FilterSelections = {
  ownernames: string[];
  unitsres: FilterNumberRangeSelections;
  zip: string[];
  rsunitslatest?: boolean;
};

export type IFilterContext = {
  viewType: "table" | "map";
  totalBuildings?: number | undefined;
  filteredBuildings?: number | undefined;
  filterSelections: FilterSelections;
  filterOptions: {
    ownernames: string[];
    unitsres: FilterNumberRange;
    zip: string[];
  };
};

export const defaultFilterContext: IFilterContext = {
  viewType: "table",
  totalBuildings: undefined,
  filteredBuildings: undefined,
  filterSelections: {
    rsunitslatest: false,
    ownernames: [],
    unitsres: { type: "default", values: [NUMBER_RANGE_DEFAULT] },
    zip: [],
  },
  filterOptions: {
    ownernames: [],
    unitsres: NUMBER_RANGE_DEFAULT,
    zip: [],
  },
};

const useValue = () => {
  const [filterContext, setFilterContext] = React.useState(defaultFilterContext);

  return {
    filterContext,
    setFilterContext,
  };
};

export const FilterContext = React.createContext({} as ReturnType<typeof useValue>);

export const filterAddrs = (addrs: AddressRecord[], filterSelections: FilterSelections) => {
  const {
    rsunitslatest: filterRsunitslatest,
    ownernames: filterOwnernames,
    unitsres: filterUnitsres,
    zip: filterZip,
  } = filterSelections;

  return addrs.filter((addr) => {
    let keepAddr = true;

    if (keepAddr && filterRsunitslatest) {
      keepAddr = (addr.rsunitslatest || 0) > 0;
    }

    if (keepAddr && !!filterOwnernames.length) {
      const addrOwnernames =
        addr.allcontacts &&
        Object.entries(_groupBy(addr.allcontacts, "value")).map((contact) => contact[0]);

      keepAddr = filterOwnernames.some((filterOwnername) =>
        addrOwnernames?.includes(filterOwnername)
      );
    }

    if (keepAddr && filterUnitsres.type !== "default") {
      keepAddr = filterUnitsres.values.reduce(
        (acc, rng) =>
          acc || (addr.unitsres != null && addr.unitsres >= rng.min && addr.unitsres <= rng.max),
        false
      );
    }

    if (keepAddr && !!filterZip.length) {
      keepAddr = addr.zip != null && filterZip.includes(addr.zip);
    }

    return keepAddr;
  });
};

export const FilterContextProvider: React.FC<{}> = (props) => {
  return <FilterContext.Provider value={useValue()}>{props.children}</FilterContext.Provider>;
};

export type PortfolioAnalyticsEvent = (
  event: AmplitudeEvent,
  extraProps: {
    column?: string;
    extraParams?: EventProperties;
    /** In case the corresponding event name for google isn't a straight case change from amplitude */
    gtmEvent?: string;
  }
) => void;

const PropertiesListWithoutI18n: React.FC<
  withMachineInStateProps<"portfolioFound"> &
    withI18nProps & { addressPageRoutes: AddressPageRoutes; isVisible: boolean }
> = (props) => {
  const { i18n, isVisible } = props;
  const locale = (i18n.language as SupportedLocale) || defaultLocale;
  const useNewPortfolioMethod = props.state.context.useNewPortfolioMethod || false;
  const portfolioFiltersEnabled = process.env.REACT_APP_PORTFOLIO_FILTERS_ENABLED === "1" || true;

  const addrs = props.state.context.portfolioData.assocAddrs;
  const rsunitslatestyear = props.state.context.portfolioData.searchAddr.rsunitslatestyear;

  const { filterContext } = React.useContext(FilterContext);
  const { viewType } = filterContext;

  // avoid loading any components until portfolio tab is viewed
  const [everVisible, setEverVisible] = React.useState(false);

  React.useEffect(() => {
    setEverVisible((prev) => prev || isVisible);
  }, [isVisible]);

  // only load the map or table when viewed, and avoid reloading when switching between
  const [viewsEverVisible, setViewsEverVisible] = React.useState({
    table: viewType === "table",
    map: viewType === "map",
  });

  React.useEffect(() => {
    setViewsEverVisible((prev) => ({
      table: prev.table || viewType === "table",
      map: prev.map || viewType === "map",
    }));
  }, [viewType]);

  const logPortfolioAnalytics: PortfolioAnalyticsEvent = (event, extraProps) => {
    const { column, extraParams, gtmEvent } = extraProps;
    const portfolioColumn = !!column && { portfolioColumn: column };
    const eventParams = {
      portfolioSize: addrs.length,
      portfolioMappingMethod: useNewPortfolioMethod ? "wowza" : "legacy",
      ...portfolioColumn,
      ...extraParams,
    };
    logAmplitudeEvent(event, eventParams);
    const gtagEvent = gtmEvent || event.replace(/([a-zA-Z])(?=[A-Z])/g, "$1-").toLowerCase();
    window.gtag("event", gtagEvent, eventParams);
  };

  return !everVisible ? (
    <FixedLoadingLabel />
  ) : (
    <div className="PropertiesList">
      {useNewPortfolioMethod && portfolioFiltersEnabled && (
        <PortfolioFilters
          state={props.state}
          send={props.send}
          logPortfolioAnalytics={logPortfolioAnalytics}
        />
      )}

      {viewsEverVisible.table && (
        <PortfolioTable
          data={addrs}
          locale={locale}
          rsunitslatestyear={rsunitslatestyear}
          getRowCanExpand={() => true}
          logPortfolioAnalytics={logPortfolioAnalytics}
          isVisible={viewType === "table"}
        />
      )}

      {useNewPortfolioMethod && portfolioFiltersEnabled && viewsEverVisible.map && (
        <PropertiesMap
          location="portfolio"
          state={props.state}
          send={props.send}
          onAddrChange={(bbl: string) => {}}
          isVisible={viewType === "map"}
          addressPageRoutes={props.addressPageRoutes}
          locale={locale}
          logPortfolioAnalytics={logPortfolioAnalytics}
        />
      )}
    </div>
  );
};

const PropertiesList = withI18n()(PropertiesListWithoutI18n);

export default PropertiesList;
