import React from 'react';

import 'styles/Loader.css';

const Loader: React.FC<{
  classNames?: string,
  loading: boolean
}> = (props) => {

  const loader = (
    <div className={`Loader ${ props.classNames }`}>
      <div className="Loader__content">
        <p>{props.children}</p>
      </div>
    </div>
  );

  // ideally this should return props.children, but instead this version
  // works as a sibling to the element thats loading...
  if(!props.loading) return null;
  else return loader;
}
export default Loader;
