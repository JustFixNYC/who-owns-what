import _ from "lodash";
import helpers from "util/helpers";
import {
  AddressLocation,
  AddressRecord,
  HpdComplaintCount,
  SummaryStatsRecord,
} from "./APIDataTypes";

export const getTopFiveContactsInPortfolio = (addrs: AddressRecord[]) => {
  const allContactNames = helpers.flattenArray(
    addrs.map((a) => a.ownernames?.map((ownername) => ownername.value) || [])
  );

  return helpers.getMostCommonElementsInArray(allContactNames, 5);
};

export const NUM_COMPLAINT_TYPES_TO_SHOW = 3;

export const getTopComplaintTypesInPortfolio = (addrs: AddressRecord[]) => {
  // Generate array of all HpdComplaintCount objects across entire portfolio
  const allComplaintTypes = helpers.flattenArray(
    addrs.map((addr) => addr.recentcomplaintsbytype || [])
  ) as HpdComplaintCount[];

  // Group complaint counts by type into one large object
  const complaintCountsGroupedByType = allComplaintTypes.reduce((obj, el) => {
    obj[el.type] = (obj[el.type] || 0) + el.count;
    return obj;
  }, {} as { [key: string]: number });

  // Restructure the grouped object into an array of HpdComplaintCount objects,
  // sorted by count
  const complaintTypesSortedByCount = _.toPairs(complaintCountsGroupedByType)
    .map((a) => {
      return {
        type: a[0],
        count: a[1],
      };
    })
    .sort((a, b) => b.count - a.count);

  return complaintTypesSortedByCount.slice(0, NUM_COMPLAINT_TYPES_TO_SHOW);
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

  const totalcomplaints = _.sumBy(addrs, (a) => a.totalcomplaints);
  const totalrecentcomplaints = _.sumBy(addrs, (a) => a.recentcomplaints);

  const totalevictions = _.sumBy(addrs, (a) => a.evictions || 0);
  const totalevictionfilings = _.sumBy(addrs, (a) => a.evictionfilings || 0);

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

  const addrWithMostEvictionFilings = addrs.reduce((a1, a2) =>
    (a1.evictionfilings || 0) > (a2.evictionfilings || 0) ? a1 : a2
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
    totalhpdcomplaints: totalcomplaints,
    totalrecenthpdcomplaints: totalrecentcomplaints,
    recenthpdcomplaintsbytype: getTopComplaintTypesInPortfolio(addrs),
    totalopenviolations,
    totalviolations,
    openviolationsperbldg: totalopenviolations / bldgs,
    openviolationsperresunit: totalopenviolations / units,
    totalevictions,
    totalevictionfilings,
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
    evictionfilingsaddr: {
      filings: addrWithMostEvictionFilings.evictionfilings,
      ...extractLocationDataFromAddr(addrWithMostEvictionFilings),
    },
    violationsaddr: {
      openviolations: addrWithMostOpenViolations.openviolations,
      ...extractLocationDataFromAddr(addrWithMostOpenViolations),
    },
  };
};
