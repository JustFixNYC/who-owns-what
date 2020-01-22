import React from 'react';
import helpers, { MaybeStringyNumber } from '../util/helpers';
import { Trans, Plural } from '@lingui/macro';

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
  const buildingTotalEvictions = helpers.coerceToInt(building && building.evictions, 0);

  return <p>
    <Trans>In 2018, NYC Marshals scheduled <Plural value={totalEvictions} one="one eviction" other="# evictions" /> across this portfolio.</Trans>
    {" "}
    {building && <Trans>
      The building with the most evictions was <b>{building.housenumber} {building.streetname}, {building.boro}</b> with <Plural value={buildingTotalEvictions} one="one eviction" other="# evictions" /> that year.
    </Trans>}
  </p>;
}
