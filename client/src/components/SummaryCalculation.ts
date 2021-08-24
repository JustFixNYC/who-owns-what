import _ from "lodash";
import helpers from "util/helpers";
import { AddressRecord, SummaryStatsRecord } from "./APIDataTypes";

const getTopFiveContactsInPortfolio = (addrs: AddressRecord[]) => {
  const allContactNames = addrs
    .map((a) => a.ownernames?.map((ownername) => ownername.value) || [])
    .flat();

  return helpers.getMostCommonElementsInArray(allContactNames, 5);
};

export const calculateAggDataFromAddressList = (addrs: AddressRecord[]): SummaryStatsRecord => {
  const bldgs = addrs.length;
  const units = _.sumBy(addrs, (a) => a.unitsres || 0);

  const totalopenviolations = _.sumBy(addrs, (a) => a.openviolations);
  const totalviolations = _.sumBy(addrs, (a) => a.totalviolations);

  const totalevictions = _.sumBy(addrs, (a) => a.evictions || 0);

  const totalrsgain = _.sumBy(addrs, (a) => (a.rsdiff && a.rsdiff > 0 ? a.rsdiff : 0));
  const totalrsloss = _.sumBy(addrs, (a) => (a.rsdiff && a.rsdiff < 0 ? a.rsdiff : 0));
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

  const allBusinessAddrs = addrs.map((addr) => addr.businessaddrs || []).flat();
  const allCorpNames = addrs.map((addr) => addr.corpnames || []).flat();

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
    rslossaddr: { ...addrWithBiggestRsLoss },
    evictionsaddr: { ...addrWithMostEvictions },
    violationsaddr: { ...addrWithMostOpenViolations },
  };
};
