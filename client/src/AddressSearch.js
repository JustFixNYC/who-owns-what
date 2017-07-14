import React from 'react';
import './AddressSearch.css';

const AddressSearch = (props) => {
  return (
    <div className="AddressSearch">
      <form onSubmit={props.onFormSubmit}>
        <div className="form-group col-xs-12">
          <label className="form-label" htmlFor="housenumber">House number:</label>
          <input
            type="text"
            className="form-input"
            name="housenumber"
            id="housenumber"
            value={props.address.housenumber}
            onChange={props.onInputChange}
          />
        </div>
        <div className="form-group col-xs-12">
          <label className="form-label" htmlFor="streetname">Street name:</label>
          <input
            type="text"
            className="form-input"
            name="streetname"
            id="streetname"
            value={props.address.streetname}
            onChange={props.onInputChange}
          />
        </div>
        <div className="form-group col-xs-12">
          <label className="form-label" htmlFor="boro">Borough:</label>
          <select
            className="form-select"
            name="boro"
            id="boro"
            value={props.address.boro}
            onChange={props.onInputChange}
          >
            <option value="">Choose a borough</option>
            <option value="BROOKLYN">Brooklyn</option>
            <option value="MANHATTAN">Manhattan</option>
            <option value="QUEENS">Queens</option>
            <option value="BRONX">Bronx</option>
            <option value="STATEN ISLAND">Staten Island</option>
          </select>
        </div>
        <div className="form-group">
          <input className="btn btn-primary" type="submit" value="Search" />
        </div>
      </form>
    </div>
  );
}
export default AddressSearch;
