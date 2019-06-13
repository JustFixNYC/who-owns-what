import React from 'react';
import Downshift, { DownshiftInterface, GetInputPropsOptions, ControllerStateAndHelpers } from 'downshift';
import { GeoSearchRequester, GeoSearchResults } from '../util/geo-autocomplete-base';

import '../styles/AddressSearch.css';

const GeoDownshift = Downshift as DownshiftInterface<SearchAddress>;

const KEY_ENTER = 13;

const KEY_TAB = 9;

export interface SearchAddress {
  /**
   * The house number, e.g. '654'. It can be undefined,
   * e.g. for NYCHA properties.
   */
  housenumber?: string,

  /** The street name, e.g. 'PARK PLACE'. */
  streetname: string,

  /** The all-uppercase borough name, e.g. 'BROOKLYN'. */
  boro: string,

  /** The padded BBL, e.g. '1234567890'. */
  bbl: string
}

export interface AddressSearchProps extends SearchAddress {
  onFormSubmit: (searchAddress: SearchAddress, error: any) => void,
  labelText: string,
  labelClass: string
}

type State = {
  isLoading: boolean,
  results: SearchAddress[]
};

/**
 * Return an empty search address.
 * 
 * This could just be a constant but I'm not confident that the
 * code which calls it won't mutate it, so we'll just create a
 * new one every time. -AV
 */
export function makeEmptySearchAddress(): SearchAddress {
  return {
    housenumber: '',
    streetname: '',
    boro: '',
    bbl: ''
  };
}

function toSearchAddresses(results: GeoSearchResults): SearchAddress[] {
  return results.features.map(feature => {
    const sa: SearchAddress = {
      housenumber: feature.properties.housenumber,
      streetname: feature.properties.street,
      boro: feature.properties.borough.toUpperCase(),
      bbl: feature.properties.pad_bbl
    };
    return sa;
  });
}

export function searchAddressToString(sa: SearchAddress): string {
  const prefix = sa.housenumber ? `${sa.housenumber} ` : '';
  return `${prefix}${sa.streetname}, ${sa.boro}`;
}

export default class AddressSearch extends React.Component<AddressSearchProps, State> {
  requester: GeoSearchRequester;

  constructor(props: AddressSearchProps) {
    super(props);
    this.state = {
      isLoading: false,
      results: []
    };
    this.requester = new GeoSearchRequester({
      onError: (e) => {
        this.props.onFormSubmit(makeEmptySearchAddress(), e);
      },
      onResults: (results) => {
        this.setState({
          isLoading: false,
          results: toSearchAddresses(results)
        });
      }
    });
  }

  componentWillUnmount() {
    this.requester.shutdown();
  }

  handleInputValueChange(value: string) {
    if (this.requester.changeSearchRequest(value)) {
      this.setState({ isLoading: true });
    } else {
      this.setState({ isLoading: false, results: [] });
    }
  }

  /**
   * If the result list is non-empty and visible, and the user hasn't selected
   * anything, select the first item in the list and return true.
   *
   * Otherwise, return false.
   */
  selectFirstResult(ds: ControllerStateAndHelpers<SearchAddress>): boolean {
    const { results } = this.state;
    if (ds.highlightedIndex === null && ds.isOpen && results.length > 0) {
      ds.selectItem(results[0]);
      return true;
    }
    return false;
  }

  handleAutocompleteKeyDown(ds: ControllerStateAndHelpers<SearchAddress>, event: React.KeyboardEvent) {
    if (event.keyCode === KEY_ENTER || event.keyCode === KEY_TAB) {
      if (this.selectFirstResult(ds)) {
        event.preventDefault();
      }
    }
  }

  render() {
    return (
      <GeoDownshift
        stateReducer={(state, changes) => {
          switch (changes.type) {
            case Downshift.stateChangeTypes.mouseUp:
            case Downshift.stateChangeTypes.touchEnd:
            case Downshift.stateChangeTypes.blurInput:
            // By default, Downshift clears the input value,
            // but we don't want to lose user data, so we'll
            // override that behavior here.
            return {
              ...changes,
              inputValue: state.inputValue,
            };

            default:
            return changes;
          }
        }}
        onChange={(sa) => {
          if (sa) {
            this.props.onFormSubmit(sa, null);
          }
          // TODO: I am very unclear on what it means for `sa` to be null,
          // and the docs don't seem to provide any guidance on the matter.
          // There's no meaningful value for us to pass to `onFormSubmit` in
          // this case, so we will just do nothing.
        }}
        itemToString={(sa) => {
          return sa ? searchAddressToString(sa) : '';
        }}
      >
        {(downshift) => {
          const inputOptions: GetInputPropsOptions = {
            onKeyDown: (e) => this.handleAutocompleteKeyDown(downshift, e),
            onChange: (e) => this.handleInputValueChange(e.currentTarget.value)
          };
          const suggestsClasses = ['geosuggest__suggests'];
          if (!(downshift.isOpen && this.state.results.length > 0)) {
            suggestsClasses.push('geosuggest__suggests--hidden');
          }

          return (
            <div className="AddressSearch">
              <div className="form-group col-xs-12">
                <div className="geosuggest">
                  <div className="geosuggest__input-wrapper">
                    <label className={this.props.labelClass} {...downshift.getLabelProps()}>{this.props.labelText}</label>
                    <input placeholder="Search places" className="geosuggest__input form-input" {...downshift.getInputProps(inputOptions)} />
                  </div>
                  <div className="geosuggest__suggests-wrapper">
                    <ul className={suggestsClasses.join(' ')} {...downshift.getMenuProps()}>
                      {this.state.results.map((item, index) => {
                        const classes = ['geosuggest__item'];
                        if (downshift.highlightedIndex === index) {
                          classes.push('geosuggest__item--active');
                        }
                        const label = searchAddressToString(item);
                        const props = downshift.getItemProps({
                          key: label,
                          index,
                          item
                        });
                        return <li className={classes.join(' ')} {...props}><span>{label}</span></li>;
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
