import React, { Component } from "react";
import ReactMapboxGl, { Layer, Feature, ZoomControl } from "react-mapbox-gl";
import Helpers from "../util/helpers";
import Browser from "../util/browser";
import MapHelpers, { LatLng, BoundingBox } from "../util/mapping";

import Loader from "../components/Loader";

import "styles/PropertiesMap.css";
import "mapbox-gl/src/css/mapbox-gl.css";
import { Trans, Select } from "@lingui/macro";
import { AddressRecord } from "./APIDataTypes";
import { FitBounds, Props as MapboxMapProps } from "react-mapbox-gl/lib/map";
import { Events as MapboxMapEvents } from "react-mapbox-gl/lib/map-events";
import { withMachineInStateProps } from "state-machine";
import { BigPortfolioWarning } from "./BigPortfolioWarning";
import { ToggleButton } from "./ToggleButton";

type Props = withMachineInStateProps<"portfolioFound"> & {
  onAddrChange: (bbl: string) => void;
  isVisible: boolean;
};

const isRentStab = (addrs: AddressRecord): boolean => !!addrs.rsunitslatest;

type State = {
  mapLoading: boolean;
  hasWebGLContext: boolean;
  mapRef: any | null;
  mobileLegendSlide: boolean;
  addrsBounds: FitBounds;
  addrsPoints: JSX.Element[];
  filterFn: (addrs: AddressRecord) => boolean;
  filterIsOn: boolean;
  mapProps: MapboxMapProps & MapboxMapEvents;
};

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoianVzdGZpeCIsImEiOiJja2hldmIxMmEwODVyMnNtZ2NkNGEyNjd0In0.4Piymx4ObHhSPq1K4MOZkw";

const MAPBOX_STYLE = "mapbox://styles/justfix/ckhevcljr02jg19l3jtw9h9w6";

const Map = ReactMapboxGl({
  accessToken: MAPBOX_ACCESS_TOKEN,
});

const DEFAULT_FIT_BOUNDS: BoundingBox = [
  [-74.259087, 40.477398],
  [-73.700172, 40.917576],
];

