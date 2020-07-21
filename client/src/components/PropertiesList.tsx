import React from "react";
import ReactTable from "react-table";
import Browser from "../util/browser";

import Helpers from "../util/helpers";
import "react-table/react-table.css";
import "styles/PropertiesList.css";
import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";
import { t } from "@lingui/macro";
import { Link } from "react-router-dom";
import { SupportedLocale } from "../i18n-base";

type Addr = {
  housenumber: string;
  streetname: string;
  zip: string;
  boro: string;
  bbl: string;
  yearbuilt: number;
  unitsres: number;
  rsunits2007: number;
  rsunits2017: number;
  openviolations: number;
  totalviolations: number;
  evictions: string | null;
  ownernames: { title: string; value: string }[];
  lastsaledate: string;
  lastsaleamount: string;
  lastsaleacrisid: string;
};
/*
const formatDate = (dateString: string, locale?: SupportedLocale) => {
  var date = new Date(dateString);
  var options = { year: "numeric", month: "short", day: "numeric" };
  return date.toLocaleDateString(locale || "en", options);
};
*/
export const isPartOfGroupSale = (saleId: string, addrs: Addr[]) => {
  const addrsWithMatchingSale = addrs.filter((addr) => addr.lastsaleacrisid === saleId);
  return addrsWithMatchingSale.length > 1;
};

