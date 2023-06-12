import React, { Component } from "react";
import ReactMapboxGl, { Layer, Feature, ZoomControl } from "react-mapbox-gl";
import Helpers from "../util/helpers";
import Browser from "../util/browser";
import MapHelpers, { LatLng, BoundingBox } from "../util/mapping";
import Loader from "../components/Loader";

import "styles/PropertiesMap.css";
import "mapbox-gl/src/css/mapbox-gl.css";
import { Plural, Trans } from "@lingui/macro";
import { AddressRecord } from "./APIDataTypes";
import { FitBounds, Props as MapboxMapProps } from "react-mapbox-gl/lib/map";
import { Events as MapboxMapEvents } from "react-mapbox-gl/lib/map-events";
import { withMachineInStateProps } from "state-machine";
import { BigPortfolioAlert, FilterPortfolioAlert } from "./PortfolioAlerts";
import { AddressPageRoutes, createRouteForFullBbl } from "routes";
import {
  FilterContext,
  IFilterContext,
  PortfolioAnalyticsEvent,
  defaultFilterContext,
  filterAddrs,
} from "./PropertiesList";
import { isEqual } from "lodash";
import { Alert } from "./Alert";
import { Link, useLocation } from "react-router-dom";
import { SupportedLocale, defaultLocale } from "i18n-base";
import { isLegacyPath } from "./WowzaToggle";
import { sortContactsByImportance } from "./DetailView";
import _groupBy from "lodash/groupBy";
import classnames from "classnames";

type Props = withMachineInStateProps<"portfolioFound"> & {
  onAddrChange: (bbl: string) => void;
  isVisible: boolean;
  addressPageRoutes: AddressPageRoutes;
  location: "overview" | "portfolio";
  locale?: SupportedLocale;
  logPortfolioAnalytics?: PortfolioAnalyticsEvent;
};

type State = {
  mapLoading: boolean;
  hasWebGLContext: boolean;
  mapRef: any | null;
  mobileLegendSlide: boolean;
  addrsBounds: FitBounds;
  addrsPoints: JSX.Element[];
  mapProps: MapboxMapProps & MapboxMapEvents;
  selectedAddr?: AddressRecord;
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
    ],
  },
};

const DYNAMIC_DETAIL_PAINT = {
  ...DYNAMIC_ASSOC_PAINT,
  "circle-stroke-color": "#d6d6d6",
  "circle-opacity": 1,
};

const DYNAMIC_FILTER_PAINT = {
  ...DYNAMIC_ASSOC_PAINT,
  "circle-color": {
    property: "mapType",
    type: "categorical",
    default: "#acb3c2",
    stops: [
      ["base", "#d6d6d6"],
      ["search", "#FF5722"],
    ],
  },
  "circle-stroke-color": {
    property: "mapType",
    type: "categorical",
    default: "#000000",
    stops: [
      ["base", "#5188FF"],
      ["search", "#000000"],
    ],
  },
};

const DYNAMIC_SELECTED_PAINT = {
  ...DYNAMIC_FILTER_PAINT,
  "circle-opacity": 1,
  "circle-stroke-opacity": 1,
  "circle-stroke-color": {
    property: "mapType",
    type: "categorical",
    default: "#000000",
    stops: [
      ["base", "#000000"],
      ["search", "#d6d6d6"],
    ],
  },
};

const ASSOC_LAYOUT = {
  "circle-sort-key": {
    property: "mapType",
    type: "categorical",
    default: 0,
    stops: [
      ["base", 0],
      ["search", 1],
    ],
  },
};

// due to the wonky way react-mapboxgl works, we can't just specify a center/zoom combo
// instead we use this offset value to create a fake bounding box around the detail center point
// TODO: probably a non-hack way to do this?
// const DETAIL_OFFSET = 0.0007;
const DETAIL_OFFSET = 0.0015;

export default class PropertiesMap extends Component<Props, State> {
  static contextType = FilterContext;
  context!: React.ContextType<typeof FilterContext>;

