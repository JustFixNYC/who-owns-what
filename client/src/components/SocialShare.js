import React from 'react';
import { FacebookButton, TwitterButton, EmailButton } from 'react-social';

import fbIcon from '../assets/img/fb.svg';
import twitterIcon from '../assets/img/twitter.svg';

const SocialShare = (props) => {

  return (
    <div className="btn-group btns-social btn-group-block">
     <FacebookButton
       onClick={() => {window.gtag('event', 'facebook-' + props.location);}}
       className="btn btn-steps"
       sharer={true}
       windowOptions={['width=400', 'height=200']}
       url='https://whoownswhat.justfix.nyc/'
       appId={`247990609143668`}>
       <img src={fbIcon} className="icon mx-1" alt="Facebook" />
       <span>Facebook</span>
     </FacebookButton>
     <TwitterButton
       onClick={() => {window.gtag('event', 'twitter-' + props.location);}}
       className="btn btn-steps"
       windowOptions={['width=400', 'height=200']}
       url="https://whoownswhat.justfix.nyc/"
       message={`#WhoOwnsWhat @JustFixNYC`}
       >
       <img src={twitterIcon} className="icon mx-1" alt="Twitter" />
       <span>Twitter</span>
     </TwitterButton>
     <EmailButton
       onClick={() => {window.gtag('event', 'email-' + props.location);}}
       className="btn btn-steps"
       url='https://whoownswhat.justfix.nyc/'
       target="_blank"
       message="New JustFix.nyc tool helps research on NYC landlords">
       <i className="icon icon-mail mx-2" />
       <span>Email</span>
     </EmailButton>
    </div>
  );

}
export default SocialShare;
