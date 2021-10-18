import React, { useState, useEffect } from "react";

import Loader from "../components/Loader";
import APIClient from "../components/APIClient";
import { RouteComponentProps, useHistory } from "react-router";
import { Trans } from "@lingui/macro";
import Page from "../components/Page";
import { createRouteForAddressPage } from "../routes";
import { AddrNotFoundPage } from "./NotFoundPage";
import { reportError } from "error-reporting";

// This will be *either* bbl *or* boro, block, and lot.
export type BBLPageParams = {
  locale?: string;
  bbl?: string;
  boro?: string;
  block?: string;
  lot?: string;
};

type BBLPageProps = RouteComponentProps<BBLPageParams> & {
  useNewPortfolioMethod?: boolean;
};

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

export const isValidBblFormat = (bbl: string) => {
  return bbl.length === 10 && /^\d+$/.test(bbl);
};

const BBLPage: React.FC<BBLPageProps> = (props) => {
  const history = useHistory();
  const { locale } = props.match.params;
  const fullBBL = getFullBblFromPageParams(props.match.params);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    window.gtag("event", "bblLink");
    let isMounted = true;
    if (!isValidBblFormat(fullBBL)) {
      setIsNotFound(true);
    } else {
      APIClient.getBuildingInfo(fullBBL)
        .then((results) => {
          if (!isMounted) return;
          if (results.result.length === 0) {
            setIsNotFound(true);
            return;
          }
          const addressPage = createRouteForAddressPage(
            {
              ...results.result[0],
              locale,
            },
            props.useNewPortfolioMethod
          );
          history.replace(addressPage);
        })
        .catch(reportError);

      return () => {
        isMounted = false;
      };
    }
  }, [fullBBL, history, locale, props.useNewPortfolioMethod]);

  return isNotFound ? (
    <AddrNotFoundPage />
  ) : (
    <Page>
      <Loader loading={true} classNames="Loader-map">
        <Trans>Loading</Trans>
      </Loader>
    </Page>
  );
};

export default BBLPage;
