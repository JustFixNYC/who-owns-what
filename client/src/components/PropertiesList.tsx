import React from "react";
import ReactTable from "react-table";
import Browser from "../util/browser";

import "react-table/react-table.css";
import "styles/PropertiesList.css";
import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";
import { t } from "@lingui/macro";
import { Link } from "react-router-dom";
import { SupportedLocale } from "../i18n-base";
import Helpers, { longDateOptions } from "../util/helpers";
import { AddressRecord } from "./APIDataTypes";

export const isPartOfGroupSale = (saleId: string, addrs: AddressRecord[]) => {
  const addrsWithMatchingSale = addrs.filter((addr) => addr.lastsaleacrisid === saleId);
  return addrsWithMatchingSale.length > 1;
};

const PropertiesListWithoutI18n: React.FC<{
  i18n: I18n;
  addrs: AddressRecord[];
  onOpenDetail: (addr: AddressRecord) => void;
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
            {
              Header: i18n._(t`Location`),
              columns: [
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
              ],
            },
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
                  accessor: (d) => d.evictions || null,
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
                    var owner = d.ownernames?.find(
                      (o) => o.title === "HeadOfficer" || o.title === "IndividualOwner"
                    );
                    return owner ? owner.value : "";
                  },
                  id: "ownernames",
                  minWidth: 150,
                },
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
                      ? Helpers.formatDate(row.original.lastsaledate, longDateOptions, locale)
                      : null,
                  id: "lastsaledate",
                },
                {
                  Header: i18n._(t`Amount`),
                  accessor: (d) => d.lastsaleamount,
                  Cell: (row) =>
                    row.original.lastsaleamount
                      ? "$" + Helpers.formatPrice(row.original.lastsaleamount, locale)
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
