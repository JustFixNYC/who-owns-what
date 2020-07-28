import React, { Component } from "react";
import ReactMapboxGl, { Layer, Feature, ZoomControl } from "react-mapbox-gl";
import Helpers from "../util/helpers";
import Browser from "../util/browser";
import MapHelpers, { LatLng } from "../util/mapping";

import Loader from "../components/Loader";

import "styles/PropertiesMap.css";
import { Trans, Select } from "@lingui/macro";
import { AddressRecord } from "./APIDataTypes";
import { Props as MapboxMapProps } from "react-mapbox-gl/lib/map";
import { Events as MapboxMapEvents } from "react-mapbox-gl/lib/map-events";

type Props = {
  addrs: AddressRecord[];
  userAddr: AddressRecord;
  detailAddr: AddressRecord;
  onAddrChange: (addr: AddressRecord) => void;
  isVisible: boolean;
};

type State = {
  mapLoading: boolean;
  hasWebGLContext: boolean;
  mapRef: any | null;
  mobileLegendSlide: boolean;
  addrsBounds: number[][];
  assocAddrs: JSX.Element[];
  mapProps: MapboxMapProps & MapboxMapEvents;
};

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiZGFuLWthc3MiLCJhIjoiY2lsZTFxemtxMGVpdnVoa3BqcjI3d3Q1cCJ9.IESJdCy8fmykXbb626NVEw";

const MAPBOX_STYLE = "mapbox://styles/dan-kass/cj657o2qu601z2rqbp1jgiys5";

const Map = ReactMapboxGl({
  accessToken: MAPBOX_ACCESS_TOKEN,
});

const MAP_CONFIGURABLES = {
  style: MAPBOX_STYLE,
  containerStyle: { width: "100%", height: "100%" },
  fitBounds: [
    [-74.259087, 40.477398],
    [-73.700172, 40.917576],
  ],
  fitBoundsOptions: {
    padding: { top: 50, bottom: 50, left: 50, right: 50 },
    maxZoom: 20,
    offset: [0, Browser.isMobile() ? -25 : 0],
  },
};

const BASE_CIRCLE = {
  "circle-stroke-width": 1.25,
  "circle-radius": 8,
  "circle-color": "#FF9800",
  "circle-opacity": 0.8,
  "circle-stroke-color": "#000000",
};

const DYNAMIC_ASSOC_PAINT = {
  ...BASE_CIRCLE,
  "circle-color": {
    property: "mapType",
    type: "categorical",
    default: "#acb3c2",
    stops: [
      ["base", "#FF9800"],
      ["search", "#FF5722"],
    ],
  },
};

const DYNAMIC_SELECTED_PAINT = {
  ...DYNAMIC_ASSOC_PAINT,
  "circle-stroke-color": "#d6d6d6",
  "circle-opacity": 1,
};

// due to the wonky way react-mapboxgl works, we can't just specify a center/zoom combo
// instead we use this offset value to create a fake bounding box around the detail center point
// TODO: probably a non-hack way to do this?
// const DETAIL_OFFSET = 0.0007;
const DETAIL_OFFSET = 0.0015;

