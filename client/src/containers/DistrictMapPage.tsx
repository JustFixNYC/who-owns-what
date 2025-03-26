import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans } from "@lingui/macro";
import mapboxgl, { Map } from "mapbox-gl";
import Select, { SingleValue } from "react-select";
import { useEffect, useRef, useState } from "react";
import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from "geojson";

import "mapbox-gl/dist/mapbox-gl.css";
import "styles/DistrictMapPage.css";
import Page from "components/Page";

import ntaData from "../data/nta.json";
import ccdData from "../data/ccd.json";

type DistrictData = FeatureCollection<Geometry, GeoJsonProperties>;
type Option = { label: string; value: string; data?: DistrictData };

const districtDataOptions: Option[] = [
  { value: "nta", label: "Neighborhoods", data: ntaData as DistrictData },
  { value: "coun_dist", label: "City Council Districts", data: ccdData as DistrictData },
];

const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || "";

const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";

type LatLng = [number, number];

const DEFAULT_CENTER: LatLng = [-73.957117, 40.653632];

const DEFAULT_ZOOM = 11.5;

const MAP_CONFIGURABLES = {
  accessToken: MAPBOX_ACCESS_TOKEN,
  style: MAPBOX_STYLE,
  // containerStyle: { width: "100%", height: "100%" },
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
};

type FeatureProps = {
  name: string;
  geoid: string;
};

const makePopup = (props: FeatureProps) => {
  return `
    <strong>${props.name}</strong>
    <p>${props.geoid}</p>
  `;
};

const DistrictMapPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;

  const [districtData, setDistrictData] = useState(
    ntaData as FeatureCollection<Geometry, GeoJsonProperties>
  );
  const defaultDistrictOption = districtDataOptions.filter((source) => source.value === "nta")[0];

  const handleDistrictTypeChange = (newValue: SingleValue<Option>) => {
    if (!newValue?.data) return;
    setDistrictData(newValue.data);
  };

  return (
    <Page title={i18n._(t`District Alerts`)}>
      <div className="DistrictMapPage Page">
        <div className="page-container">
          <Trans render="h2">District map</Trans>
          <DistrictMap geojson={districtData} />
          <Select
            className="dropdown-select"
            aria-label="Area type selection"
            defaultValue={defaultDistrictOption}
            options={districtDataOptions}
            onChange={handleDistrictTypeChange}
          />
        </div>
      </div>
    </Page>
  );
});

const DistrictMap: React.FC<{ geojson: any }> = ({ geojson }: any) => {
  // https://sparkgeo.com/blog/build-a-react-mapboxgl-component-with-hooks/

  // this is where the map instance will be stored after initialization
  const [map, setMap] = useState<Map>();

  // React ref to store a reference to the DOM node that will be used
  // as a required parameter `container` when initializing the mapbox-gl
  // will contain `null` by default
  const mapNode = useRef(null);

  const [selectedData, setSelectedData] = useState<FeatureCollection<Geometry, GeoJsonProperties>>({
    type: "FeatureCollection",
    features: [],
  });

  useEffect(() => {
    const node = mapNode.current;
    // if the window object is not found, that means
    // the component is rendered on the server
    // or the dom node is not initialized, then return early
    if (typeof window === "undefined" || node === null) return;

    // otherwise, create a map instance
    const map = new Map({
      container: node,
      ...MAP_CONFIGURABLES,
    });

    const addFeatureToCollection = (feature: Feature) => {
      setSelectedData((prev) => {
        return { type: "FeatureCollection", features: (prev?.features || []).concat(feature) };
      });

      // @ts-ignore
      const currentData = map.getSource("selected")._data;
      currentData.features.push({
        type: "Feature",
        geometry: feature.geometry,
        properties: feature.properties,
      });
      // @ts-ignore
      map.getSource("selected").setData(currentData);
    };

    map.on("load", () => {
      map.addSource("districts", {
        type: "geojson",
        data: geojson,
      });

      map.addSource("selected", {
        type: "geojson",
        data: selectedData,
      });
      map.addLayer({
        id: "selected",
        type: "fill",
        source: "selected",
        paint: {
          "fill-color": "#8000ff",
          "fill-opacity": 1,
        },
      });

      map.addLayer({
        id: "districts",
        type: "fill",
        source: "districts",
        paint: {
          "fill-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#0080ff", // blue color fill,
            "#ffffff",
          ],
          "fill-opacity": 0.5,
        },
      });
      map.addLayer({
        id: "outline",
        type: "line",
        source: "districts",
        paint: {
          "line-color": "#000",
          "line-width": 1,
        },
      });
    });

    // When a click event occurs on a feature in the places layer, open a popup at the
    // location of the feature, with description HTML from its properties.
    map.on("click", "districts", (e) => {
      if (!e.features?.length) return;
      const feature = e.features[0];
      if (!feature.id) return;
      const prev = map.getFeatureState(feature);
      map.setFeatureState(
        { source: "districts", id: feature.id },
        { selected: prev?.selected ? !prev.selected : true }
      );
      addFeatureToCollection(feature);
    });

    // Change the cursor to a pointer when the mouse is over the places layer.
    map.on("mouseenter", "districts", (e) => {
      map.getCanvas().style.cursor = "pointer";
      // if (!e.features?.length) return;
      // const feature = e.features[0];
      // const props = feature.properties! as FeatureProps;
      // new mapboxgl.Popup()
      //   .setLngLat(e.lngLat)
      //   .setHTML(makePopup(props))
      //   .setMaxWidth("400px")
      //   .addTo(map);
    });

    // Change it back to a pointer when it leaves.
    map.on("mouseleave", "districts", () => {
      map.getCanvas().style.cursor = "";
    });

    // save the map object to useState
    setMap(map);

    return () => {
      map.remove();
    };
    // don't want to update on changed selections
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geojson]);

  return <div ref={mapNode} />;
};

export default DistrictMapPage;
