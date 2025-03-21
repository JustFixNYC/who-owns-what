import React, { useState, useEffect } from "react";

import { LoadingPage } from "../components/Loader";
import APIClient from "../components/APIClient";
import { RouteComponentProps, useHistory } from "react-router";
import { createRouteForAddressPage } from "../routes";
import { AddrNotFoundPage } from "./NotFoundPage";
import { reportError } from "error-reporting";

export type BBLPageParams = {
  locale?: string;
  bbl: string;
};

type BBLPageProps = RouteComponentProps<BBLPageParams> & {
  useNewPortfolioMethod?: boolean;
};

export const isValidBblFormat = (bbl: string) => {
  return bbl.length === 10 && /^\d+$/.test(bbl);
};

const BBLPage: React.FC<BBLPageProps> = (props) => {
  const history = useHistory();
  const { locale, bbl } = props.match.params;
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    window.gtag("event", "bblLink");
    let isMounted = true;
    if (!isValidBblFormat(bbl)) {
      setIsNotFound(true);
    } else {
      APIClient.getBuildingInfo(bbl)
        .then((results) => {
          if (!isMounted) return;
          if (results.result.length === 0) {
            setIsNotFound(true);
            return;
          }
          const addressPageBase = createRouteForAddressPage(
            {
              ...results.result[0],
              locale,
            },
            !props.useNewPortfolioMethod
          );
          const addressPageFull = props.location.pathname.replace(/.*?bbl\/\d+/, addressPageBase);
          history.replace(addressPageFull);
        })
        .catch(reportError);

      return () => {
        isMounted = false;
      };
    }
  }, [bbl, history, locale, props.location.pathname, props.useNewPortfolioMethod]);

  return isNotFound ? <AddrNotFoundPage /> : <LoadingPage />;
};

export default BBLPage;
