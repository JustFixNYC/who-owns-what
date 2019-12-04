import React from 'react';
import { withGoogleMap, StreetViewPanorama } from 'react-google-maps';
import Browser from '../util/browser';

export type StreetViewAddr = {
  bbl: string,
  lat: number,
  lng: number
};

export type StreetViewProps = {
  addr: StreetViewAddr|null|undefined,
};

type ImplProps = {
  heading: number,
  coordinates: google.maps.LatLng|undefined
};

type State = ImplProps;

const UnwrappedStreetViewImpl: React.FC<ImplProps> = props => {
  return (
    <StreetViewPanorama
      visible
      defaultPosition={props.coordinates}
      position={props.coordinates}
      pov={{ heading: props.heading, pitch: 15 }}
      zoom={0.5}
      options={{
        disableDefaultUI: true,
        enableCloseButton: false,
        panControl: true,
        fullscreenControl: true
      }}
    />
  );
};

const StreetViewImpl = withGoogleMap(UnwrappedStreetViewImpl);

export class StreetView extends React.Component<StreetViewProps, State> {
  _isMounted: boolean = false;

  constructor(props: StreetViewProps) {
    super(props);
    this.state = {
      heading: 0,
      coordinates: undefined
    };
  }

  componentDidMount() {
    this._isMounted = true;
    this.updateHeadingAndCoordinates();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  updateHeadingAndCoordinates() {
    if (!this.props.addr) {
      this.setState({
        heading: 0,
        coordinates: undefined  
      });
      return;
    }

    let coordinates = new window.google.maps.LatLng(this.props.addr.lat, this.props.addr.lng);
    let streetViewService = new window.google.maps.StreetViewService();

    streetViewService.getPanoramaByLocation(coordinates, 50, (panoData) => {
      if (!this._isMounted) return;
      if (panoData && panoData.location && panoData.location.latLng) {
        // this computes the street view heading
        // srsly tho google, why not point to the latlng automatically?
        let panoCoordinates = panoData.location.latLng;
        this.setState({
          heading: window.google.maps.geometry.spherical.computeHeading(panoCoordinates, coordinates),
          coordinates: coordinates
        });
      }
    });
  }

  // we need to trigger an ajax call (the streetViewService) when props
  // receives a new address.
  componentDidUpdate(prevProps: StreetViewProps) {
    // this says: if the component is getting the addr for the first time OR
    //            if the component already has an addr but is getting a new one
    if( (!prevProps.addr && this.props.addr) || (prevProps.addr && this.props.addr && (prevProps.addr.bbl !== this.props.addr.bbl))) {
      this.updateHeadingAndCoordinates();
    }
  }

  render() {
    const { heading, coordinates } = this.state;
    const isMobile = Browser.isMobile();

    return (
      <StreetViewImpl
        heading={heading}
        coordinates={coordinates}
        containerElement={<div style={{ width: `100%`, height: `${isMobile ? '180px' : '300px'}` }} />}
        mapElement={<div style={{height: '100%'}} />}
      />
    );
  }
}
