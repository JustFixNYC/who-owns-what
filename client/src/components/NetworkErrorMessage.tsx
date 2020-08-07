import React from "react";
import { ErrorPageScaffolding } from "containers/NotFoundPage";
import { Trans } from "@lingui/react";

export const NetworkErrorMessage: React.FC<{}> = () => (
  <ErrorPageScaffolding>
    <Trans>Oops! A network error occurred. Try again later.</Trans>
  </ErrorPageScaffolding>
);
