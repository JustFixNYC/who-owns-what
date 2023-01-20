import React from "react";
import Page from "components/Page";
import { SearchAddressWithoutBbl } from "components/APIDataTypes";
import { Link } from "react-router-dom";
import { createRouteForAddressPage, createRouteForFullBbl } from "routes";

type AddressExampleProps = SearchAddressWithoutBbl & {
  desc: string;
};

const ADDRESS_EXAMPLES: AddressExampleProps[] = [
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

const AddressExample: React.FC<AddressExampleProps> = (props: AddressExampleProps) => {
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
  const fullBllUrl = createRouteForFullBbl("3012380016");

  return (
    <Page title="Developer documentation">
      <div className="AboutPage Page">
        <div className="Page__content">
          <h1>Developer documentation</h1>
          <p>
            If you're having trouble developing the app, check out the{" "}
            <a href="https://github.com/JustFixNYC/who-owns-what#readme">README</a> and{" "}
            <a href="https://github.com/JustFixNYC/who-owns-what/wiki">project wiki</a>! Also feel
            free to <a href="https://github.com/JustFixNYC/who-owns-what/issues">file an issue</a>.
          </p>
          <h2>Things to try</h2>
          <p>
            The following can be used to help develop Who Owns What and roughly constitute a manual
            test suite for the app.
          </p>
          <h3>A panoply of addresses</h3>
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
          <h3>BBL routes</h3>
          <p>
            Who Owns What offers a BBL-based route that can be used by housing organizers and other
            websites to link to WoW if they only have a BBL. Here's an example:
          </p>
          <p>
            <Link to={fullBllUrl}>{fullBllUrl}</Link>
          </p>
        </div>
      </div>
    </Page>
  );
};