  private prevFilterContext: IFilterContext = defaultFilterContext;

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
      mapProps: {
        onStyleLoad: (map, _) => this.setState({ mapLoading: false, mapRef: map }),
        onMouseMove: (map, e) => this.handleMouseMove(map, e),
        ...MAP_CONFIGURABLES,
      },
    };
  }

  componentDidMount() {
    const { newAssocAddrs, newAddrsBounds } = this.getAddrsPointsAndBounds();

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
    this.state.mapRef?.resize();

    // this.isOnOverview() && this.zoomToNewDetailAddr(prevProps);

    const { filterContext } = this.context;

    if (typeof filterContext === "undefined") return;

    if (this.filtersDidChange()) {
      const { newAssocAddrs } = this.getAddrsPointsAndBounds();
      this.setState({
        addrsPoints: newAssocAddrs,
      });
    }

    this.prevFilterContext = filterContext;
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
    // On Overview page, this updates global context/state with new detail address. On Portfolio this just has telemetry.
    this.props.onAddrChange(addr.bbl);

    // TODO: when on portfolio page, update state for selected address
    if (!this.isOnOverview()) {
      this.setState({ selectedAddr: addr });
    }
  };

  getPortfolioData() {
    return this.props.state.context.portfolioData;
  }

  isOnOverview() {
    return this.props.location === "overview";
  }

  getMapTypeForAddr = (addr: AddressRecord) => {
    const { assocAddrs } = this.getPortfolioData();
    const matchingAddr = assocAddrs.find((a) => Helpers.addrsAreEqual(a, addr));
    return matchingAddr ? matchingAddr.mapType : "base";
  };

  getAddrsPointsAndBounds = () => {
    let addrsPos = new Set();
    let newAssocAddrs: JSX.Element[] = [];

    const { assocAddrs, searchAddr } = this.getPortfolioData();

    // cycle through addrs, adding them to the set and categorizing them
    this.filterAddrs(assocAddrs, searchAddr).forEach((addr, i) => {
      const pos: LatLng = [addr.lng || NaN, addr.lat || NaN];

      if (!MapHelpers.latLngIsNull(pos)) {
        addrsPos.add(pos);

        // presuming that nextProps.userAddr is in sync with nextProps.addrs
        if (Helpers.addrsAreEqual(addr, searchAddr)) {
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
    });

    const pointsArray = Array.from(addrsPos) as LatLng[];
    const newAddrsBounds = MapHelpers.getBoundingBox(pointsArray, DEFAULT_FIT_BOUNDS);

    return { newAssocAddrs, newAddrsBounds };
  };

  filterAddrs(addrs: AddressRecord[], searchAddr: AddressRecord) {
    const { filterContext } = this.context;

    if (typeof filterContext === "undefined") return addrs;

    const filteredAddrs = filterAddrs(addrs, filterContext.filterSelections).filter(
      (addr) => addr.bbl !== searchAddr.bbl
    );

    filteredAddrs.push(searchAddr);

    return filteredAddrs;
  }

  filtersDidChange(): boolean {
    const { filterSelections: curr } = this.context.filterContext;
    const { filterSelections: prev } = this.prevFilterContext;

    return (
      prev.rsunitslatest !== curr.rsunitslatest ||
      ((prev.ownernames.length || curr.ownernames.length) &&
        !isEqual(prev.ownernames, curr.ownernames)) ||
      !isEqual(prev.unitsres, curr.unitsres) ||
      !isEqual(prev.zip, curr.zip)
    );
  }

  filtersAreActive(): boolean {
    if (this.isOnOverview()) return false;

    const { filterSelections } = this.context.filterContext;
    const { filterSelections: defaultfilterSelections } = defaultFilterContext;

    return !isEqual(filterSelections, defaultfilterSelections);
  }

  zoomToNewDetailAddr(prevProps: Props) {
    /**
     * Either we are receiving detailAddr for the first time, or it has been updated to a new address.
     */
    const didDetailAddrUpdate =
      (!prevProps.state.context.portfolioData && this.props.state.context.portfolioData) ||
      prevProps.state.context.portfolioData.detailAddr.bbl !==
        this.getPortfolioData().detailAddr.bbl;

    if (this.isOnOverview() && didDetailAddrUpdate) {
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
  }

  render() {
    const { useNewPortfolioMethod } = this.props.state.context;
    const portfolioFiltersEnabled = process.env.REACT_APP_PORTFOLIO_FILTERS_ENABLED === "1" || true;
    const { detailAddr } = this.getPortfolioData();
    const { locale, logPortfolioAnalytics } = this.props;
    const isMobile = Browser.isMobile();
    const { selectedAddr } = this.state;

    return (
      <div
        className={classnames("PropertiesMap", this.props.isVisible ? "is-visible" : "is-hidden")}
      >
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
            <div className="MapAlert__container">
              {this.isOnOverview() && useNewPortfolioMethod && (
                <>
                  <BigPortfolioAlert
                    closeType="session"
                    storageId="map-big-portfolio-alert"
                    portfolioSize={this.state.addrsPoints.length}
                  />
                  {portfolioFiltersEnabled && (
                    <FilterPortfolioAlert
                      closeType="session"
                      storageId="map-filter-portfolio-alert"
                      portfolioSize={this.state.addrsPoints.length}
                      addressPageRoutes={this.props.addressPageRoutes}
                    />
                  )}
                </>
              )}
              {!this.isOnOverview() && !!selectedAddr && (
                <SelectedAddrAlert
                  addr={selectedAddr}
                  isMobile={isMobile}
                  locale={locale}
                  logPortfolioAnalytics={logPortfolioAnalytics}
                  onClose={() => this.setState({ selectedAddr: undefined })}
                />
              )}
            </div>
            {this.state.addrsPoints.length ? (
              <Layer
                id="assoc"
                type="circle"
                layout={ASSOC_LAYOUT}
                paint={this.filtersAreActive() ? DYNAMIC_FILTER_PAINT : DYNAMIC_ASSOC_PAINT}
              >
                {this.state.addrsPoints}
              </Layer>
            ) : (
              <></>
            )}
            <Layer id="detail" type="circle" paint={DYNAMIC_DETAIL_PAINT}>
              {/*
                  we need to lookup the property pe of this feature from the main addrs array
                  this affects the color of the marker while still outlining it as "selected"
                  */}
              {this.isOnOverview() && detailAddr.lng && detailAddr.lat && (
                <Feature
                  properties={{
                    mapType: this.getMapTypeForAddr(detailAddr),
                  }}
                  coordinates={[detailAddr.lng, detailAddr.lat]}
                />
              )}
            </Layer>
            <Layer
              id="selected"
              type="circle"
              paint={this.filtersAreActive() ? DYNAMIC_SELECTED_PAINT : DYNAMIC_DETAIL_PAINT}
            >
              {!this.isOnOverview() && !!selectedAddr && selectedAddr.lng && selectedAddr.lat && (
                <Feature
                  properties={{
                    mapType: this.getMapTypeForAddr(selectedAddr),
                  }}
                  coordinates={[selectedAddr.lng, selectedAddr.lat]}
                />
              )}
            </Layer>
          </Map>
        )}

        <div
          className={classnames("PropertiesMap__legend", {
            "PropertiesMap__legend--slide": this.state.mobileLegendSlide,
          })}
          onClick={() => this.setState({ mobileLegendSlide: !this.state.mobileLegendSlide })}
        >
          <p>
            <span>
              {Browser.isMobile() ? (
                this.state.mobileLegendSlide ? (
                  <Trans>Hide legend</Trans>
                ) : (
                  <Trans>Show legend</Trans>
                )
              ) : (
                <Trans>Legend</Trans>
              )}
            </span>{" "}
            <i>{this.state.mobileLegendSlide ? "\u2b07\uFE0E" : "\u2b06\uFE0E"}</i>
          </p>

          <div className="legend-entry-container">
            <Trans render="div" className="addr-search">
              search address
            </Trans>
            <Trans render="div" className={`addr-${this.filtersAreActive() ? "filter" : "assoc"}`}>
              associated building
            </Trans>
          </div>
        </div>
      </div>
    );
  }
}

