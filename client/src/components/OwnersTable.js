import React from 'react';
import { uniq } from 'util/helpers';
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

    return c;
  });

  rbas = uniq(rbas);
  owners = uniq(owners);
  corps = uniq(corps);

  const contacts = [...corps, ...owners, ...rbas].map((obj, idx) => (
    <span className={`label ${obj.cat}`} key={idx}>
      <small>{obj.title}</small>
      <h6>{obj.value}</h6>
    </span>
  ));

  let hasJustFixUsersWarning = null;
  if(props.hasJustFixUsers) {
    hasJustFixUsersWarning = <p className="mt-10 text-center text-bold text-danger text-large">This landlord has at least one active JustFix.nyc case!</p>
  }

  if(!contacts.length) {
    return ( null );
  } else {
    return (
      <div>
        <div className="contacts">
          {contacts}
        </div>
        {hasJustFixUsersWarning}
      </div>
    );
  }


}
export default OwnersTable;
