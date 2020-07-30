import React from "react";
import { Trans, t } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";
import Page from "components/Page";

const NotFoundPageWithoutI18n: React.FC<withI18nProps> = (props) => {
  const i18n = props.i18n;
  return (
    <Page title={i18n._(t`No address found`)}>
      <div className="NotRegisteredPage Page">
        <div className="HomePage__content">
          <div className="HomePage__search">
            <h5 className="mt-10 text-danger text-center text-bold text-large">
              <Trans>No address found</Trans>
            </h5>
          </div>
        </div>
      </div>
    </Page>
  );
};

const NotFoundPage = withI18n()(NotFoundPageWithoutI18n);

export default NotFoundPage;
