import React from "react";
import LegalFooter from "../components/LegalFooter";
import EngagementPanel from "../components/EngagementPanel";
import en from "../data/about.en.json";
import es from "../data/about.es.json";

import "styles/AboutPage.css";
import { ContentfulPage } from "../contentful/ContentfulPage";
import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { t } from "@lingui/macro";

import Login from "../components/Login";
import AuthClient from "../components/AuthClient";

const AboutPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const [userEmail, setUserEmail] = React.useState(AuthClient.getUserEmail());

  return (
    <Page title={i18n._(t`About`)}>
      <div className="AboutPage Page">
        {!userEmail ? (
          <Login onSuccess={setUserEmail} />
        ) : (
          <>
            <div>{`Welcome ${userEmail}`}</div>
            <button
              onClick={() => {
                AuthClient.logout();
                setUserEmail(AuthClient.getUserEmail());
              }}
            >
              Log out
            </button>
          </>
        )}
        <div className="Page__content">
          <ContentfulPage locales={{ en, es }} />
        </div>
        <EngagementPanel location="about-page" />
        <LegalFooter />
      </div>
    </Page>
  );
});

export default AboutPage;
