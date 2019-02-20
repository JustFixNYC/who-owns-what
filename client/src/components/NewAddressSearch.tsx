import React from 'react';
import Downshift, { DownshiftInterface, GetInputPropsOptions } from 'downshift';
import { GeoSearchRequester, GeoSearchResults } from '../util/geo-autocomplete-base';

import 'styles/AddressSearch.css';

const GeoDownshift = Downshift as DownshiftInterface<SearchAddress>;

export interface SearchAddress {
  /** The house number, e.g. '654'. */
  housenumber: string,

  /** The street name, e.g. 'PARK PLACE'. */
  streetname: string,

  /** The all-uppercase borough name, e.g. 'BROOKLYN'. */
  boro: string,
}

export interface NewAddressSearchProps extends SearchAddress {
  onFormSubmit: (searchAddress: SearchAddress, error: any) => void,
}

type State = {
  isLoading: boolean,
  results: SearchAddress[]
};

function toSearchAddresses(results: GeoSearchResults): SearchAddress[] {
  return results.features.map(feature => {
    const sa: SearchAddress = {
      housenumber: feature.properties.housenumber,
      streetname: feature.properties.street,
      boro: feature.properties.borough.toUpperCase()
    };
    return sa;
  });
}

function searchAddressToString(sa: SearchAddress): string {
  return `${sa.housenumber} ${sa.streetname}, ${sa.boro}`;
}

export default class NewAddressSearch extends React.Component<NewAddressSearchProps, State> {
  requester: GeoSearchRequester;

  constructor(props: NewAddressSearchProps) {
    super(props);
    this.state = {
      isLoading: false,
      results: []
    };
    this.requester = new GeoSearchRequester({
      // TODO: Create an actual AbortController if possible.
      createAbortController: () => undefined,
      fetch: window.fetch.bind(window),
      throttleMs: 250,
      onError: (e) => console.log('TODO geo search results error', e),
      onResults: (results) => {
        this.setState({
          isLoading: false,
          results: toSearchAddresses(results)
        });
      }
    });
  }

  render() {
    return (
      <GeoDownshift
        onChange={(sa) => {
          if (sa) {
            this.props.onFormSubmit(sa, null);
          } else {
            console.log('TODO deal with null search addr', sa);
          }
        }}
        itemToString={(sa) => {
          return sa ? searchAddressToString(sa) : 'none';
        }}
      >
        {(downshift) => {
          const inputOptions: GetInputPropsOptions = {
            onChange: (e) => {
              const { value } = e.currentTarget;
              if (this.requester.changeSearchRequest(value)) {
                this.setState({ isLoading: true });
              } else {
                this.setState({ isLoading: false, results: [] });
              }
            }
          };

          return (
            <div className="AddressSearch">
              <div className="form-group col-xs-12">
                <div className="geosuggest">
                  <div className="geosuggest__input-wrapper">
                    <label {...downshift.getLabelProps()} />
                    <input className="geosuggest__input form-input" {...downshift.getInputProps(inputOptions)} />
                  </div>
                  <div className="geosuggest__suggests-wrapper">
                    {/* TODO: Conditionally add 'geosuggest__suggests--hidden' below if needed. */}
                    <ul className="geosuggest__suggests" {...downshift.getMenuProps()}>
                      {this.state.results.map((item, index) => {
                        // TODO: If this is the active item, we should apply the
                        // geosuggest__item--active class to it.
                        const label = searchAddressToString(item);
                        const props = downshift.getItemProps({
                          key: label,
                          index,
                          item
                        });
                        return <li className="geosuggest__item" {...props}><span>{label}</span></li>;
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        }}
      </GeoDownshift>
    );
  }
}
