import React from "react";

import "styles/FeatureCalloutWidget.scss";
import FocusTrap from "focus-trap-react";
import { withI18n, withI18nProps } from "@lingui/react";
import { getFeatureCalloutContent } from "./FeatureCalloutContent";
import { useState } from "react";
import { t } from "@lingui/macro";

const FeatureCalloutWidget = withI18n()((props: withI18nProps) => {
  const [widgetToggled, setWidgetVisibility] = useState(true);
  const toggleWidget = () => setWidgetVisibility(!widgetToggled);

  const [entryIndex, setEntryIndex] = useState(0);

  const { i18n } = props;

  const content = getFeatureCalloutContent();
  const numberOfEntries = content.length;

  let goToNextEntry = () => {
    entryIndex === numberOfEntries - 1 ? setEntryIndex(0) : setEntryIndex(entryIndex + 1);
  };

  let goToPrevEntry = () => {
    entryIndex === 0 ? setEntryIndex(numberOfEntries - 1) : setEntryIndex(entryIndex - 1);
  };

  //All entries in the widget will have this format: index, title, image, and description
  let widgetEntries = content.map((entry, i) => {
    const indexLabel = i18n._(t`${i + 1} of ${numberOfEntries}`);
    const entryTitle = i18n._(entry.title);
    return (
      <div
        className="widget-entry"
        id={"page-" + entryTitle}
        role="region"
        aria-labelledby={"widget-" + entryTitle + "-id"}
      >
        <p className="widget-entry-title-container">
          <span className="widget-entry-index" aria-describedby={indexLabel}>
            {indexLabel}
          </span>
          <span
            className="widget-entry-title"
            aria-describedby={"widget-entry title- " + entryTitle}
          >
            {entryTitle}
          </span>
        </p>
        <img className="widget-entry-image" src={entry.img} alt={""}></img>
        <p className="widget-entry-description">{i18n._(entry.description)}</p>
      </div>
    );
  });

  //Prev/next buttons
  let navButtons = (
    <div className="widget-nav-buttons-container">
      <button
        className="widget-button-nav prev focusable"
        tabIndex={0}
        onClick={(event) => {
          event.preventDefault();
          return goToPrevEntry();
        }}
      >
        <span className="material-icons md-14 widget-prev-next-icon">navigate_before</span>
        <span className="widget-prev-text">Prev</span>
      </button>
      <button
        className="widget-button-nav next focusable"
        tabIndex={0}
        onClick={(event) => {
          event.preventDefault();
          return goToNextEntry();
        }}
      >
        <span className="widget-next-text">{i18n._(t`Next`)}</span>
        <span className="material-icons md-14 widget-prev-next-icon">navigate_next</span>
      </button>
    </div>
  );

  return (
    <div className="FeatureCalloutWidget">
      <div className="widget-triangle-info-button-container">
        <button
          className="widget-button-info focusable material-icons md-13"
          tabIndex={0}
          onClick={toggleWidget}
        >
          info
        </button>
        {widgetToggled && <div className="widget-tooltip-triangle" />}
      </div>
      {widgetToggled && (
        <FocusTrap
          focusTrapOptions={{
            clickOutsideDeactivates: true,
            returnFocusOnDeactivate: false,
            onDeactivate: () => setWidgetVisibility(false),
          }}
        >
          <div className="widget-container" id="widget">
            <div className="widget-header">
              <span className="widget-title focusable" role="heading" tabIndex={0}>
                {i18n._(t`What's New`)}
              </span>
              <button
                type="button"
                className="widget-button-cancel material-icons md-18 focusable"
                tabIndex={0}
                onClick={toggleWidget}
              >
                close
              </button>
            </div>
            <div className="widget-content-container" id="widget-entries">
              {widgetEntries[entryIndex]}
              {navButtons}
            </div>
          </div>
        </FocusTrap>
      )}
    </div>
  );
});

export default FeatureCalloutWidget;
