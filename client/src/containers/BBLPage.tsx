import React, { Component } from "react";

import { LocaleRedirect as Redirect } from "../i18n";
import Loader from "../components/Loader";
import APIClient from "../components/APIClient";
import NotRegisteredPage from "./NotRegisteredPage";
import { RouteComponentProps } from "react-router";
import { Trans } from "@lingui/macro";
import Page from "../components/Page";
import { BuildingInfoResults, SearchResults } from "../components/APIDataTypes";

// import 'styles/HomePage.css';

// This will be *either* bbl *or* boro, block, and lot.
type BBLPageParams = {
  bbl?: string;
  boro?: string;
  block?: string;
  lot?: string;
};

type BBLPageProps = RouteComponentProps<BBLPageParams>;

type Addr = {
  bbl?: string;
  boro: string | null;
  housenumber: string | null;
  streetname: string | null;
};

type State = {
  searchBBL: BBLPageParams;
  results: { addrs: Addr[] } | null;
  bblExists: null | boolean;
  foundAddress: Addr;
};

export default class BBLPage extends Component<BBLPageProps, State> {
  constructor(props: BBLPageProps) {
    super(props);

    this.state = {
      searchBBL: { ...props.match.params },
      results: null,
      bblExists: null,
      foundAddress: {
        boro: null,
        housenumber: null,
        streetname: null,
      },
    };
  }

  componentDidMount() {
    window.gtag("event", "direct-link");

    var fullBBL: string;

    // handling for when url parameter is full bbl
    if (this.state.searchBBL.bbl) {
      fullBBL = this.state.searchBBL.bbl;

      this.setState({
        searchBBL: {
          boro: fullBBL.slice(0, 1),
          block: fullBBL.slice(1, 6),
          lot: fullBBL.slice(6, 10),
        },
      });
    } else if (
      this.state.searchBBL.boro &&
      this.state.searchBBL.block &&
      this.state.searchBBL.lot
    ) {
      const searchBBL = {
        boro: this.state.searchBBL.boro,
        block: this.state.searchBBL.block.padStart(5, "0"),
        lot: this.state.searchBBL.lot.padStart(4, "0"),
      };

      fullBBL = searchBBL.boro + searchBBL.block + searchBBL.lot;

      this.setState({
        searchBBL: searchBBL,
      });
    } else {
      throw new Error("Invalid params, expected either a BBL or boro/block/lot!");
    }

    APIClient.getBuildingInfo(fullBBL)
      .then((results: BuildingInfoResults) => {
        if (!(results.result && results.result.length > 0)) {
          this.setState({
            bblExists: false,
          });
        } else {
          this.setState({
            bblExists: true,
            foundAddress: {
              boro: results.result[0].boro,
              housenumber: results.result[0].housenumber,
              streetname: results.result[0].streetname,
            },
          });
        }
      })
      .catch((err: any) => {
        window.Rollbar.error("API error from BBL page: Building Info", err, fullBBL);
      });
  }

  componentDidUpdate(prevProps: BBLPageProps, prevState: State) {
    if (!prevState.bblExists && this.state.bblExists) {
      APIClient.searchBBL(this.strictGetSearchBBL())
        .then((results: SearchResults) => {
          this.setState({
            results: results,
          });
        })
        .catch((err: any) => {
          window.Rollbar.error("API error from BBL page: Search BBL", err, this.state.searchBBL);
          this.setState({
            results: { addrs: [] },
          });
        });
    }
  }

  strictGetSearchBBL() {
    const { boro, block, lot } = this.state.searchBBL;
    if (!(boro && block && lot)) {
      throw new Error(`boro, block, and lot must be non-empty!`);
    }
    return { boro, block, lot };
  }

  render() {
    if (this.state.bblExists === false) {
      window.gtag("event", "search-notfound");
      return <NotRegisteredPage />;
    }

    // If searched and got results,
    else if (this.state.bblExists && this.state.results && this.state.results.addrs) {
      // redirect doesn't like `this` so lets make a ref
      const results = this.state.results;

      // if(geosearch) {
      //   searchAddress.housenumber = geosearch.giLowHouseNumber1;
      //   searchAddress.streetname = geosearch.giStreetName1;
      //   searchAddress.boro = geosearch.firstBoroughName;
      // }

      var addressForURL: Addr;

      if (results.addrs.length > 0) {
        window.gtag("event", "search-found", {
          value: this.state.results.addrs.length,
        });
        const searchBBL = this.strictGetSearchBBL();
        const foundAddr = this.state.results.addrs.find(
          (element) => element.bbl === searchBBL.boro + searchBBL.block + searchBBL.lot
        );
        if (!foundAddr) {
          throw new Error("BBL not found in results!");
        }
        addressForURL = foundAddr;
      } else {
        window.gtag("event", "search-notfound");
        addressForURL = this.state.foundAddress;
      }

      //= this.state.results.addrs.find( (element) => (element.bbl === this.state.searchBBL.boro + this.state.searchBBL.block + this.state.searchBBL.lot));
      return (
        <Redirect
          to={{
            pathname:
              `/address/` +
              addressForURL.boro +
              `/` +
              (addressForURL.housenumber ? addressForURL.housenumber : ` `) +
              `/` +
              addressForURL.streetname,
            state: { results },
          }}
        ></Redirect>
      );
    }

    return (
      <Page>
        <div className="Page HomePage">
          <div className="HomePage__content">
            <div className="HomePage__search">
              <Loader classNames="Loader--centered" loading={true}>
                <Trans>Searching</Trans>
              </Loader>
            </div>
          </div>
        </div>
      </Page>
    );
  }
}
