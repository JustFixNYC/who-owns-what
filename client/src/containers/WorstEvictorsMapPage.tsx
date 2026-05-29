import React, { useMemo, useState } from "react";
import { Trans, t } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";
import ReactMapboxGl, { Feature, Layer, ZoomControl } from "react-mapbox-gl";
import Select, { SingleValue } from "react-select";

import Page from "components/Page";
import "styles/WorstEvictorsMapPage.css";
import hardcodedRows from "data/worst-evictors-2025-hardcoded.json";
import hardcodedMapPoints from "data/worst-evictors-2025-map-points-hardcoded.json";

/* eslint-disable react/style-prop-object */

const DEFAULT_FIT_BOUNDS: [[number, number], [number, number]] = [
  [-74.259087, 40.477398],
  [-73.700172, 40.917576],
];

const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || "";

const MAP = ReactMapboxGl({
  accessToken: MAPBOX_ACCESS_TOKEN,
});

const MAP_STYLE = "mapbox://styles/justfix/ckhevcljr02jg19l3jtw9h9w6";

type WorstEvictorListRow = {
  citywide_rank: number;
  ll_name: string;
  ll_slug: string;
  total_evictions_2025: number;
  total_filings_2025: number;
  total_hpd_violations_bc_2025: number;
  total_hpd_complaints_2025: number;
  total_unitsres: number;
  pct_rs: number;
  count_associated_bbls: number;
  count_associated_ll_names: number;
};

type WorstEvictorMapPoint = {
  citywide_rank: number;
  ll_name: string;
  ll_slug: string;
  bbl: string;
  address: string;
  borough: string;
  zip: string;
  lat: number;
  lng: number;
  units_res: number;
};

type WorstEvictorSelectOption = {
  value: string;
  label: string;
};

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

