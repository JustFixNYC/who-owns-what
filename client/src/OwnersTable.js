import React from 'react';

const OwnersTable = (props) => {

  const contacts = props.contacts.map((contact, idx) => (
    <tr key={idx}>
      <td>{contact.registrationcontacttype}</td>
      <td>{contact.corporationname}</td>
      <td>{contact.firstname + ' ' + contact.lastname}</td>
      <td>
        {contact.bisnum + ' ' +
          contact.bisstreet + ' ' +
          '#' + contact.bisapt + ', ' +
          contact.biszip}
      </td>
      <td>{contact.registrationid}</td>
    </tr>
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
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Type</th>
              <th>Corp. Name</th>
              <th>Name</th>
              <th>Business Address</th>
              <th>Reg. ID</th>
            </tr>
          </thead>
          <tbody>
            {contacts}
          </tbody>
        </table>
        {hasJustFixUsersWarning}
      </div>
    );
  }


}
export default OwnersTable;
