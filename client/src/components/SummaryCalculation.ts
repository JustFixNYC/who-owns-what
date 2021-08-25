import _ from "lodash";
import helpers from "util/helpers";
import { AddressLocation, AddressRecord, SummaryStatsRecord } from "./APIDataTypes";

export const getTopFiveContactsInPortfolio = (addrs: AddressRecord[]) => {
  const allContactNames = helpers.flattenArray(
    addrs.map((a) => a.ownernames?.map((ownername) => ownername.value) || [])
  );

  return helpers.getMostCommonElementsInArray(allContactNames, 5);
};

export const extractLocationDataFromAddr = (addr: AddressRecord): AddressLocation => {
  return (({ boro, housenumber, lat, lng, streetname }) => ({
    boro,
    housenumber,
    lat,
    lng,
    streetname,
  }))({
    ...addr,
  });
};

export const calculateAggDataFromAddressList = (addrs: AddressRecord[]): SummaryStatsRecord => {
  const bldgs = addrs.length;
  const units = _.sumBy(addrs, (a) => a.unitsres || 0);

  const totalopenviolations = _.sumBy(addrs, (a) => a.openviolations);
  const totalviolations = _.sumBy(addrs, (a) => a.totalviolations);

  const totalevictions = _.sumBy(addrs, (a) => a.evictions || 0);

  /**
   * Sum of all cases in the portfolio where a building's RS unit count _increased_
   * Negative values (losses in RS unit) are filtered out of the sum
   */
  const totalrsgain = _.sumBy(addrs, (a) => (a.rsdiff && a.rsdiff > 0 ? a.rsdiff : 0));
  /**
   * Sum of all cases in the portfolio where a building's RS unit count _decreased_
   * Positive values (gains in RS unit) are filtered out of the sum
   */
  const totalrsloss = _.sumBy(addrs, (a) => (a.rsdiff && a.rsdiff < 0 ? a.rsdiff : 0));
  /**
   * Net change in RS unit count across the portfolio
   */
  const totalrsdiff = totalrsgain + totalrsloss;

  const addrWithBiggestRsLoss = addrs.reduce((a1, a2) =>
    (a1.rsdiff || 0) < (a2.rsdiff || 0) ? a1 : a2
  );

  const addrWithMostEvictions = addrs.reduce((a1, a2) =>
    (a1.evictions || 0) > (a2.evictions || 0) ? a1 : a2
  );

  const addrWithMostOpenViolations = addrs.reduce((a1, a2) =>
    (a1.openviolations || 0) > (a2.openviolations || 0) ? a1 : a2
  );

  const allBusinessAddrs = helpers.flattenArray(addrs.map((addr) => addr.businessaddrs || []));
  const allCorpNames = helpers.flattenArray(addrs.map((addr) => addr.corpnames || []));

  return {
    bldgs,
    units,
    age: new Date().getFullYear() - _.meanBy(addrs, (a) => a.yearbuilt),
    topowners: getTopFiveContactsInPortfolio(addrs),
    topcorp: helpers.getMostCommonElementsInArray(allCorpNames, 1)[0] || null,
    topbusinessaddr: helpers.getMostCommonElementsInArray(allBusinessAddrs, 1)[0] || null,
    totalopenviolations,
    totalviolations,
    openviolationsperbldg: totalopenviolations / bldgs,
    openviolationsperresunit: totalopenviolations / units,
    totalevictions,
    avgevictions: totalevictions / bldgs,
    totalrsgain,
    totalrsloss,
    totalrsdiff,
    rsproportion: (Math.abs(totalrsdiff) / units) * 100,
    rslossaddr: {
      rsdiff: addrWithBiggestRsLoss.rsdiff,
      ...extractLocationDataFromAddr(addrWithBiggestRsLoss),
    },
    evictionsaddr: {
      evictions: addrWithMostEvictions.evictions,
      ...extractLocationDataFromAddr(addrWithMostEvictions),
    },
    violationsaddr: {
      openviolations: addrWithMostOpenViolations.openviolations,
      ...extractLocationDataFromAddr(addrWithMostOpenViolations),
    },
  };
};