const getBoundsForPoints = (
  points: WorstEvictorMapPoint[]
): [[number, number], [number, number]] => {
  if (!points.length) return DEFAULT_FIT_BOUNDS;

  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  points.forEach((point) => {
    minLng = Math.min(minLng, point.lng);
    minLat = Math.min(minLat, point.lat);
    maxLng = Math.max(maxLng, point.lng);
    maxLat = Math.max(maxLat, point.lat);
  });

  // Avoid a zero-area fit bounds box when all points match.
  if (minLng === maxLng) {
    minLng -= 0.005;
    maxLng += 0.005;
  }
  if (minLat === maxLat) {
    minLat -= 0.005;
    maxLat += 0.005;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
};

const WorstEvictorsMapPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const rows = hardcodedRows as WorstEvictorListRow[];
  const [selectedEvictor, setSelectedEvictor] = useState<WorstEvictorSelectOption | null>(null);

  const allMapPoints = hardcodedMapPoints as WorstEvictorMapPoint[];

  const selectOptions = useMemo<WorstEvictorSelectOption[]>(
    () =>
      rows.map((row) => ({
        value: row.ll_slug,
        label: `${row.citywide_rank}. ${row.ll_name}`,
      })),
    [rows]
  );

  const mapPoints = useMemo(
    () =>
      selectedEvictor
        ? allMapPoints.filter((point) => point.ll_slug === selectedEvictor.value)
        : allMapPoints,
    [allMapPoints, selectedEvictor]
  );

  const bounds = useMemo(() => getBoundsForPoints(mapPoints), [mapPoints]);

  const hasSelection = !!selectedEvictor;
  const selectedSlug = selectedEvictor?.value;

  return (
    <Page title={i18n._(t`Worst evictors map`)}>
      <div className="WorstEvictorsMapPage Page">
        <div className="worst-evictors-map-page__header">
          <h2>
            <Trans>Worst Evictors 2025</Trans>
          </h2>
          <p>
            <Trans>
              This page uses hardcoded 2025 data from the merged worst-evictors-data output. Search
              or select a portfolio to filter map points to a single worst evictor.
            </Trans>
          </p>
          <div className="worst-evictors-map-page__filters">
            <label htmlFor="worst-evictors-select">
              <Trans>Select a worst evictor</Trans>
            </label>
            <Select
              inputId="worst-evictors-select"
              className="worst-evictors-map-page__select"
              classNamePrefix="dropdown-select"
              options={selectOptions}
              value={selectedEvictor}
              placeholder={i18n._(t`Select or search a 2025 evictor`)}
              onChange={(newOption: SingleValue<WorstEvictorSelectOption>) =>
                setSelectedEvictor(newOption || null)
              }
              isClearable
              isSearchable
            />
          </div>
        </div>

        <div className="worst-evictors-map-page__content">
          <div className="worst-evictors-map-page__map-wrapper">
            {MAPBOX_ACCESS_TOKEN ? (
              <MAP
                style={MAP_STYLE}
                containerStyle={{ width: "100%", height: "100%" }}
                fitBounds={bounds}
                fitBoundsOptions={{ padding: { top: 40, right: 40, bottom: 40, left: 40 } }}
                className="worst-evictors-map-page__map"
              >
                <ZoomControl position="top-left" />
                <Layer
                  id="worst-evictors-points"
                  type="circle"
                  paint={{
                    "circle-color": "#FF5722",
                    "circle-opacity": 0.75,
                    "circle-radius": 5.5,
                    "circle-stroke-color": "#1f1f1f",
                    "circle-stroke-width": 1,
                  }}
                >
                  {mapPoints.map((point) => (
                    <Feature
                      key={`${point.bbl}-${point.citywide_rank}`}
                      coordinates={[point.lng, point.lat]}
                    />
                  ))}
                </Layer>
              </MAP>
            ) : (
              <div className="worst-evictors-map-page__error">
                <Trans>
                  Mapbox access token is missing. Set REACT_APP_MAPBOX_ACCESS_TOKEN in
                  client/.env.local and restart the client.
                </Trans>
              </div>
            )}
          </div>

          <div className="worst-evictors-map-page__sidebar">
            <h3>
              <Trans>2025 worst evictor portfolios</Trans>
            </h3>
            <ul className="worst-evictors-map-page__list">
              {rows.map((row) => (
                <li
                  key={row.ll_slug}
                  className={`worst-evictors-map-page__list-item${
                    selectedSlug === row.ll_slug ? " is-selected" : ""
                  }`}
                  onClick={() =>
                    setSelectedEvictor({
                      value: row.ll_slug,
                      label: `${row.citywide_rank}. ${row.ll_name}`,
                    })
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedEvictor({
                        value: row.ll_slug,
                        label: `${row.citywide_rank}. ${row.ll_name}`,
                      });
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="worst-evictors-map-page__list-title">
                    {row.citywide_rank}. {row.ll_name}
                  </div>
                  <div className="worst-evictors-map-page__list-stats">
                    <Trans>
                      {numberFormatter.format(row.total_evictions_2025)} executed evictions
                    </Trans>
                  </div>
                  <div className="worst-evictors-map-page__list-stats">
                    <Trans>
                      {numberFormatter.format(row.count_associated_bbls)} associated buildings
                    </Trans>
                  </div>
                  <div className="worst-evictors-map-page__list-stats">
                    <Trans>{numberFormatter.format(row.total_unitsres)} residential units</Trans>
                  </div>
                  <div className="worst-evictors-map-page__list-stats">
                    <Trans>{row.pct_rs}% rent stabilized</Trans>
                  </div>
                </li>
              ))}
            </ul>
            {!rows.length && (
              <p className="worst-evictors-map-page__empty">
                <Trans>No 2025 worst evictor data is available yet.</Trans>
              </p>
            )}
            {hasSelection && !mapPoints.length && (
              <p className="worst-evictors-map-page__empty">
                <Trans>No mappable 2025 points were found for this selection.</Trans>
              </p>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
});

export default WorstEvictorsMapPage;
