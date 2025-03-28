import { Map } from "mapbox-gl";
import { useEffect, useRef, useState } from "react";

import "mapbox-gl/dist/mapbox-gl.css";
import "styles/DistrictMapPage.css";
import { GeoJsonFeature, GeoJsonFeatureCollection } from "./DistrictAlertsPage";

const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || "";

const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";

type LatLng = [number, number];

const DEFAULT_CENTER: LatLng = [-73.957117, 40.653632];

const DEFAULT_ZOOM = 11.5;

const MAP_CONFIGURABLES = {
  accessToken: MAPBOX_ACCESS_TOKEN,
  style: MAPBOX_STYLE,
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
};

type DistrictMapProps = {
  geojson: GeoJsonFeatureCollection;
  areaSelections: GeoJsonFeature[];
  setAreaSelections: React.Dispatch<React.SetStateAction<GeoJsonFeature[]>>;
};
export const DistrictMap: React.FC<DistrictMapProps> = ({
  geojson,
  areaSelections,
  setAreaSelections,
}) => {
  // https://sparkgeo.com/blog/build-a-react-mapboxgl-component-with-hooks/

  // this is where the map instance will be stored after initialization
  const [map, setMap] = useState<Map>();

  // React ref to store a reference to the DOM node that will be used
  // as a required parameter `container` when initializing the mapbox-gl
  // will contain `null` by default
  const mapNode = useRef(null);

  useEffect(() => {
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
        data: geojson,
      });

      map.addSource("selected", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: areaSelections,
        } as GeoJsonFeatureCollection,
      });
      map.addLayer({
        id: "selected",
        type: "fill",
        source: "selected",
        paint: {
          "fill-color": "#ffa0c7", // justfix-pink
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
            "#5188ff", // justfix-blue
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
          "line-width": ["case", ["boolean", ["feature-state", "hovered"], false], 2, 1],
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
        setAreaSelections((prev) => prev.concat([(feature as unknown) as GeoJsonFeature]));
      if (prev?.selected) setAreaSelections((prev) => prev.filter((x) => x.id !== feature.id));
    });

    map.on("mouseenter", "districts", (e) => {
      map.getCanvas().style.cursor = "pointer";
    });

    let hoveredFeatureId: string | number;
    map.on("mousemove", "districts", (e) => {
      if (!e.features?.length) return;
      const feature = e.features[0];
      if (!feature.id) return;
      if (hoveredFeatureId) {
        map.setFeatureState({ source: "districts", id: hoveredFeatureId }, { hovered: false });
      }
      hoveredFeatureId = feature.id;
      map.setFeatureState({ source: "districts", id: hoveredFeatureId }, { hovered: true });
    });

    map.on("mouseleave", "districts", (e) => {
      map.getCanvas().style.cursor = "";
    });

    setMap(map);

    return () => {
      map.remove();
    };
    // don't want to update on changed selections
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geojson]);

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

  return <div ref={mapNode} />;
};

export default DistrictMap;
