import React from 'react';
import Helpers from 'util/helpers';
import 'styles/OwnersTable.css';

const OwnersTable = (props) => {

  let corps = [];
  let owners = [];
  let rbas = [];

  props.contacts.map(c => {

    // basic detection to filter out completely null addrs...
    // assume that it needs to at least have a streetname
    if(c.bisstreet) {
      rbas.push({ title: "Business Address", cat: "cat-rba", value: `${c.bisnum} ${c.bisstreet}${c.bisapt ? ' ' + c.bisapt : ''}, ${c.biszip}` });
    }

    if(c.corporationname) {
      corps.push({ title: "Corporate Owner", cat: "cat-corp", value: c.corporationname });
    }

    if(c.registrationcontacttype !== "CorporateOwner") {
      owners.push({ title: c.registrationcontacttype.split(/(?=[A-Z])/).join(" "), cat: "cat-owner", value: `${c.firstname} ${c.lastname}` });
    }

    // just using this to iterate. there's probably (definitely) a better way
    return c;
  });

  rbas = Helpers.uniq(rbas);
  owners = Helpers.uniq(owners);
  corps = Helpers.uniq(corps);

  // const contacts = [...corps, ...owners, ...rbas].map((obj, idx) => (
  //   <span className={`label ${obj.cat}`} key={idx}>
  //     <small>{obj.title}</small>
  //     <h6>{obj.value}</h6>
  //   </span>
  // ));

  // let hasJustFixUsersWarning = null;
  // // let hasJustFixUsersWarning = <br />;
  // if(props.hasJustFixUsers) {
  //   hasJustFixUsersWarning = <p className="mt-10 text-center text-bold text-danger text-large">This landlord has at least one active JustFix.nyc case!</p>
  // }

  if(!props.contacts.length) {
    return ( null );
  } else {
    return (
      <div className="OwnersTable">
        <div className="container">
          <div className="columns">
            <div className="column col-3">
              <p>Business Addresses</p>
              <ul>
                {rbas.map((rba, idx) => <li key={idx}>{rba.value}</li>)}
              </ul>
            </div>
            <div className="column col-3">
              <p>Shell Companies</p>
              <ul>
                {corps.map((corp, idx) => <li key={idx}>{corp.value}</li>)}
              </ul>
            </div>
            <div className="column col-6">
              <p>People</p>
              <ul className="owners">
                {owners.map((owner, idx) => <li key={idx}>{owner.title}: {owner.value}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }


}
export default OwnersTable;
