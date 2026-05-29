import React, { useMemo, useState } from "react";
import { Trans, t } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";

import Page from "components/Page";
import "styles/WorstEvictorsMapPage.css";
import topEvictorsData from "data/worst-evictors-top10-2025.json";

const CITYWIDE_MAP_URL =
  "https://clausa.app.carto.com/map/5246df20-c40f-4d1c-8449-11b969fb4314";

type WorstEvictorRecord = {
  rank: number;
  sourceRank: number;
  llName: string;
  totalEvictions2025: number;
  totalUnitsres: number;
  totalFilings2025: number;
  pctRs: number;
  countAssociatedBbls: number;
  countAssociatedLlNames: number;
};

const numberFormatter = new Intl.NumberFormat("en-US");

const WorstEvictorsMapPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const [mapLoaded, setMapLoaded] = useState(false);
  const rows = useMemo(() => topEvictorsData as WorstEvictorRecord[], []);

  return (
    <Page title={i18n._(t`Worst evictors map`)}>
      <div className="WorstEvictorsMapPage Page">
        <div className="worst-evictors-map-page__header">
          <h2>
            <Trans>Top 10 Worst Evictors in 2025</Trans>
          </h2>
          <p>
            <Trans>
              This map mirrors the legacy citywide portfolio map display and lists the top 10
              unique portfolios from the 2025 analysis.
            </Trans>
          </p>
        </div>

        <div className="worst-evictors-map-page__content">
          <div className="worst-evictors-map-page__map-wrapper">
            {!mapLoaded && (
              <div className="worst-evictors-map-page__map-loading">
                <Trans>Loading map...</Trans>
              </div>
            )}
            <iframe
              title={i18n._(t`Worst evictors citywide map`)}
              className="worst-evictors-map-page__map"
              frameBorder="0"
              src={CITYWIDE_MAP_URL}
              onLoad={() => setMapLoaded(true)}
            />
          </div>

          <div className="worst-evictors-map-page__sidebar">
            <h3>
              <Trans>Top 10 portfolios</Trans>
            </h3>
            <ul className="worst-evictors-map-page__list">
              {rows.map((row) => (
                <li key={row.rank} className="worst-evictors-map-page__list-item">
                  <div className="worst-evictors-map-page__list-title">
                    {row.rank}. {row.llName}
                  </div>
                  <div className="worst-evictors-map-page__list-stats">
                    <Trans>
                      {numberFormatter.format(row.totalEvictions2025)} executed evictions
                    </Trans>
                  </div>
                  <div className="worst-evictors-map-page__list-stats">
                    <Trans>
                      {numberFormatter.format(row.countAssociatedBbls)} associated buildings
                    </Trans>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Page>
  );
});

export default WorstEvictorsMapPage;
