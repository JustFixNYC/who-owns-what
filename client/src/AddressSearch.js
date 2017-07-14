import React from 'react';
import './AddressSearch.css';

const AddressSearch = (props) => {
  return (
    <div className="AddressSearch">
      <form onSubmit={props.onFormSubmit}>
        <label>
          Street number:
          <input
            type="text"
            name="housenumber"
            value={props.address.housenumber}
            onChange={props.onInputChange}
          />
        </label>
        <label>
          Street name:
          <input
            type="text"
            name="streetname"
            value={props.address.streetname}
            onChange={props.onInputChange}
          />
        </label>
        <label>
          Borough:
          <select name="boro" value={props.address.boro} onChange={props.onInputChange}>
            <option value="BROOKLYN">Brooklyn</option>
            <option value="MANHATTAN">Manhattan</option>
            <option value="QUEENS">Queens</option>
            <option value="BRONX">Bronx</option>
            <option value="STATEN ISLAND">Staten Island</option>
          </select>
        </label>
        <input type="submit" value="Go" />
      </form>
    </div>
  );
}
export default AddressSearch;