const MAP_CONFIGURABLES = {
  style: MAPBOX_STYLE,
  containerStyle: { width: "100%", height: "100%" },
  fitBounds: DEFAULT_FIT_BOUNDS,
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
      ["highlight", "#32B643"],
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
      addrsBounds: DEFAULT_FIT_BOUNDS, // bounds are represented as a 2d array of lnglats
      addrsPoints: [], // array of Features
      filterFn: isRentStab,
      filterIsOn: false,
      mapProps: {
        onStyleLoad: (map, _) => this.setState({ mapLoading: false, mapRef: map }),
        onMouseMove: (map, e) => this.handleMouseMove(map, e),
        ...MAP_CONFIGURABLES,
      },
    };
  }

  componentDidMount() {
    const { newAssocAddrs, newAddrsBounds } = this.getAddrsPointsBounds();

    // sets things up, including initial portfolio level map view
    this.setState(
      {
        addrsBounds: newAddrsBounds,
        addrsPoints: newAssocAddrs,
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

  componentDidUpdate(prevProps: Props, prevState: State) {
    // is this necessary?
    // meant to reconfigure after bring the tab back in focus
    if (!prevProps.isVisible && this.props.isVisible) {
      if (this.state.mapRef) this.state.mapRef.resize();
    }

    /**
     * Either we are receiving detailAddr for the first time, or it has been updated to a new address.
     */
    const didDetailAddrUpdate =
      (!prevProps.state.context.portfolioData && this.props.state.context.portfolioData) ||
      prevProps.state.context.portfolioData.detailAddr.bbl !==
        this.getPortfolioData().detailAddr.bbl;

    if (didDetailAddrUpdate) {
      const { detailAddr } = this.getPortfolioData();
      const { lat, lng } = detailAddr;

      // build a bounding box around our new detail addr
      const newBounds = !!(lat && lng)
        ? ([
            [lng - DETAIL_OFFSET, lat - DETAIL_OFFSET],
            [lng + DETAIL_OFFSET, lat + DETAIL_OFFSET],
          ] as FitBounds)
        : this.state.mapProps.fitBounds;
      this.setState({
        mapProps: {
          ...this.state.mapProps,
          fitBounds: newBounds,
        },
      });
    }

    /**
     * If filter has changed re style the points
     */
    const didFilterChange =
      prevState.filterIsOn !== this.state.filterIsOn || prevState.filterFn !== this.state.filterFn;

    if (didFilterChange) {
      const { newAssocAddrs } = this.getAddrsPointsBounds();
      this.setState({
        addrsPoints: newAssocAddrs,
      });
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
    // updates state with new detail address
    this.props.onAddrChange(addr.bbl);
  };

  getPortfolioData() {
    return this.props.state.context.portfolioData;
  }

  getMapTypeForAddr = (addr: AddressRecord) => {
    const { assocAddrs } = this.getPortfolioData();
    const { filterIsOn, filterFn } = this.state;
    const matchingAddr = assocAddrs.find((a) => Helpers.addrsAreEqual(a, addr));
    return matchingAddr
      ? matchingAddr.mapType
      : filterIsOn && filterFn(addr)
      ? "highlight"
      : "base";
  };

  getAddrsPointsBounds = () => {
    let addrsPos = new Set();
    let newAssocAddrs: JSX.Element[] = [];

    const { assocAddrs, searchAddr } = this.props.state.context.portfolioData;
    const { filterIsOn, filterFn } = this.state;

    // cycle through addrs, adding them to the set and categorizing them
    assocAddrs.forEach((addr, i) => {
      const pos: LatLng = [addr.lng || NaN, addr.lat || NaN];

      if (!MapHelpers.latLngIsNull(pos)) {
        addrsPos.add(pos);

        // presuming that nextProps.userAddr is in sync with nextProps.addrs
        if (Helpers.addrsAreEqual(addr, searchAddr)) {
          addr.mapType = "search";
        } else if (filterIsOn && filterFn(addr)) {
          addr.mapType = "highlight";
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
    });

    // see getBoundingBox() for deets
    const pointsArray = Array.from(addrsPos) as LatLng[];
    const newAddrsBounds = MapHelpers.getBoundingBox(pointsArray, DEFAULT_FIT_BOUNDS);

    return { newAssocAddrs, newAddrsBounds };
  };

  render() {
    const browserType = Browser.isMobile() ? "mobile" : "other";
    const { useNewPortfolioMethod } = this.props.state.context;

    const { detailAddr, assocAddrs } = this.getPortfolioData();

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
            {useNewPortfolioMethod ? (
              <BigPortfolioWarning sizeOfPortfolio={this.state.addrsPoints.length} />
            ) : (
              <></>
            )}

            <ToggleButton
              onClick={() =>
                this.setState({
                  filterFn: isRentStab,
                  filterIsOn: !this.state.filterIsOn,
                })
              }
              badgeValue={assocAddrs.filter(isRentStab).length}
              customClasses="filter-button"
            >
              <Trans>Rent Stabilized Units</Trans>
            </ToggleButton>
            {this.state.addrsPoints.length ? (
              <Layer id="assoc" type="circle" paint={DYNAMIC_ASSOC_PAINT}>
                {this.state.addrsPoints}
              </Layer>
            ) : (
              <></>
            )}
            <Layer id="selected" type="circle" paint={DYNAMIC_SELECTED_PAINT}>
              {/*
                  we need to lookup the property pe of this feature from the main addrs array
                  this affects the color of the marker while still outlining it as "selected"
                  */}
              {detailAddr.lng && detailAddr.lat && (
                <Feature
                  properties={{
                    mapType: this.getMapTypeForAddr(detailAddr),
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
