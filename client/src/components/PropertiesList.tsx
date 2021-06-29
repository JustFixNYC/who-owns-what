import React from "react";
import ReactTable from "react-table";
import Browser from "../util/browser";

import "react-table/react-table.css";
import "styles/PropertiesList.css";

import withFixedColumns, { TablePropsColumnFixed } from "react-table-hoc-fixed-columns";
import "react-table-hoc-fixed-columns/lib/styles.css"; // important: this line must be placed after react-table css import

import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";
import { t } from "@lingui/macro";
import { Link } from "react-router-dom";
import { SupportedLocale } from "../i18n-base";
import Helpers, { longDateOptions } from "../util/helpers";
import { AddressRecord, HpdComplaintCount } from "./APIDataTypes";
import { withMachineInStateProps } from "state-machine";
import { AddressPageRoutes } from "routes";

export const isPartOfGroupSale = (saleId: string, addrs: AddressRecord[]) => {
  const addrsWithMatchingSale = addrs.filter((addr) => addr.lastsaleacrisid === saleId);
  return addrsWithMatchingSale.length > 1;
};

const findMostCommonType = (complaints: HpdComplaintCount[] | null) =>
  complaints && complaints.length > 0 && complaints[0].type;

/**
 * By default, the `withFixedColumns` hook retypes the Column components within the table
 * as having data arrays of type `unknown`, so this recasting is necessary to make sure
 * we are tyepchecking the raw data as `AddressRecords`
 */
const ReactTableFixedColumns = withFixedColumns(ReactTable) as React.ComponentType<
  Partial<TablePropsColumnFixed<AddressRecord, AddressRecord>>
>;

const PropertiesListWithoutI18n: React.FC<
  withMachineInStateProps<"portfolioFound"> & {
    i18n: I18n;
    onOpenDetail: (bbl: string) => void;
    addressPageRoutes: AddressPageRoutes;
  }
> = (props) => {
  const { i18n } = props;
  const locale = (i18n.language as SupportedLocale) || "en";

  const addrs = props.state.context.portfolioData.assocAddrs;
  const rsunitslatestyear = props.state.context.portfolioData.searchAddr.rsunitslatestyear;

  return (
    <div className="PropertiesList">
      <ReactTableFixedColumns
        data={addrs}
        minRows={Browser.isMobile() ? 5 : 10}
        defaultPageSize={addrs.length}
        showPagination={false}
        columns={[
          {
            fixed: "left",
            columns: [
              {
                Header: i18n._(t`Address`) + " ⇅",
                accessor: (d) => `${d.housenumber} ${d.streetname}`,
                id: "address",
                minWidth: 130,
                fixed: "left",
                style: {
                  textAlign: "left",
                  whiteSpace: "unset",
                },
              },
            ],
          },
          {
            Header: i18n._(t`Location`),
            columns: [
              {
                Header: i18n._(t`Zipcode`) + " ⇅",
                accessor: (d) => d.zip,
                id: "zip",
                width: 85,
              },
              {
                Header: i18n._(t`Borough`) + " ⇅",
                accessor: (d) => d.boro,
                id: "boro",
              },
              {
                Header: "BBL ⇅",
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
                Header: rsunitslatestyear,
                accessor: (d) => d.rsunitslatest,
                id: "rsunitslatest",
                Cell: (row) => {
                  return (
                    <span
                      className={`${
                        row.original.rsunitslatest < row.original.rsunits2007 ? "text-danger" : ""
                      }`}
                    >
                      {row.original.rsunitslatest}
                    </span>
                  );
                },
                maxWidth: 75,
              },
            ],
          },
          {
            Header: i18n._(t`HPD Complaints`),
            columns: [
              {
                Header: i18n._(t`Total`),
                accessor: (d) => d.totalcomplaints,
                id: "totalcomplaints",
                maxWidth: 75,
              },
              {
                Header: i18n._(t`Last 3 Years`),
                accessor: (d) => d.recentcomplaints,
                id: "recentcomplaints",
                maxWidth: 100,
              },
              {
                Header: i18n._(t`Top Complaint`),
                accessor: (d) => {
                  const mostCommonType = findMostCommonType(d.recentcomplaintsbytype);
                  return mostCommonType
                    ? Helpers.translateComplaintType(mostCommonType, i18n)
                    : null;
                },
                id: "recentcomplaintsbytype",
                minWidth: 150,
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
                Header: i18n._(t`Since 2017`),
                accessor: (d) => d.evictions || null,
                id: "evictions",
                maxWidth: 100,
              },
            ],
          },
          {
            Header: i18n._(t`Landlord`),
            columns: [
              {
                Header: i18n._(t`Officer/Owner`),
                accessor: (d) => {
                  var owner =
                    d.ownernames &&
                    d.ownernames.find(
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
                accessor: (d) => d.lastsaleamount || null,
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
                    d.lastsaleacrisid && isPartOfGroupSale(d.lastsaleacrisid, addrs) ? " " : "";
                  return `${idPrefix}${d.lastsaleacrisid}`;
                },
                Cell: (row) =>
                  row.original.lastsaleacrisid
                    ? isPartOfGroupSale(row.original.lastsaleacrisid, addrs)
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
                      to={props.addressPageRoutes.overview}
                      className="btn"
                      aria-label={i18n._(t`View detail`)}
                      onClick={() => props.onOpenDetail(row.original.bbl)}
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
};

const PropertiesList = withI18n()(PropertiesListWithoutI18n);

export default PropertiesList;
