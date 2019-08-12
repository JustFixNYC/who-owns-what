import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import LegalFooter from 'components/LegalFooter';
import Helpers from 'util/helpers';
import APIClient from 'components/APIClient';
import SocialShare from 'components/SocialShare';

import 'styles/NotRegisteredPage.css';

export default class NychaPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      buildingInfo: null
    }
  }

  componentDidMount() {
    window.gtag('event', 'nycha-page');
    if(this.props.geosearch && this.props.geosearch.bbl && !this.state.buildingInfo) {
      const bbl = this.props.geosearch.bbl;
      APIClient.getBuildingInfo(bbl)
        .then(results => this.setState({ buildingInfo: results.result }))
        .catch(err => {window.Rollbar.error("API error on Not Registered page: Building Info", err, bbl);}
      );
    }
  }

  render() {
    const geosearch = this.props.geosearch;
    const searchAddress = this.props.searchAddress;
    const buildingInfo = (this.state.buildingInfo && this.state.buildingInfo.length > 0 ? this.state.buildingInfo[0] : null);

    let boro, block, lot;
    
    if(geosearch && geosearch.bbl) {
      ({ boro, block, lot } = Helpers.splitBBL(geosearch.bbl));
    }

    const bblDash = <span className="unselectable" unselectable="on">-</span>;
    
    const nycha = this.props.nychaData;
    const boroData = 
      (boro === '1' ? 
        { boroName: 'Manhattan',
          boroOfficeAddress1: '1980 Lexington Ave #1',
          boroOfficeAddress2: 'New York, NY 10035',
          boroOfficePhone: '(917) 206-3500'
        } :
      boro === '2' ? 
        { boroName: 'Bronx',
          boroOfficeAddress1: '1200 Water Pl, Suite #200',
          boroOfficeAddress2: 'Bronx, NY 10461',
          boroOfficePhone: '(718) 409-8626'
        } :
      boro === '3' ? 
        { boroName: 'Brooklyn',
          boroOfficeAddress1: '816 Ashford St',
          boroOfficeAddress2: 'Brooklyn, NY 11207',
          boroOfficePhone: '(718) 491-6967'
        } :
      boro === '4' || boro === '5' ? 
        { boroName: 'Queens',
          boroOfficeAddress1: '90-20 170th St, 1st Floor',
          boroOfficeAddress2: 'Jamaica, NY 11432',
          boroOfficePhone: '(718) 553-4700'
        } : null );

    const usersInputAddress = 
      (searchAddress && searchAddress.boro && (searchAddress.housenumber || searchAddress.streetname) ?
        { 
          boro: searchAddress.boro,
          housenumber: (searchAddress.housenumber || ' '),
          streetname: (searchAddress.streetname || ' ') 
        } :
        buildingInfo && buildingInfo.boro && (buildingInfo.housenumber || buildingInfo.streetname) ?
        { 
          boro: buildingInfo.boro,
          housenumber: (buildingInfo.housenumber || ' '),
          streetname: (buildingInfo.streetname || ' ') 
        } : 
        null );

    if(!geosearch && !buildingInfo) {
      return (
        <div className="NotRegisteredPage Page">
          <div className="HomePage__content">
            <div className="HomePage__search">
              <h5 className="mt-10 text-danger text-center text-bold text-large">
                No address found
              </h5>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="NotRegisteredPage Page">
        <div className="HomePage__content">
          <div className="HomePage__search">
            <h5 className="mt-10 text-center text-bold text-large">
              {nycha.development}: Public Housing Development
            </h5>
            <h6 className="mt-10 text-center text-bold text-large">
              This building is owned by the NYC Housing Authority (NYCHA)
            </h6>
            <div className="wrapper">
              <div className="card-body">
                <div className="card-body-table">
                  <div className="table-row">
                    <div title="The city borough where your search address is located">
                      <label>Borough</label>
                      { boroData && boroData.boroName }
                    </div>
                    <div title="The number of residential units across all buildings in this development, according to the Dept. of City Planning.">
                      <label>Units</label>
                      { nycha.dev_unitsres }
                    </div>
                    <div title="Evictions executed in this development by NYC Marshals in 2018. City Council, the Housing Data Coalition and Anti-Eviction Mapping Project cleaned, geocoded, and validated the data, originally sourced from DOI.">
                      <label>2018 Evictions</label>
                      { nycha.dev_evictions }
                    </div>
                  </div>
                </div>
                <div className="columns nycha-addresses">
                { boroData && 
                  <div className="column col-lg-12 col-6">
                    <div title="The NYCHA office overseeing your borough. Some experts suggest reaching out to Borough Management Offices to advocate for repairs, as they tend to have more administrative power than local management offices.">
                      <b>Borough Management Office:</b>
                    </div>
                      <ul>
                        <li>{boroData.boroOfficeAddress1}, {boroData.boroOfficeAddress2}</li>
                        <li>{boroData.boroOfficePhone}</li>
                      </ul>
                
                  </div> }
                  <div className="column col-lg-12 col-6">
                    <div title="The federal HUD office overseeing New York State. Some experts suggest reaching out to the Regional Office to advocate for repairs, as they tend to have more administrative power than local management offices." >
                      <b>New York Regional Office:</b>
                    </div>
                    <ul>
                      <li>26 Federal Plaza, New York, NY 10278</li>
                      <li>(212) 264-1290</li>
                      <li>complaints_office_02@hud.gov</li>
                    </ul>
                  </div>
                </div>
              </div>
            
                { buildingInfo && buildingInfo.latitude && buildingInfo.longitude &&
              <img src={`https://maps.googleapis.com/maps/api/streetview?size=800x200&location=${buildingInfo.latitude},${buildingInfo.longitude}&key=${process.env.REACT_APP_STREETVIEW_API_KEY}`}
                  alt="Google Street View" className="streetview img-responsive"  />
                }
              <div className="bbl-link">
                { geosearch && geosearch.bbl && buildingInfo ? (<span>Boro-Block-Lot (BBL): <nobr><a href={"https://zola.planning.nyc.gov/lot/"+boro + "/" + block + "/" + lot} target="_blank" rel="noopener noreferrer">{boro}{bblDash}{block}{bblDash}{lot}</a></nobr></span>):(<span></span>) }
              </div>
              <br />
              
                <div>
                  <p>Useful links:</p>
                  <div>
                    <div className="btn-group btn-group-block">
                      <a href="https://www.hud.gov/sites/documents/958.PDF" target="_blank" rel="noopener noreferrer" className="btn">HUD Complaint Form 958 &#8599;</a>
                      <a href="https://www1.nyc.gov/assets/nycha/downloads/pdf/Development-Guide-01142019.pdf" target="_blank" rel="noopener noreferrer" className="btn">NYCHA Facility Directory &#8599;</a>
                    </div>
                    <div className="btn-group btn-group-block">
                      <a href="https://www1.nyc.gov/site/nycha/mynycha/mynycha-landing.page" target="_blank" rel="noopener noreferrer" className="btn">MyNYCHA App &#8599;</a>
                      <a href={`http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${boro}&block=${block}&lot=${lot}`} target="_blank" rel="noopener noreferrer" className="btn">DOB Building Profile &#8599;</a>
                    </div>
                  </div>
                </div>

                <div className="justfix-cta">
                  <p>Are you having issues in this development?</p>
                  <a onClick={() => {window.gtag('event', 'take-action-nycha-page');}} href={`https://app.justfix.nyc?utm_source=whoownswhat_nycha`} target="_blank" rel="noopener noreferrer" className="btn btn-justfix btn-block">Take action on JustFix.nyc!</a>
                </div>

                <div className="social-share">
                  <p>Share this page with your neighbors:</p>
                  <SocialShare 
                    location="nycha-page"
                    url={usersInputAddress && encodeURI('https://whoownswhat.justfix.nyc/address/' + usersInputAddress.boro + '/' + usersInputAddress.housenumber + '/' + usersInputAddress.streetname).replace(" ", "%20")} // Support for Android
                    />
                </div>
    

              <br />
              {/* <div className="toast toast-error">
                <u>Note:</u> We're currently experiencing some difficulties due to an official NYC data service failing. We're working on it. If a search returns with "no results found", try it again in a minute or so!
              </div> */}
              <br />

              <Link className="btn btn-primary btn-block" to="/">
                &lt;-- Search for a different address
              </Link>
            </div>
          </div>
        </div>
        <LegalFooter />
      </div>
    );
    
  }
}
