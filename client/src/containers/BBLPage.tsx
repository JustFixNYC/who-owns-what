import React, { useState, useEffect } from "react";

import Loader from "../components/Loader";
import APIClient from "../components/APIClient";
import { RouteComponentProps, useHistory } from "react-router";
import { Trans } from "@lingui/macro";
import Page from "../components/Page";
import { createRouteForAddressPage } from "../routes";
import { makeEmptySearchAddress } from "../components/AddressSearch";
import { SearchAddressWithoutBbl } from "../components/APIDataTypes";
import NotFoundPage from "./NotFoundPage";

// This will be *either* bbl *or* boro, block, and lot.
type BBLPageParams = {
  bbl?: string;
  boro?: string;
  block?: string;
  lot?: string;
};

type BBLPageProps = RouteComponentProps<BBLPageParams>;

const BBLPage: React.FC<BBLPageProps> = (props) => {
  const history = useHistory();
  const params = props.match.params;
  const [isNotFound, setIsNotFound] = useState(false);

  var fullBBL: string;
  var searchAddress: SearchAddressWithoutBbl = makeEmptySearchAddress();

  // handling for when url parameter is separated bbl
  if (params.bbl) {
    fullBBL = params.bbl;
  } else if (params.boro && params.block && params.lot) {
    fullBBL = params.boro + params.block.padStart(5, "0") + params.lot.padStart(4, "0");
  } else {
    throw new Error("Invalid params, expected either a BBL or boro/block/lot!");
  }

  useEffect(() => {
    let isMounted = true;

    APIClient.getBuildingInfo(fullBBL)
      .then((results) => {
        if (!isMounted) return;
        if (results.result.length === 0) {
          setIsNotFound(true);
          return;
        }
        searchAddress = {
          boro: results.result[0].boro,
          housenumber: results.result[0].housenumber,
          streetname: results.result[0].streetname,
        };
        const addressPage = createRouteForAddressPage(searchAddress);
        history.push(addressPage);
      })
      .catch((err) => {
        window.Rollbar.error("API error from BBL page: Building Info", err, fullBBL);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return isNotFound ? (
    <NotFoundPage />
  ) : (
    <Page>
      <Loader loading={true} classNames="Loader-map">
        <Trans>Loading</Trans>
      </Loader>
    </Page>
  );
};

export default BBLPage;
