import React, { Component } from 'react';
import {NavLink} from 'react-router-dom';
import Subscribe from 'components/Subscribe';

import 'styles/LegalFooter.css';

class LegalFooter extends Component {
	render() { 

		return (
		<div className="LegalFooter">
          <nav className="inline">
            <NavLink to="/terms-of-use">Terms of Use</NavLink>
            <NavLink to="/privacy-policy">Privacy Policy</NavLink>
          </nav>
          <Subscribe />
        </div>)
	}
}

export default LegalFooter