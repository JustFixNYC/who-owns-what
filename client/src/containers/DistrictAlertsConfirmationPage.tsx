import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";

import StandalonePage from "components/StandalonePage";
import { JFCLLocaleLink } from "i18n";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { Icon } from "@justfixnyc/component-library";
import "styles/DistrictAlertsConfirmationPage.css";
import "styles/DistrictAlertsPage.css";

const VerifyEmailPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const { areaAlerts } = createWhoOwnsWhatRoutePaths();

  const successPage = () => (
    <>
      <Trans render="div" className="success-message">
        <Icon icon="check" />
        <span>Success</span>
      </Trans>
      <Trans render="h1">Your selections have been saved.</Trans>

      <Trans render="h2">
        We will send your first Area Alert email on Monday morning. It will include data on HPD &
        DOB complaints and violations, eviction filings, litigations, vacate orders, and building
        sales for the areas you selected.
      </Trans>

      <Trans render="h2">
        <JFCLLocaleLink to={areaAlerts}>{"< Back to area selection"}</JFCLLocaleLink>
      </Trans>
    </>
  );

  return (
    <StandalonePage
      title={i18n._(t`Area Alert Subscription Confirmation`)}
      id="DistrictAlertsConfirmationPage"
    >
      {successPage()}
    </StandalonePage>
  );
});

export default VerifyEmailPage;
