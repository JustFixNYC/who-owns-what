import { I18n } from "@lingui/core";
import { Trans } from "@lingui/macro";
import { withI18n } from "@lingui/react";
import React from "react";
import { withMachineInStateProps } from "state-machine";
import "styles/PropertiesList.css";
import { defaultLocale, SupportedLocale } from "../i18n-base";
import Helpers from "../util/helpers";
import Loader from "./Loader";
import { PortfolioFilters } from "./PortfolioFilters";
import { MAX_TABLE_ROWS_PER_PAGE, PortfolioTable } from "./PortfolioTable";

// Pattern for context provider to update context from child components
// https://stackoverflow.com/a/67710693/7051239

export type FilterNumberRange = [number | undefined, number | undefined] | undefined[];
export const MINMAX_DEFAULT = [undefined, undefined];

type FilterValues = {
  ownernames: string[];
  unitsres: FilterNumberRange;
  zip: string[];
};

export type IFilterContext = {
  totalBuildings?: number | undefined;
  filteredBuildings?: number | undefined;
  filterSelections: FilterValues & { rsunitslatest?: boolean };
  filterOptions: FilterValues;
};

const useValue = () => {
  const defaultContext = {
    totalBuildings: undefined,
    filteredBuildings: undefined,
    filterSelections: {
      rsunitslatest: false,
      ownernames: [],
      unitsres: MINMAX_DEFAULT,
      zip: [],
    },
    filterOptions: {
      ownernames: [],
      unitsres: MINMAX_DEFAULT,
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

const PropertiesListWithoutI18n: React.FC<
  withMachineInStateProps<"portfolioFound"> & {
    i18n: I18n;
  }
> = (props) => {
  const { i18n } = props;
  const { width: windowWidth, height: windowHeight } = Helpers.useWindowSize();
  const locale = (i18n.language as SupportedLocale) || defaultLocale;
  const useNewPortfolioMethod = props.state.context.useNewPortfolioMethod || false;

  const addrs = props.state.context.portfolioData.assocAddrs;
  const rsunitslatestyear = props.state.context.portfolioData.searchAddr.rsunitslatestyear;

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

  // The possible options for filter UI component selections
  // const [filterOptions, setFilterOptions] = useState<FilterOptions>();
  // const [buildingCounts, setBuildingCounts] = useState<BuildingCounts>();

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
          {useNewPortfolioMethod ? <PortfolioFilters i18n={i18n} /> : <></>}
          <PortfolioTable
            data={addrs}
            headerTopSpacing={headerTopSpacing}
            i18n={i18n}
            locale={locale}
            rsunitslatestyear={rsunitslatestyear}
            getRowCanExpand={() => true}
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
