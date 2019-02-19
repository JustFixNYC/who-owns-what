import React from 'react';

export interface SearchAddress {
  /** The house number, e.g. '654'. */
  housenumber: String,

  /** The street name, e.g. 'PARK PLACE'. */
  streetname: String,

  /** The all-uppercase borough name, e.g. 'BROOKLYN'. */
  boro: String,
}

export interface NewAddressSearchProps extends SearchAddress {
  onFormSubmit: (searchAddress: SearchAddress, error: any) => void,
}

export default class NewAddressSearch extends React.Component<NewAddressSearchProps> {
  render() {
    return (
      <button className="btn" onClick={() => {
        this.props.onFormSubmit({
          housenumber: '654',
          streetname: 'PARK PLACE',
          boro: 'BROOKLYN'
        }, null);
      }}>Simulate address submission</button>
    );
  }
}
