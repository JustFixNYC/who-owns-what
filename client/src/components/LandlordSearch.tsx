import React, { useState } from "react";
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

const appId = process.env.REACT_APP_ALGOLIA_APP_ID;
const searchKey = process.env.REACT_APP_ALGOLIA_SEARCH_KEY;
const enableAnalytics = process.env.REACT_APP_ENABLE_ALGOLIA_ANALYTICS;

const ALGOLIA_INDEX_NAME = "wow_landlords";
const SEARCH_RESULTS_LIMIT = 5;

type SearchBoxProps = SearchBoxProvided & {
  /**
   * This function allows us to set the global search query state of the parent
   * `<LandlordSearch>` component from within this child `<SearchBox>` component
   */
  updateSearchQuery: React.Dispatch<React.SetStateAction<string>>;
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

const SearchHits = ({ hits }: SearchHitsProps) => {
  return hits && hits.length > 0 ? (
    <div className="geosuggest">
      <div className="geosuggest__suggests">
        {hits
          .map((hit: Hit) => (
            <Link
              key={hit.portfolio_bbl}
              to={createRouteForFullBbl(hit.portfolio_bbl)}
              className="geosuggest__item"
            >
              <div className="result__snippet">
                <Snippet attribute="landlord_names" hit={hit} tagName="u" />
              </div>
            </Link>
          ))
          .slice(0, SEARCH_RESULTS_LIMIT)}
      </div>
    </div>
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

  return appId && searchKey ? (
    <div className="AddressSearch">
      <InstantSearch searchClient={algoliasearch(appId, searchKey)} indexName={ALGOLIA_INDEX_NAME}>
        <CustomSearchBox updateSearchQuery={setQuery} />

        {(query || "").length > 0 && (
          <React.Fragment>
            <Configure
              attributesToSnippet={["landlord_names"]}
              analytics={enableAnalytics === "1" || false}
            />
            <CustomHits />
          </React.Fragment>
        )}
      </InstantSearch>

      {query && (
        <div className="search-by is-pulled-right">
          <img width="100" height="20" alt="Algolia" src={require("../assets/img/algolia.svg")} />
        </div>
      )}
    </div>
  ) : (
    <React.Fragment />
  );
};

export default LandlordSearch;