export default class PropertiesMap extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      // maybe theres a better way for this, but the initial loading boolean
      // could just be driven by if WebGL is an option or not
      mapLoading: MapHelpers.hasWebGLContext(),
      hasWebGLContext: MapHelpers.hasWebGLContext(),
      mapRef: null,
      mobileLegendSlide: false,
      addrsBounds: [[]], // bounds are represented as a 2d array of lnglats
      assocAddrs: [], // array of Features
      mapProps: {
        onStyleLoad: (map, _) => this.setState({ mapLoading: false, mapRef: map }),
        onMouseMove: (map, e) => this.handleMouseMove(map, e),
        ...MAP_CONFIGURABLES,
      },
    };
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    // addrs are being populated for the first time, so lets initialize things
    if (!this.state.assocAddrs.length && this.props.addrs.length) {
      // set of addr positions to determine custom bounds
      let addrsPos = new Set();
      let newAssocAddrs: JSX.Element[] = [];

      // cycle through addrs, adding them to the set and categorizing them
      this.props.addrs.map((addr, i) => {
        const pos: LatLng = [addr.lng || NaN, addr.lat || NaN];

        if (!MapHelpers.latLngIsNull(pos)) {
          addrsPos.add(pos);

          // presuming that nextProps.userAddr is in sync with nextProps.addrs
          if (Helpers.addrsAreEqual(addr, this.props.userAddr)) {
            addr.mapType = "search";
          } else {
            addr.mapType = "base";
          }
        }

        // push a new Feature for the map
        newAssocAddrs.push(
          <Feature
            key={i}
            coordinates={pos}
            properties={{ mapType: addr.mapType }}
            onClick={(e) => this.handleAddrSelect(addr, e)}
          />
        );

        return addr;
      });

      // see getBoundingBox() for deets
      const pointsArray = Array.from(addrsPos) as LatLng[];
      const newAddrsBounds = MapHelpers.getBoundingBox(pointsArray);

      // sets things up, including initial portfolio level map view
      this.setState(
        {
          addrsBounds: newAddrsBounds,
          assocAddrs: newAssocAddrs,
        },
        () => {
          // yeah, this sucks, but it seems to be more consistent with
          // getting mapbox to render properly. essentially wait another cycle before
          // re-bounding the map
          this.setState({
            mapProps: {
              ...this.state.mapProps,
              fitBounds: this.state.addrsBounds,
            },
          });
        }
      );
    }

    // is this necessary?
    // meant to reconfigure after bring the tab back in focus
    if (!prevProps.isVisible && this.props.isVisible) {
      if (this.state.mapRef) this.state.mapRef.resize();
    }

    // meant to pan the map any time the detail address changes
    if (
      prevProps.detailAddr &&
      this.props.detailAddr &&
      !Helpers.addrsAreEqual(prevProps.detailAddr, this.props.detailAddr)
    ) {
      let addr = this.props.detailAddr;
      if (!(addr.lat && addr.lng)) return;

      // build a bounding box around our new detail addr
      let minPos = [addr.lng - DETAIL_OFFSET, addr.lat - DETAIL_OFFSET];
      let maxPos = [addr.lng + DETAIL_OFFSET, addr.lat + DETAIL_OFFSET];
      this.setState({
        mapProps: {
          ...this.state.mapProps,
          fitBounds: [minPos, maxPos],
        },
      });

      // console.log("I panned the map!");
    }
  }

  handleMouseMove = (map: any, e: any) => {
    let features = map.queryRenderedFeatures(e.point, { layers: ["assoc"] });
    if (features.length) {
      map.getCanvas().style.cursor = "pointer";
    } else {
      map.getCanvas().style.cursor = "";
    }
  };

  handleAddrSelect = (addr: AddressRecord, e: any) => {
    // updates state with new focus address
    this.props.onAddrChange(addr);
  };

  render() {
    const browserType = Browser.isMobile() ? "mobile" : "other";
    const addrs = this.props.addrs;
    const detailAddr = this.props.detailAddr;

    const getMapTypeForAddr = (addr: AddressRecord) => {
      const matchingAddr = addrs.find((a) => Helpers.addrsAreEqual(a, addr));
      return matchingAddr ? matchingAddr.mapType : "base";
    };

    return (
      <div className="PropertiesMap">
        <Loader loading={this.state.mapLoading} classNames="Loader-map">
          <Trans>Loading</Trans>
        </Loader>

        {/*
            react-mapbox-gl requires a WebGL context to render. It doesn't seem
            to handle things very well, I couldn't even find a way to catch the
            error so the site doesn't break. In the meantime, we display this super
            sad message.
          */}
        {!this.state.hasWebGLContext && (
          <div className="PropertiesMap__error">
            <Trans render="h4">
              Sorry, it looks like there's an error on the map. Try again on a different browser or{" "}
              <a href="http://webglreport.com/" target="_blank" rel="noopener noreferrer">
                enable WebGL
              </a>
              .
            </Trans>
          </div>
        )}

        {this.state.hasWebGLContext && (
          <Map {...this.state.mapProps}>
            <ZoomControl
              position="top-left"
              style={{
                boxShadow: "none",
                opacity: 1,
                backgroundColor: "#ffffff",
                borderColor: "#727e96",
                top: "10px",
                left: "10px",
              }}
            />
            {this.state.assocAddrs.length ? (
              <Layer id="assoc" type="circle" paint={DYNAMIC_ASSOC_PAINT}>
                {this.state.assocAddrs}
              </Layer>
            ) : (
              <></>
            )}
            <Layer id="selected" type="circle" paint={DYNAMIC_SELECTED_PAINT}>
              {/*
                  we need to lookup the property pe of this feature from the main addrs array
                  this affects the color of the marker while still outlining it as "selected"
                  */}
              {detailAddr && detailAddr.lng && detailAddr.lat && (
                <Feature
                  properties={{
                    mapType: getMapTypeForAddr(detailAddr),
                  }}
                  coordinates={[detailAddr.lng, detailAddr.lat]}
                />
              )}
            </Layer>
          </Map>
        )}

        <div
          className={`PropertiesMap__legend ${
            this.state.mobileLegendSlide ? "PropertiesMap__legend--slide" : ""
          }`}
          onClick={() => this.setState({ mobileLegendSlide: !this.state.mobileLegendSlide })}
        >
          <p>
            <span>
              {Browser.isMobile() ? (
                this.state.mobileLegendSlide ? (
                  <Trans>Close legend</Trans>
                ) : (
                  <Trans>View legend</Trans>
                )
              ) : (
                <Trans>Legend</Trans>
              )}
            </span>{" "}
            <i>{this.state.mobileLegendSlide ? "\u2b07\uFE0E" : "\u2b06\uFE0E"}</i>
          </p>

          <ul>
            <Trans render="li">search address</Trans>
            <Trans render="li">associated building</Trans>
          </ul>
        </div>
        <div className="PropertiesMap__prompt">
          <p>
            <Trans render="i">
              (<Select value={browserType} mobile="tap" other="click" /> to view details)
            </Trans>
          </p>
        </div>
      </div>
    );
  }
}
