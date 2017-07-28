import React from 'react';
import './OwnersTable.css';


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

    if(c.registrationcontacttype === "CorporateOwner") {
      corps.push({ title: "Corporate Owner", cat: "cat-corp", value: c.corporationname });
    } else {
      owners.push({ title: c.registrationcontacttype.split(/(?=[A-Z])/).join(" "), cat: "cat-owner", value: `${c.firstname} ${c.lastname}` });
    }
  });

  // filter repeated values in rbas and owners
  // uses Set which enforces uniqueness
  // see: https://stackoverflow.com/a/44601543/991673
  rbas = Array.from(new Set(rbas.map(JSON.stringify))).map(JSON.parse);
  owners = Array.from(new Set(owners.map(JSON.stringify))).map(JSON.parse);

  const contacts = [...corps, ...owners, ...rbas].map((obj, idx) => (
    <span className={`label ${obj.cat}`} key={idx}>
      <small>{obj.title}</small>
      <h5>{obj.value}</h5>
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
