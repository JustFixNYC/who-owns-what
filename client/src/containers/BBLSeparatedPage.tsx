import React, { useState, useEffect } from "react";

import { LoadingPage } from "../components/Loader";
import APIClient from "../components/APIClient";
import { RouteComponentProps, useHistory } from "react-router";
import { createRouteForAddressPage } from "../routes";
import { AddrNotFoundPage } from "./NotFoundPage";
import { reportError } from "error-reporting";
import { isValidBblFormat } from "./BBLPage";

export type BBLSeparatedPageParams = {
  locale?: string;
  boro: string;
  block: string;
  lot: string;
};

type BBLPageProps = RouteComponentProps<BBLSeparatedPageParams> & {
  useNewPortfolioMethod?: boolean;
};

export const getFullBblFromPageParams = (params: BBLSeparatedPageParams) => {
  if (params.boro && params.block && params.lot) {
    return params.boro + params.block.padStart(5, "0") + params.lot.padStart(4, "0");
  }
  throw new Error("Invalid params, expected boro/block/lot!");
};

const BBLSeparatedPage: React.FC<BBLPageProps> = (props) => {
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
            !props.useNewPortfolioMethod
          );
          history.replace(addressPage);
        })
        .catch(reportError);

      return () => {
        isMounted = false;
      };
    }
  }, [fullBBL, history, locale, props.location.pathname, props.useNewPortfolioMethod]);

  return isNotFound ? <AddrNotFoundPage /> : <LoadingPage />;
};

export default BBLSeparatedPage;
