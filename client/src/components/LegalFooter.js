import React, { Component } from 'react';
import {NavLink} from 'react-router-dom';

import 'styles/LegalFooter.css';

class LegalFooter extends Component {
	render() { 

		return (
		<div className="Footer LegalFooter">
          <nav className="inline">
            <NavLink to="/terms-of-use">Terms of Use</NavLink>
            <NavLink to="/privacy-policy">Privacy Policy</NavLink>
          </nav>
          <nav className="inline">Made with NYC ♥ by the team at <a href="https://www.justfix.nyc/" target="_blank">JustFix.nyc</a></nav>
        </div>)
	}
}

export default LegalFooter