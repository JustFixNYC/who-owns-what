import React from 'react';
import helpers, { MaybeStringyNumber } from '../util/helpers';
import { Plural } from '@lingui/react';

const Evictions: React.FC<{count: number}> = ({ count }) => <Plural
  value={count}
  one="one eviction"
  other="# evictions"
/>;

export const EvictionsSummary: React.FC<{
  totalevictions: MaybeStringyNumber,
  evictionsaddr: {
    housenumber: string,
    streetname: string,
    boro: string,
    evictions: MaybeStringyNumber,
  }|null|undefined,
}> = props => {
  const totalEvictions = helpers.coerceToInt(props.totalevictions, 0);
  const building = props.evictionsaddr;

  return <p>
    In 2018, NYC Marshals scheduled <Evictions count={totalEvictions} /> across this portfolio.{" "}
    {building && <>
      The building with the most evictions was&nbsp;
      <b>{building.housenumber} {building.streetname}, {building.boro}</b>{" "}
      with <Evictions count={totalEvictions} /> that year.
    </>}
  </p>;
}