const SelectedAddrAlert = ({
  addr,
  isMobile,
  locale,
  logPortfolioAnalytics,
  onClose,
}: {
  addr: AddressRecord;
  isMobile: boolean;
  locale?: SupportedLocale;
  logPortfolioAnalytics?: PortfolioAnalyticsEvent;
  onClose?: () => void;
}) => {
  const { pathname } = useLocation();
  const numberFormatter = new Intl.NumberFormat(locale || defaultLocale);

  return (
    <Alert
      closeType="state"
      variant="secondary"
      type="info"
      onClose={onClose}
      className="selected-addr-alert"
    >
      <p className="selected-addr-alert__address">{`${addr.housenumber} ${addr.streetname}, ${addr.boro}`}</p>

      {!isMobile && (
        <>
          <Trans render="p">
            Rent stabilized units ({addr.rsunitslatestyear}):{" "}
            {numberFormatter.format(addr.rsunitslatest || 0)}
          </Trans>
          <Trans render="p">
            Associated names/entities:{" "}
            {!!addr.allcontacts &&
              Object.entries(_groupBy(addr.allcontacts, "value"))
                .sort(sortContactsByImportance)
                .map((contact) => contact[0])
                .join("; ")}
          </Trans>
          <Trans render="p">
            Building size:{" "}
            {!!addr.unitsres && (
              <>
                {addr.unitsres} <Plural value={addr.unitsres} one="unit" other="units" />
              </>
            )}
          </Trans>
        </>
      )}

      <Link
        to={createRouteForFullBbl(addr.bbl, locale || defaultLocale, isLegacyPath(pathname))}
        // TODO: decide on "map" gtm property format
        onClick={() =>
          !!logPortfolioAnalytics &&
          logPortfolioAnalytics("addressChangePortfolio", { extraParams: { from: "map" } })
        }
      >
        <Trans>See Building Profile</Trans>
      </Link>
    </Alert>
  );
};
