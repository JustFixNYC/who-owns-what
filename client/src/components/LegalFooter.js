import React, { Component } from 'react';
import {NavLink} from 'react-router-dom';
import 'styles/LegalFooter.css';

class LegalFooter extends Component {
	render() { 

		return (
		<div className="LegalFooter">
          <nav className="inline">
            <NavLink to="/terms-of-use">Terms of Use</NavLink>
            <NavLink to="/privacy-policy">Privacy Policy</NavLink>
          </nav>
        </div>)
	}
}

export default LegalFooter