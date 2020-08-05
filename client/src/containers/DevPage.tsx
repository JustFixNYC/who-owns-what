import React from "react";
import Page from "components/Page";
import { SearchAddressWithoutBbl } from "components/APIDataTypes";
import { Link } from "react-router-dom";
import { createRouteForAddressPage } from "routes";

type AddressExample = SearchAddressWithoutBbl & {
  desc: string;
};

const ADDRESS_EXAMPLES: AddressExample[] = [
  {
    desc: "HPD registered",
    housenumber: "654",
    streetname: "PARK PLACE",
    boro: "BROOKLYN",
  },
  {
    desc: "Not HPD registered, and shouldn't be",
    housenumber: "150",
    streetname: "COURT STREET",
    boro: "BROOKLYN",
  },
  {
    desc: "Not HPD registered, and possibly should be",
    housenumber: "70",
    streetname: "POILLON AVENUE",
    boro: "STATEN ISLAND",
  },
  {
    desc: "NYCHA",
    housenumber: "237",
    streetname: "NASSAU STREET",
    boro: "BROOKLYN",
  },
  {
    desc: "RAD-Converted NYCHA",
    housenumber: "510",
    streetname: "EAST 144 STREET",
    boro: "BRONX",
  },
];

const AddressExample: React.FC<AddressExample> = (props) => {
  return (
    <p>
      <strong>{props.desc}</strong> -{" "}
      <Link to={createRouteForAddressPage(props)}>
        {props.housenumber} {props.streetname}, {props.boro}
      </Link>
    </p>
  );
};

export const DevPage: React.FC<{}> = () => {
  return (
    <Page title="Developer tools">
      <div className="AboutPage Page">
        <div className="Page__content">
          <h1>Developer tools</h1>
          <h2>A panoply of addresses</h2>
          <p>
            The following addresses cover a wide range of data that WoW will present to users in
            different ways. Make sure that they all behave as expected!
          </p>
          <ul>
            {ADDRESS_EXAMPLES.map((ae) => (
              <li key={ae.desc}>
                <AddressExample {...ae} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Page>
  );
};
