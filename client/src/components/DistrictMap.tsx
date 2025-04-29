import { LngLatBoundsLike, Map, NavigationControl } from "mapbox-gl";
import { useEffect, useRef, useState } from "react";

import "mapbox-gl/dist/mapbox-gl.css";
import {
  GeoJsonFeatureDistrict,
  DistrictsGeoJson,
  LabelsGeoJson,
} from "../containers/DistrictAlertsPage";

const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || "";

// const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";
const MAPBOX_STYLE = "mapbox://styles/justfix/cm8yh302x005501qu6qhk1la2";

type LatLng = [number, number];

const DEFAULT_CENTER: LatLng = [-73.9716972669396, 40.70612846804647];

const DEFAULT_ZOOM = 9.25;

const MAX_BOUNDS: LngLatBoundsLike = [
  [-74.29965918670848, 40.48691662492075],
  [-73.64373534717369, 40.92462112945242],
];

const MAP_CONFIGURABLES: Omit<mapboxgl.MapboxOptions, "container"> = {
  accessToken: MAPBOX_ACCESS_TOKEN,
  style: MAPBOX_STYLE,
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
  minZoom: DEFAULT_ZOOM,
  maxBounds: MAX_BOUNDS,
};

const LABEL_MINZOOM: { [key: string]: number } = {
  nta: 12,
  coun_dist: 11.5,
  borough: 9,
  community_dist: 11,
  cong_dist: 9.5,
  assem_dist: 11,
  stsen_dist: 10.5,
  zipcode: 10.5,
};

type DistrictMapProps = {
  districtsData?: DistrictsGeoJson;
  labelsData?: LabelsGeoJson;
  areaSelections: GeoJsonFeatureDistrict[];
  setAreaSelections: React.Dispatch<React.SetStateAction<GeoJsonFeatureDistrict[]>>;
};
export const DistrictMap: React.FC<DistrictMapProps> = ({
  districtsData,
  labelsData,
  areaSelections,
  setAreaSelections,
}) => {
  const [map, setMap] = useState<Map>();

  // React ref to store a reference to the DOM node that will be used
  // as a required parameter `container` when initializing the mapbox-gl
  // will contain `null` by default
  const mapNode = useRef(null);

  const [initialDataReady, setInitialDataReady] = useState(!!districtsData);
  const dataReady = initialDataReady || !!districtsData;

  useEffect(() => {
    if (!dataReady) return;
    setInitialDataReady(true);

    const node = mapNode.current;
    // if the window object is not found, that means
    // the component is rendered on the server
    // or the dom node is not initialized, then return early
    if (typeof window === "undefined" || node === null) return;

    const map = new Map({
      container: node,
      ...MAP_CONFIGURABLES,
    });

    map.on("load", () => {
      map.addSource("districts", {
        type: "geojson",
        data: districtsData,
      });

      map.addSource("labels", {
        type: "geojson",
        data: labelsData,
      });

      map.addSource("selected", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: areaSelections,
        } as DistrictsGeoJson,
      });

      map.addLayer({
        id: "selected",
        type: "fill",
        source: "selected",
        paint: {
          "fill-color": "#ffba33", // justfix-yellow
          "fill-opacity": 0.4,
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
            "#ffba33", // justfix-yellow
            "#ffffff",
          ],
          "fill-opacity": [
            "case",
            ["!", ["boolean", ["feature-state", "selected"], false]],
            0,
            ["boolean", ["feature-state", "hovered"], false],
            1,
            0.6,
          ],
        },
      });

      map.addLayer({
        id: "outline",
        type: "line",
        source: "districts",
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#ff813a", // justfix-orange
            "#000",
          ],
          "line-width": [
            "case",
            ["boolean", ["feature-state", "hovered"], false],
            3,
            ["boolean", ["feature-state", "selected"], false],
            2,
            1,
          ],
        },
      });

      map.addLayer({
        id: "labels",
        type: "symbol",
        source: "labels",
        minzoom: 12,
        layout: {
          "text-field": ["get", "areaLabel"],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-max-width": 10, // default
          "text-anchor": "center", // default
          "text-size": 11,
        },
        paint: {
          "text-color": "#000",
          "text-halo-color": "#fff",
          "text-halo-width": 2,
        },
      });
    });

    map.on("click", "districts", (e) => {
      if (!e.features?.length) return;
      const feature = e.features[0];
      if (!feature.id) return;
      const prev = map.getFeatureState(feature);
      map.setFeatureState(
        { source: "districts", id: feature.id },
        { selected: prev?.selected ? !prev.selected : true }
      );
      if (!prev?.selected)
        setAreaSelections((prev) => prev.concat([(feature as unknown) as GeoJsonFeatureDistrict]));
      if (prev?.selected) setAreaSelections((prev) => prev.filter((x) => x.id !== feature.id));
    });

    map.on("mouseenter", "districts", (e) => {
      map.getCanvas().style.cursor = "pointer";
    });

    let hoveredFeatureId: string | number;
    map.on("mousemove", "districts", (e) => {
      if (hoveredFeatureId) {
        map.setFeatureState({ source: "districts", id: hoveredFeatureId }, { hovered: false });
      }
      if (!e.features?.length) return;
      const feature = e.features[0];
      if (!feature.id) return;
      hoveredFeatureId = feature.id;
      map.setFeatureState({ source: "districts", id: hoveredFeatureId }, { hovered: true });
    });

    map.on("mouseleave", "districts", () => {
      map.getCanvas().style.cursor = "";
      if (hoveredFeatureId) {
        map.setFeatureState({ source: "districts", id: hoveredFeatureId }, { hovered: false });
      }
    });

    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    setMap(map);

    return () => {
      map.remove();
    };
    // don't want to update on changed selections
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataReady]);

  useEffect(() => {
    if (!districtsData) return;
    if (!map?.getSource("districts")) return;
    // @ts-ignore
    map.getSource("districts").setData(districtsData);
    const areaTypeValue = districtsData.features[0].properties.typeValue;
    map.setLayerZoomRange("labels", LABEL_MINZOOM[areaTypeValue], 23);
  }, [map, districtsData]);

  useEffect(() => {
    if (!labelsData) return;
    if (!map?.getSource("labels")) return;
    // @ts-ignore
    map.getSource("labels").setData(labelsData);
  }, [map, labelsData]);

  useEffect(() => {
    if (!map?.getSource("selected")) return;
    const selectedData = {
      type: "FeatureCollection",
      features: areaSelections,
    };

    // @ts-ignore
    map.getSource("selected").setData(selectedData);

    map.removeFeatureState({ source: "districts" });
    areaSelections.forEach((x) => {
      map.setFeatureState({ source: "districts", id: x.id }, { selected: true });
    });
  }, [map, areaSelections]);

  return (
    <div className="district-map-container">
      {!map && <div className="district-map-loading">Loading...</div>}
      <div ref={mapNode} />
    </div>
  );
};

export default DistrictMap;