const PropertiesListWithoutI18n: React.FC<{
  i18n: I18n;
  addrs: Addr[];
  onOpenDetail: (addr: Addr) => void;
  generateBaseUrl: () => string;
}> = (props) => {
  const { i18n } = props;
  const locale = (i18n.language as SupportedLocale) || "en";
  if (!props.addrs.length) {
    return null;
  } else {
    return (
      <div className="PropertiesList">
        <ReactTable
          data={props.addrs}
          minRows={Browser.isMobile() ? 5 : 10}
          defaultPageSize={props.addrs.length}
          showPagination={false}
          columns={[
            // {
            //   Header: () => {
            //     return (
            //       <svg version="1.1" x="0px" y="0px" viewBox="0 0 100 125" width="15"><g transform="translate(0,-952.36218)"><path d="m 47,961.36217 0,10.1875 c -14.6904,1.4232 -26.4206,13.1221 -27.8438,27.8125 l -10.1561999,0 0,6.00003 10.1561999,0 c 1.4113,14.7032 13.1442,26.4197 27.8438,27.8437 l 0,10.1563 6,0 0,-10.1563 c 14.6995,-1.424 26.4325,-13.1405 27.8438,-27.8437 l 10.1562,0 0,-6.00003 -10.1562,0 C 79.4206,984.67177 67.6904,972.97287 53,971.54967 l 0,-10.1875 -6,0 z m 0,16.2187 0,9.7813 6,0 0,-9.7813 c 11.4332,1.3595 20.4531,10.3481 21.8125,21.7813 l -9.8125,0 0,6.00003 9.8125,0 C 73.4574,1016.8005 64.4368,1025.8148 53,1027.1747 l 0,-9.8125 -6,0 0,9.8125 c -11.4368,-1.3599 -20.4574,-10.3742 -21.8125,-21.8125 l 9.8125,0 0,-6.00003 -9.8125,0 C 26.5469,987.92897 35.5667,978.94037 47,977.58087 z" fill="#454d5d" fillOpacity="1" stroke="none" visibility="visible" display="inline" overflow="visible"/></g></svg>
            //     );
            //   },
            //   accessor: "bbl",
            //   maxWidth: 30,
            //   columns: [
            //     {
            //         Cell: row => {
            //           return (<input type="checkbox" />);
            //         }
            //     }
            //   ]
            // },
            {
              Header: i18n._(t`Location`),
              columns: [
                // {
                //   Header: 'Photo',
                //   accessor: 'bbl',
                //   Cell: row => {
                //     const lat = row.original.lat;
                //     const lng = row.original.lng;
                //     return (<img src={`https://maps.googleapis.com/maps/api/streetview?size=100x75&location=${lat},${lng}&key=AIzaSyCJKZm-rRtfREo2o-GNC-feqpbSvfHNB5s`} alt="Google Street View" className="img-responsive"  />);
                //   }
                // },
                {
                  Header: i18n._(t`Address`),
                  accessor: (d) => `${d.housenumber} ${d.streetname}`,
                  id: "address",
                  minWidth: 150,
                  style: {
                    textAlign: "left",
                  },
                },
                {
                  Header: i18n._(t`Zipcode`),
                  accessor: (d) => d.zip,
                  id: "zip",
                  width: 75,
                },
                {
                  Header: i18n._(t`Borough`),
                  accessor: (d) => d.boro,
                  id: "boro",
                },
                {
                  Header: "BBL",
                  accessor: (d) => d.bbl,
                  id: "bbl",
                },
              ],
            },
            {
              Header: i18n._(t`Information`),
              columns: [
                {
                  Header: i18n._(t`Built`),
                  accessor: (d) => d.yearbuilt,
                  id: "yearbuilt",
                  maxWidth: 75,
                },
                {
                  Header: i18n._(t`Units`),
                  accessor: (d) => d.unitsres,
                  id: "unitsres",
                  maxWidth: 75,
                },
                // ,
                // {
                //   Header: '421-a',
                //   accessor: 'subsidy421a'
                // },
                // {
                //   Header: '421-g',
                //   accessor: 'subsidy421g'
                // },
                // {
                //   Header: 'J-51',
                //   accessor: 'subsidyj51'
                // },
              ],
            },
            // {
            //   Header: 'Business Entities',
            //   accessor: 'corpnames',
            //   Cell: row => {
            //     return (<span>{row.original.corpnames ? row.original.corpnames.join(', ') : ''}</span>);
            //   }
            // },
            // {
            //   Header: 'People',
            //   accessor: 'ownernames',
            //   Cell: row => {
            //     return (
            //       <span>
            //           {row.original.ownernames ? row.original.ownernames.map(o => o.value).join(', ') : '' }
            //       </span>
            //     );
            //   }
            // },
            // {
            //   Header: 'Business Addresses',
            //   accessor: 'businessaddrs',
            //   Cell: row => {
            //     return (<span>{row.original.businessaddrs ? row.original.businessaddrs.join(', ') : '' }</span>);
            //   }
            // }
            {
              Header: i18n._(t`RS Units`),
              columns: [
                {
                  Header: "2007",
                  accessor: (d) => d.rsunits2007,
                  id: "rsunits2007",
                  maxWidth: 75,
                },
                {
                  Header: "2017",
                  accessor: (d) => d.rsunits2017,
                  id: "rsunits2017",
                  Cell: (row) => {
                    return (
                      <span
                        className={`${
                          row.original.rsunits2017 < row.original.rsunits2007 ? "text-danger" : ""
                        }`}
                      >
                        {row.original.rsunits2017}
                      </span>
                    );
                  },
                  maxWidth: 75,
                },
              ],
            },
            {
              Header: i18n._(t`HPD Violations`),
              columns: [
                {
                  Header: i18n._(t`Open`),
                  accessor: (d) => d.openviolations,
                  id: "openviolations",
                  maxWidth: 75,
                },
                {
                  Header: i18n._(t`Total`),
                  accessor: (d) => d.totalviolations,
                  id: "totalviolations",
                  maxWidth: 75,
                },
              ],
            },
            {
              Header: i18n._(t`Evictions`),
              columns: [
                {
                  Header: "2019",
                  accessor: (d) => (d.evictions ? parseInt(d.evictions) : null),
                  id: "evictions",
                  maxWidth: 75,
                },
              ],
            },
            {
              Header: i18n._(t`Landlord`),
              columns: [
                {
                  Header: i18n._(t`Officer/Owner`),
                  accessor: (d) => {
                    var owner = d.ownernames.find(
                      (o) => o.title === "HeadOfficer" || o.title === "IndividualOwner"
                    );
                    return owner ? owner.value : "";
                  },
                  id: "ownernames",
                  minWidth: 150,
                },
                // ,
                // {
                //   Header: "Change in RS",
                //   accessor: "totalviolations"
                // }
              ],
            },
            {
              Header: i18n._(t`Last Sale`),
              columns: [
                {
                  Header: i18n._(t`Date`),
                  accessor: (d) => d.lastsaledate,
                  Cell: (row) =>
                    row.original.lastsaledate
                      ? Helpers.formatDate(
                          row.original.lastsaledate,
                          { year: "numeric", month: "short", day: "numeric" },
                          locale
                        )
                      : null,
                  id: "lastsaledate",
                },
                {
                  Header: i18n._(t`Amount`),
                  accessor: (d) => (d.lastsaleamount ? parseInt(d.lastsaleamount) : null),
                  Cell: (row) =>
                    row.original.lastsaleamount
                      ? "$" + Helpers.formatPrice(locale, row.original.lastsaleamount)
                      : null,
                  id: "lastsaleamount",
                },
                {
                  Header: i18n._(t`Link to Deed`),
                  accessor: (d) => d.lastsaleacrisid,
                  Cell: (row) =>
                    row.original.lastsaleacrisid ? (
                      <a
                        href={`https://a836-acris.nyc.gov/DS/DocumentSearch/DocumentImageView?doc_id=${row.original.lastsaleacrisid}`}
                        className="btn"
                        target="_blank"
                        aria-label={i18n._(t`Link to Deed`)}
                        rel="noopener noreferrer"
                      >
                        <span style={{ padding: "0 3px" }}>&#8599;&#xFE0E;</span>
                      </a>
                    ) : null,
                  id: "lastsaleacrisid",
                },
                {
                  Header: i18n._(t`Group Sale?`),
                  accessor: (d) => {
                    // Make id's that are part of group sales show up first when sorted:
                    const idPrefix =
                      d.lastsaleacrisid && isPartOfGroupSale(d.lastsaleacrisid, props.addrs)
                        ? " "
                        : "";
                    return `${idPrefix}${d.lastsaleacrisid}`;
                  },
                  Cell: (row) =>
                    row.original.lastsaleacrisid
                      ? isPartOfGroupSale(row.original.lastsaleacrisid, props.addrs)
                        ? i18n._(t`Yes`)
                        : i18n._(t`No`)
                      : null,
                  id: "lastsaleisgroupsale",
                },
              ],
            },
            {
              Header: i18n._(t`View detail`),
              accessor: (d) => d.bbl,
              columns: [
                {
                  Cell: (row) => {
                    return (
                      <Link
                        to={props.generateBaseUrl()}
                        className="btn"
                        aria-label={i18n._(t`View detail`)}
                        onClick={() => props.onOpenDetail(row.original)}
                      >
                        <span style={{ padding: "0 3px" }}>&#10142;</span>
                      </Link>
                    );
                  },
                },
              ],
            },
          ]}
          style={{
            height: "100%",
          }}
          className="-striped -highlight"
        />
      </div>
    );
  }
};

const PropertiesList = withI18n()(PropertiesListWithoutI18n);

export default PropertiesList;
