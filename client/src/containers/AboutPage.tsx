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
import browser from "util/browser";

import { SliderButton } from "@typeform/embed-react";


const AboutPage = withI18n()((props: withI18nProps) => {
  const surveyEncountered = browser.getCookieValue(browser.WOAU_COOKIE_NAME);
  const { i18n } = props;
  return (
    <Page title={i18n._(t`About`)}>
      <div className="AboutPage Page">
        <div className="Page__content">
          <ContentfulPage locales={{ en, es }} />
        </div>
        <SliderButton
            id="ISlk1i96"
            // autoClose={1}
            redirectTarget="_self"
            open={surveyEncountered ? undefined : "time"}
            openValue={surveyEncountered ? undefined : 2000}
            // hidden={{ bbl: detailAddr.bbl }}
            className="btn-popup"
            onClose={() => browser.setCookie(browser.WOAU_COOKIE_NAME, "1", 30)}
          >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 0H0V9L10.5743 24V16.5H21C22.6567 16.5 24 15.1567 24 13.5V3C24 1.34325 22.6567 0 21 0ZM7.5 9.75C6.672 9.75 6 9.07875 6 8.25C6 7.42125 6.672 6.75 7.5 6.75C8.328 6.75 9 7.42125 9 8.25C9 9.07875 8.328 9.75 7.5 9.75ZM12.75 9.75C11.922 9.75 11.25 9.07875 11.25 8.25C11.25 7.42125 11.922 6.75 12.75 6.75C13.578 6.75 14.25 7.42125 14.25 8.25C14.25 9.07875 13.578 9.75 12.75 9.75ZM18 9.75C17.172 9.75 16.5 9.07875 16.5 8.25C16.5 7.42125 17.172 6.75 18 6.75C18.828 6.75 19.5 7.42125 19.5 8.25C19.5 9.07875 18.828 9.75 18 9.75Z" fill="#FFFFFF"></path>
          </svg>
          Take Survey
        </SliderButton>
        <EngagementPanel location="about-page" />
        <LegalFooter />
      </div>
    </Page>
  );
});

export default AboutPage;
