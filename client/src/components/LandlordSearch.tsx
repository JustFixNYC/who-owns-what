import React, { useState, useContext, useEffect } from "react";
import algoliasearch from "algoliasearch/lite";
import {
  InstantSearch,
  Configure,
  Snippet,
  connectSearchBox,
  connectHits,
} from "react-instantsearch-dom";
import { SearchBoxProvided } from "react-instantsearch-core";
import { I18n } from "@lingui/react";
import { t, Trans } from "@lingui/macro";
import { Link } from "react-router-dom";
import { createRouteForFullBbl } from "routes";
import classnames from "classnames";

import "../styles/LandlordSearch.css";
import FocusTrap from "focus-trap-react";

export const algoliaAppId = process.env.REACT_APP_ALGOLIA_APP_ID;
export const algoliaSearchKey = process.env.REACT_APP_ALGOLIA_SEARCH_KEY;

const enableAnalytics = process.env.REACT_APP_ENABLE_ALGOLIA_ANALYTICS;

const ALGOLIA_INDEX_NAME = "wow_landlords";
const SEARCH_RESULTS_LIMIT = 5;

type SearchBoxProps = SearchBoxProvided & {
  /**
   * This function allows us to set the global search query state of the parent
   * `<LandlordSearch>` component from within this child `<SearchBox>` component
   */
  updateSearchQuery: (q: string) => void;
};

const SearchBox = ({ currentRefinement, refine, updateSearchQuery }: SearchBoxProps) => (
  <I18n>
    {({ i18n }) => (
      <form noValidate action="" role="search">
        <input
          className="form-input"
          type="search"
          placeholder={i18n._(t`Search landlords`)}
          value={currentRefinement}
          onChange={(event) => {
            refine(event.currentTarget.value);
            updateSearchQuery(event.currentTarget.value);
          }}
        />
      </form>
    )}
  </I18n>
);

type Hit = {
  landlord_names: string;
  portfolio_bbl: string;
};

type SearchHitsProps = {
  hits?: Hit[];
};

const NumberOfHitsContext = React.createContext({
  numberOfHits: 0,
  setNumberOfHits: (n: number) => {},
});

const SearchHits = ({ hits }: SearchHitsProps) => {
  const numberOfHits = hits ? hits.length : 0;
  const { setNumberOfHits } = useContext(NumberOfHitsContext);

  useEffect(() => {
    setNumberOfHits(Math.min(numberOfHits, SEARCH_RESULTS_LIMIT));
  }, [numberOfHits, setNumberOfHits]);

  return hits && numberOfHits > 0 ? (
    <I18n>
      {({ i18n }) => (
        <div className="algolia__suggests">
          {hits
            .map((hit: Hit) => (
              <Link
                key={hit.portfolio_bbl}
                to={createRouteForFullBbl(hit.portfolio_bbl, i18n.language, true)}
                className="algolia__item"
                aria-hidden="true"
              >
                <div className="result__snippet">
                  <Snippet attribute="landlord_names" hit={hit} tagName="b" />
                </div>
              </Link>
            ))
            .slice(0, SEARCH_RESULTS_LIMIT)}
        </div>
      )}
    </I18n>
  ) : (
    <div className="label">
      <br />
      <Trans>No landlords match your search.</Trans>
    </div>
  );
};

const CustomSearchBox = connectSearchBox(SearchBox);
const CustomHits = connectHits(SearchHits);

const LandlordSearch = () => {
  const [query, setQuery] = useState("");
  const [numberOfHits, setNumberOfHits] = useState(0);
  const [searchIsInFocus, setSearchFocus] = useState(true);
  const updateSearchQuery = (newQuery: string) => {
    // Whenever the user changes their search query,
    // let's make our search bar in focus.
    setSearchFocus(true);
    setQuery(newQuery);
  };

  /**
   * We infer that the user is currently utilizing the search bar when:
   * - the search bar is in focus
   * - they have typed in at least one character into the search bar
   */
  const userIsCurrentlySearching = searchIsInFocus && query.length > 0;

  return algoliaAppId && algoliaSearchKey ? (
    <FocusTrap
      active={userIsCurrentlySearching}
      focusTrapOptions={{
        clickOutsideDeactivates: true,
        returnFocusOnDeactivate: false,
        onDeactivate: () => setSearchFocus(false),
      }}
    >
      <div
        className="LandlordSearch"
        onFocus={() => setSearchFocus(true)}
        onClick={() => setSearchFocus(true)}
      >
        <InstantSearch
          searchClient={algoliasearch(algoliaAppId, algoliaSearchKey)}
          indexName={ALGOLIA_INDEX_NAME}
        >
          <CustomSearchBox updateSearchQuery={updateSearchQuery} />

          {/* Let's hide the search results when the user is not currently searching a name here */}
          <div
            className={classnames(!userIsCurrentlySearching && "d-hide")}
            role="region"
            aria-live="polite"
            aria-atomic={true}
          >
            <Configure
              attributesToSnippet={["landlord_names"]}
              analytics={enableAnalytics === "1" || false}
            />
            <NumberOfHitsContext.Provider value={{ numberOfHits, setNumberOfHits }}>
              <CustomHits />
            </NumberOfHitsContext.Provider>
            <p className="text-assistive">
              <Trans>{numberOfHits} search results.</Trans>{" "}
              {numberOfHits > 0 ? (
                <Trans>Use the tab key to navigate. Press enter key to select.</Trans>
              ) : (
                <Trans>Use the escape key to quit searching.</Trans>
              )}
            </p>
          </div>
        </InstantSearch>

        <div
          className={classnames(
            "search-by",
            "is-pulled-right",
            !userIsCurrentlySearching && "d-hide"
          )}
        >
          <img width="140" height="20" alt="Algolia" src={require("../assets/img/algolia.svg")} />
        </div>
      </div>
    </FocusTrap>
  ) : (
    <React.Fragment />
  );
};

export default LandlordSearch;
