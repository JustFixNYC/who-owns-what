import React, { useState } from "react";
import algoliasearch from "algoliasearch/lite";
import {
  InstantSearch,
  Configure,
  Snippet,
  connectSearchBox,
  connectHits,
  Hits,
} from "react-instantsearch-dom";
import { SearchBoxExposed, SearchBoxProvided } from "react-instantsearch-core";
import { I18n } from "@lingui/react";
import { t, Trans } from "@lingui/macro";
import { Link } from "react-router-dom";
import { createRouteForFullBbl } from "routes";

const appId = process.env.REACT_APP_ALGOLIA_APP_ID;
const searchKey = process.env.REACT_APP_ALGOLIA_SEARCH_KEY;
const enableAnalytics = process.env.REACT_APP_ENABLE_ALGOLIA_ANALYTICS;

const ALGOLIA_INDEX_NAME = "wow_landlords";
const SEARCH_RESULTS_LIMIT = 5;

const SearchBox = ({ currentRefinement, refine, updateSearchQuery }: any) => (
  <I18n>
    {({ i18n }) => (
      <form
        className="control"
        noValidate
        action=""
        role="search"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          className="input is-primary is-size-5"
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
    <div className="dropdown-content">
      {hits
        .map((hit: Hit) => (
          <Link
            key={hit.portfolio_bbl}
            to={createRouteForFullBbl(hit.portfolio_bbl)}
            className="dropdown-item"
          >
            <div className="result__snippet">
              <Snippet attribute="landlord_names" hit={hit} tagName="u" />
            </div>
          </Link>
        ))
        .slice(0, SEARCH_RESULTS_LIMIT)}
    </div>
  ) : (
    <div className="label">
      <br />
      <Trans>No landlords match your search.</Trans>
    </div>
  );
};

/* 
NOTE: We are including a type assertion here because the official type definition 
of connectSearchBox does not allow us to pass additional props from the 
input component (SearchBox) to the output component (CustomSearchBox) */

const CustomSearchBox = connectSearchBox(SearchBox) as React.ComponentClass<SearchBoxExposed & any>;
const CustomHits = connectHits(SearchHits) as React.ComponentClass<Hits & any>;

const LandlordSearch = () => {
  const [query, setQuery] = useState("");

  return appId && searchKey ? (
    <div className="search-bar">
      <InstantSearch
        searchClient={algoliasearch(appId, searchKey)}
        indexName={ALGOLIA_INDEX_NAME}
        resultsState={[]}
      >
        <CustomSearchBox updateSearchQuery={(e: any) => setQuery(e)} />

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
