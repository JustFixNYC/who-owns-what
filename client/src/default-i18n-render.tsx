import React from 'react';

export function defaultI18nRender(props: {translation: string}): JSX.Element {
  // For some reason using a React fragment here fails with:
  //
  //   React.createElement: type is invalid -- expected a string (for built-in components)
  //   or a class/function (for composite components) but got: undefined. You likely forgot
  //   to export your component from the file it's defined in.
  //
  // I think this has to do with the way that we're being called by lingui.

  return <span>{props.translation}</span>;
}
