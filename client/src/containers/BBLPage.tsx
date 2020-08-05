import React, { useState, useEffect } from "react";

import Loader from "../components/Loader";
import APIClient from "../components/APIClient";
import { RouteComponentProps, useHistory } from "react-router";
import { Trans } from "@lingui/macro";
import Page from "../components/Page";
import { createRouteForAddressPage } from "../routes";
import NotFoundPage from "./NotFoundPage";

// This will be *either* bbl *or* boro, block, and lot.
export type BBLPageParams = {
  bbl?: string;
  boro?: string;
  block?: string;
  lot?: string;
};

type BBLPageProps = RouteComponentProps<BBLPageParams>;

export const getFullBblFromPageParams = (params: BBLPageParams) => {
  var fullBBL: string;

  // handling for when url parameter is separated bbl
  if (params.bbl) {
    fullBBL = params.bbl;
  } else if (params.boro && params.block && params.lot) {
    fullBBL = params.boro + params.block.padStart(5, "0") + params.lot.padStart(4, "0");
  } else {
    throw new Error("Invalid params, expected either a BBL or boro/block/lot!");
  }
  return fullBBL;
};

const BBLPage: React.FC<BBLPageProps> = (props) => {
  const history = useHistory();
  const fullBBL = getFullBblFromPageParams(props.match.params);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    window.gtag("event", "bblLink");
    let isMounted = true;

    APIClient.getBuildingInfo(fullBBL)
      .then((results) => {
        if (!isMounted) return;
        if (results.result.length === 0) {
          setIsNotFound(true);
          return;
        }
        const addressPage = createRouteForAddressPage({
          boro: results.result[0].boro,
          housenumber: results.result[0].housenumber,
          streetname: results.result[0].streetname,
        });
        history.push(addressPage);
      })
      .catch((err) => {
        window.Rollbar.error("API error from BBL page: Building Info", err, fullBBL);
      });

    return () => {
      isMounted = false;
    };
  }, [fullBBL, history]);

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
