// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nobr
import React from 'react';

export const Nobr: React.FC<{}> = (props) => 
  <span style={{whiteSpace: 'nowrap'}}>{props.children}</span>;
