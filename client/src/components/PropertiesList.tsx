import { Trans } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";
import React from "react";
import { withMachineInStateProps } from "state-machine";
import "styles/PropertiesList.css";
import { defaultLocale, SupportedLocale } from "../i18n-base";
import Helpers from "../util/helpers";
import Loader from "./Loader";
import { PortfolioFilters } from "./PortfolioFilters";
import { MAX_TABLE_ROWS_PER_PAGE, PortfolioTable } from "./PortfolioTable";
import { AmplitudeEvent, EventProperties, logAmplitudeEvent } from "./Amplitude";

// Pattern for context provider to update context from child components
// https://stackoverflow.com/a/67710693/7051239

export type FilterNumberRange = { min: number; max: number };
export const NUMBER_RANGE_DEFAULT = { min: -Infinity, max: Infinity };

export type IFilterContext = {
  totalBuildings?: number | undefined;
  filteredBuildings?: number | undefined;
  filterSelections: {
    ownernames: string[];
    unitsres: FilterNumberRange[];
    zip: string[];
    rsunitslatest?: boolean;
  };
  filterOptions: {
    ownernames: string[];
    unitsres: FilterNumberRange;
    zip: string[];
  };
};

const useValue = () => {
  const defaultContext = {
    totalBuildings: undefined,
    filteredBuildings: undefined,
    filterSelections: {
      rsunitslatest: false,
      ownernames: [],
      unitsres: [NUMBER_RANGE_DEFAULT],
      zip: [],
    },
    filterOptions: {
      ownernames: [],
      unitsres: NUMBER_RANGE_DEFAULT,
      zip: [],
    },
  };
  const [filterContext, setFilterContext] = React.useState<IFilterContext>(defaultContext);

  return {
    filterContext,
    setFilterContext,
  };
};

export const FilterContext = React.createContext({} as ReturnType<typeof useValue>);

const FilterContextProvider: React.FC<{}> = (props) => {
  return <FilterContext.Provider value={useValue()}>{props.children}</FilterContext.Provider>;
};

export type LogPortfolioAnalytics = (
  event: AmplitudeEvent,
  extraProps: {
    column?: string;
    extraParams?: EventProperties;
    /** In case the corresponding event name for google isn't a straight case change from amplitude */
    gtmEvent?: string;
  }
) => void;

const PropertiesListWithoutI18n: React.FC<
  withMachineInStateProps<"portfolioFound"> & withI18nProps
> = (props) => {
  const { i18n } = props;
  const { width: windowWidth, height: windowHeight } = Helpers.useWindowSize();
  const locale = (i18n.language as SupportedLocale) || defaultLocale;
  const useNewPortfolioMethod = props.state.context.useNewPortfolioMethod || false;

  const addrs = props.state.context.portfolioData.assocAddrs;
  const rsunitslatestyear = props.state.context.portfolioData.searchAddr.rsunitslatestyear;

  const logPortfolioAnalytics: LogPortfolioAnalytics = (event, extraProps) => {
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

  /**
   * For older browsers that do not support the `useOnScreen` hook,
   * let's hide the dynamic scroll fade by default.
   */
  const isOlderBrowser = typeof IntersectionObserver === "undefined";

  const tableRef = React.useRef<HTMLDivElement>(null);
  const isTableVisible = Helpers.useOnScreen(tableRef);

  // On most browsers, the header has the `position: fixed` CSS property
  // and needs a defined `top` property along with it.
  // So, let's keep track of and also update this top spacing whenever the layout of the page changes.
  const [headerTopSpacing, setHeaderTopSpacing] = React.useState<number | undefined>();

  // TODO: double check how this works with new v8 table
  // Make sure to setHeaderTopSpacing whenever
  // - the table comes into view
  // - the page's locale changes
  // - the user resizes their viewport window
  //
  // For older browsers, let's not even bother setting the top spacing as
  // we won't be able to detect when the table becomes visible. Luckily,
  // the `react-table-hoc-fixed-columns` packages has fallback CSS for these browsers.
  React.useEffect(() => {
    if (!isOlderBrowser && tableRef?.current?.offsetTop)
      setHeaderTopSpacing(tableRef.current.offsetTop);
  }, [isTableVisible, locale, windowWidth, windowHeight, isOlderBrowser]);
  return (
    <div className="PropertiesList" ref={tableRef}>
      {isTableVisible ? (
        <FilterContextProvider>
          {useNewPortfolioMethod ? (
            <PortfolioFilters logPortfolioAnalytics={logPortfolioAnalytics} />
          ) : (
            <></>
          )}
          <PortfolioTable
            data={addrs}
            headerTopSpacing={headerTopSpacing}
            locale={locale}
            rsunitslatestyear={rsunitslatestyear}
            getRowCanExpand={() => true}
            logPortfolioAnalytics={logPortfolioAnalytics}
          />
        </FilterContextProvider>
      ) : (
        <Loader loading={true} classNames="Loader-map">
          {addrs.length > MAX_TABLE_ROWS_PER_PAGE ? (
            <>
              <Trans>Loading {addrs.length} rows</Trans>
              <br />
              <Trans>(this may take a while)</Trans>
            </>
          ) : (
            <Trans>Loading</Trans>
          )}
        </Loader>
      )}
    </div>
  );
};

const PropertiesList = withI18n()(PropertiesListWithoutI18n);

export default PropertiesList;
