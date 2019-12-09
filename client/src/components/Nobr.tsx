// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nobr

export const Nobr: React.FC<{}> = (props) => 
  <span style={{whiteSpace: 'nowrap'}}>{props.children}</span>;
