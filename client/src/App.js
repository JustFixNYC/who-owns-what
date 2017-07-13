import React, { Component } from 'react';
import LandlordSearch from './LandlordSearch';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h2>Who owns what in nyc.</h2>
        </div>
        <div className="App-intro">
          <LandlordSearch />
        </div>
      </div>
    );
  }
}

export default App;
