import React from 'react';
import Helpers from 'util/helpers';
import 'styles/OwnersTable.css';

import _isEmpty from 'lodash/isEmpty';

const OwnersTable = (props) => {

  // let hasJustFixUsersWarning = null;
  // // let hasJustFixUsersWarning = <br />;
  // if(props.hasJustFixUsers) {
  //   hasJustFixUsersWarning = <p className="mt-10 text-center text-bold text-danger text-large">This landlord has at least one active JustFix.nyc case!</p>
  // }

  if(_isEmpty(props.addr)) {
    return ( null );
  } else {
    return (
      <div className="OwnersTable">
        <div className="container">
          <div className="columns">
            <div className="column col-3">
              <p>Business Addresses</p>
              <ul>
                {props.addr.businessaddrs.map((rba, idx) => <li key={idx}>{rba}</li>)}
              </ul>
            </div>
            <div className="column col-3">
              <p>Shell Companies</p>
              <ul>
                {props.addr.corpnames.map((corp, idx) => <li key={idx}>{corp}</li>)}
              </ul>
            </div>
            <div className="column col-6">
              <p>People</p>
              <ul className="owners">
                {props.addr.ownernames.map((owner, idx) => <li key={idx}>{owner.title.split(/(?=[A-Z])/).join(" ")}: {owner.value}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }


}
export default OwnersTable;
