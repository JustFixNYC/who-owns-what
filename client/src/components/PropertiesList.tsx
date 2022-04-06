import React, { useEffect, useRef, useState } from "react";
import ReactTable from "react-table";
import Browser from "../util/browser";
import Loader from "../components/Loader";

import "react-table/react-table.css";
import "styles/PropertiesList.css";

import withFixedColumns, { TablePropsColumnFixed } from "react-table-hoc-fixed-columns";
import "react-table-hoc-fixed-columns/lib/styles.css"; // important: this line must be placed after react-table css import

import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";
import { t, Trans } from "@lingui/macro";
import { Link } from "react-router-dom";
import { defaultLocale, SupportedLocale } from "../i18n-base";
import Helpers, { longDateOptions } from "../util/helpers";
import { AddressRecord, HpdComplaintCount } from "./APIDataTypes";
import { withMachineInStateProps } from "state-machine";
import { AddressPageRoutes } from "routes";
import classnames from "classnames";

export const isPartOfGroupSale = (saleId: string, addrs: AddressRecord[]) => {
  const addrsWithMatchingSale = addrs.filter((addr) => addr.lastsaleacrisid === saleId);
  return addrsWithMatchingSale.length > 1;
};

const formatAbatementStartYear = (year: number | null, i18n: I18n) => {
  const thisYear = new Date().getFullYear();
  if (!year) return null;
  return year > thisYear ? i18n._(t`Starts ${year}`) : i18n._(t`Since ${year}`);
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

const ArrowIcon = () => (
  <span className="arrow-icon">
    ↑<span>↓</span>
  </span>
);

const getWidthFromLabel = (label: string, customDefaultWidth?: number) => {
  const MIN_WIDTH = customDefaultWidth || 70;
  const LETTER_WIDTH = 7;
  const ARROW_ICON_WIDTH = 20;
  const MARGIN_OFFSET = 10;

  return Math.max(label.length * LETTER_WIDTH + ARROW_ICON_WIDTH + MARGIN_OFFSET, MIN_WIDTH);
};

const FIRST_COLUMN_WIDTH = 130;
const HEADER_HEIGHT = 30;

const MAX_TABLE_ROWS_PER_PAGE = 500;

const secondColumnStyle = {
  marginLeft: `${FIRST_COLUMN_WIDTH}px`,
};

const PropertiesListWithoutI18n: React.FC<
  withMachineInStateProps<"portfolioFound"> & {
    i18n: I18n;
    onOpenDetail: (bbl: string) => void;
    addressPageRoutes: AddressPageRoutes;
  }
> = (props) => {
  const { i18n } = props;
  const { width: windowWidth, height: windowHeight } = Helpers.useWindowSize();
  const locale = (i18n.language as SupportedLocale) || defaultLocale;

  const addrs = props.state.context.portfolioData.assocAddrs;
  const rsunitslatestyear = props.state.context.portfolioData.searchAddr.rsunitslatestyear;

  const lastColumnRef = useRef<HTMLDivElement>(null);
  const isLastColumnVisible = Helpers.useOnScreen(lastColumnRef);
  /**
   * For older browsers that do not support the `useOnScreen` hook,
   * let's hide the dynamic scroll fade by default.
   */
  const isOlderBrowser = typeof IntersectionObserver === "undefined";
  /**
   * Let's hide the fade out on the right edge of the table if:
   * - We've scrolled to the last column OR
   * - We're using an older browser that cannot detect where we've scrolled
   */
  const hideScrollFade = isOlderBrowser || isLastColumnVisible;

  const tableRef = useRef<HTMLDivElement>(null);
  const isTableVisible = Helpers.useOnScreen(tableRef);

  // On most browsers, the header has the `position: fixed` CSS property
  // and needs a defined `top` property along with it.
  // So, let's keep track of and also update this top spacing whenever the layout of the page changes.
  const [headerTopSpacing, setHeaderTopSpacing] = useState<number | undefined>();

  // Make sure to setHeaderTopSpacing whenever
  // - the table comes into view
  // - the page's locale changes
  // - the user resizes their viewport window
  //
  // For older browsers, let's not even bother setting the top spacing as
  // we won't be able to detect when the table becomes visible. Luckily,
  // the `react-table-hoc-fixed-columns` packages has fallback CSS for these browsers.
  useEffect(() => {
    if (!isOlderBrowser && tableRef?.current?.offsetTop)
      setHeaderTopSpacing(tableRef.current.offsetTop);
  }, [isTableVisible, locale, windowWidth, windowHeight, isOlderBrowser]);
  return (
    <div
      className={classnames("PropertiesList", hideScrollFade && "hide-scroll-fade")}
      ref={tableRef}
    >
      {isTableVisible ? (
        <TableOfData
          addrs={addrs}
          headerTopSpacing={headerTopSpacing}
          i18n={i18n}
          locale={locale}
          rsunitslatestyear={rsunitslatestyear}
          onOpenDetail={props.onOpenDetail}
          addressPageRoutes={props.addressPageRoutes}
          ref={lastColumnRef}
        />
      ) : (
        <Loader loading={true} classNames="Loader-map">
          {addrs.length > MAX_TABLE_ROWS_PER_PAGE ? (
            <>
              <Trans>Loading {addrs.length} rows</Trans>
              <br />
              <Trans>(this may take a while)</Trans>
            </>
          ) : (
            <Trans>Loading</Trans>
          )}
        </Loader>
      )}
    </div>
  );
};

type TableOfDataProps = {
  addrs: AddressRecord[];
  headerTopSpacing: number | undefined;
  i18n: I18n;
  locale: SupportedLocale;
  rsunitslatestyear: number;
  onOpenDetail: (bbl: string) => void;
  addressPageRoutes: AddressPageRoutes;
};

/**
 * This component memoizes the portfolio table via React.memo
 * in an attempt to improve performance, particularly on IE11.
 */
const TableOfData = React.memo(
  React.forwardRef<HTMLDivElement, TableOfDataProps>((props, lastColumnRef) => {
    const { addrs, headerTopSpacing, i18n, locale, rsunitslatestyear } = props;

    return (
      <ReactTableFixedColumns
        data={addrs}
        minRows={10}
        defaultPageSize={addrs.length}
        showPagination={addrs.length > MAX_TABLE_ROWS_PER_PAGE}
        pageSize={MAX_TABLE_ROWS_PER_PAGE}
        showPageSizeOptions={false}
        resizable={!Browser.isMobile()}
        columns={[
          {
            fixed: "left",
            headerStyle: {
              height: `${HEADER_HEIGHT}px`,
              ...(!!headerTopSpacing && {
                top: `${headerTopSpacing}px`,
              }),
            },
            columns: [
              {
                Header: (
                  <div>
                    <Trans>Address</Trans>
                    <ArrowIcon />
                  </div>
                ),
                headerStyle: {
                  ...(!!headerTopSpacing && {
                    top: `${headerTopSpacing + HEADER_HEIGHT}px`,
                  }),
                },
                accessor: (d) => `${d.housenumber} ${d.streetname}`,
                id: "address",
                width: FIRST_COLUMN_WIDTH,
                fixed: "left",
                resizable: false,
                Cell: (row) => {
                  return (
                    <Link
                      to={props.addressPageRoutes.overview}
                      onClick={() => props.onOpenDetail(row.original.bbl)}
                    >
                      {row.original.housenumber} {row.original.streetname}
                    </Link>
                  );
                },
                style: {
                  textAlign: "left",
                  whiteSpace: "unset",
                  paddingRight: "0.75rem",
                },
              },
            ],
          },
          {
            Header: i18n._(t`Location`),
            headerStyle: secondColumnStyle,
            style: secondColumnStyle,
            columns: [
              {
                Header: (
                  <>
                    <Trans>Zipcode</Trans>
                    <ArrowIcon />
                  </>
                ),
                accessor: (d) => d.zip,
                id: "zip",
                width: getWidthFromLabel(i18n._(t`Zipcode`)),
                headerStyle: secondColumnStyle,
              },
              {
                Header: (
                  <>
                    <Trans>Borough</Trans>
                    <ArrowIcon />
                  </>
                ),
                accessor: (d) => d.boro,
                id: "boro",
                width: getWidthFromLabel(i18n._(t`Borough`)),
              },
              {
                Header: (
                  <>
                    BBL
                    <ArrowIcon />
                  </>
                ),
                accessor: (d) => d.bbl,
                id: "bbl",
                width: getWidthFromLabel("BBL", 100),
                Cell: (row) => {
                  return (
                    <Link
                      to={props.addressPageRoutes.overview}
                      onClick={() => props.onOpenDetail(row.original.bbl)}
                    >
                      {row.original.bbl}
                    </Link>
                  );
                },
              },
            ],
          },
          {
            Header: i18n._(t`Information`),
            columns: [
              {
                Header: (
                  <>
                    <Trans>Built</Trans>
                    <ArrowIcon />
                  </>
                ),
                accessor: (d) => d.yearbuilt,
                id: "yearbuilt",
                width: getWidthFromLabel(i18n._(t`Built`)),
              },
              {
                Header: (
                  <>
                    <Trans>Units</Trans>
                    <ArrowIcon />
                  </>
                ),
                accessor: (d) => d.unitsres,
                id: "unitsres",
                width: getWidthFromLabel(i18n._(t`Units`)),
              },
            ],
          },
          {
            Header: i18n._(t`RS Units`),
            columns: [
              {
                Header: (
                  <>
                    2007
                    <ArrowIcon />
                  </>
                ),
                accessor: (d) => d.rsunits2007,
                id: "rsunits2007",
                width: getWidthFromLabel("2007"),
              },
              {
                Header: (
                  <>
                    {rsunitslatestyear}
                    <ArrowIcon />
                  </>
                ),
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
                width: getWidthFromLabel("XXXX"),
              },
            ],
          },
          {
            Header: i18n._(t`HPD Complaints`),
            columns: [
              {
                Header: (
                  <>
                    <Trans>Total</Trans>
                    <ArrowIcon />
                  </>
                ),
                accessor: (d) => d.totalcomplaints,
                id: "totalcomplaints",
                width: getWidthFromLabel(i18n._(t`Total`)),
              },
              {
                Header: (
                  <>
                    <Trans>Last 3 Years</Trans>
                    <ArrowIcon />
                  </>
                ),
                accessor: (d) => d.recentcomplaints,
                id: "recentcomplaints",
                width: getWidthFromLabel(i18n._(t`Last 3 Years`)),
              },
              {
                Header: (
                  <>
                    <Trans>Top Complaint</Trans>
                    <ArrowIcon />
                  </>
                ),
                accessor: (d) => {
                  const mostCommonType = findMostCommonType(d.recentcomplaintsbytype);
                  return mostCommonType
                    ? Helpers.translateComplaintType(mostCommonType, i18n)
                    : null;
                },
                id: "recentcomplaintsbytype",
                width: getWidthFromLabel(i18n._(t`Top Complaint`)),
                style: {
                  whiteSpace: "unset",
                },
              },
            ],
          },
          {
            Header: i18n._(t`HPD Violations`),
            columns: [
              {
                Header: (
                  <>
                    <Trans>Open</Trans>
                    <ArrowIcon />
                  </>
                ),
                accessor: (d) => d.openviolations,
                id: "openviolations",
                width: getWidthFromLabel(i18n._(t`Open`), 85),
              },
              {
                Header: (
                  <>
                    <Trans>Total</Trans>
                    <ArrowIcon />
                  </>
                ),
                accessor: (d) => d.totalviolations,
                id: "totalviolations",
                width: getWidthFromLabel(i18n._(t`Total`), 85),
              },
            ],
          },
          {
            Header: i18n._(t`Evictions`),
            columns: [
              {
                Header: (
                  <>
                    <Trans>Since 2017</Trans>
                    <ArrowIcon />
                  </>
                ),
                accessor: (d) => d.evictions || null,
                id: "evictions",
                width: getWidthFromLabel(i18n._(t`Since 2017`)),
              },
            ],
          },
          {
            Header: i18n._(t`Landlord`),
            columns: [
              {
                Header: (
                  <>
                    <Trans>Officer/Owner</Trans>
                    <ArrowIcon />
                  </>
                ),
                accessor: (d) => {
                  var owner =
                    d.ownernames &&
                    d.ownernames.find(
                      (o) =>
                        o.title === "HeadOfficer" ||
                        o.title === "IndividualOwner" ||
                        o.title === "JointOwner"
                    );
                  return owner ? owner.value : "";
                },
                id: "ownernames",
                width: getWidthFromLabel(i18n._(t`Officer/Owner`), 100),
                style: {
                  whiteSpace: "unset",
                },
              },
            ],
          },
          {
            Header: i18n._(t`Tax Exemptions`),
            columns: [
              {
                Header: (
                  <>
                    J-51
                    <ArrowIcon />
                  </>
                ),
                accessor: (d) => formatAbatementStartYear(d.yearstartedj51, i18n),
                id: "yearstartedj51",
                style: {
                  whiteSpace: "unset",
                },
              },
              {
                Header: (
                  <>
                    421a
                    <ArrowIcon />
                  </>
                ),
                accessor: (d) => formatAbatementStartYear(d.yearstarted421a, i18n),
                id: "yearstarted421a",
                style: {
                  whiteSpace: "unset",
                },
              },
            ],
          },
          {
            Header: i18n._(t`Last Sale`),
            columns: [
              {
                Header: (
                  <>
                    <Trans>Date</Trans>
                    <ArrowIcon />
                  </>
                ),
                accessor: (d) => d.lastsaledate,
                Cell: (row) =>
                  row.original.lastsaledate
                    ? Helpers.formatDate(row.original.lastsaledate, longDateOptions, locale)
                    : null,
                id: "lastsaledate",
                width: getWidthFromLabel(i18n._(t`Date`), 100),
              },
              {
                Header: (
                  <>
                    <Trans>Amount</Trans>
                    <ArrowIcon />
                  </>
                ),
                accessor: (d) => d.lastsaleamount || null,
                Cell: (row) =>
                  row.original.lastsaleamount
                    ? "$" + Helpers.formatPrice(row.original.lastsaleamount, locale)
                    : null,
                id: "lastsaleamount",
                width: getWidthFromLabel(i18n._(t`Amount`), 100),
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
                width: getWidthFromLabel(i18n._(t`Link to Deed`)),
              },
              {
                Header: (
                  <>
                    <Trans>Group Sale?</Trans>
                    <ArrowIcon />
                  </>
                ),
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
                width: getWidthFromLabel(i18n._(t`Group Sale?`)),
              },
            ],
          },
          {
            Header: (
              <div ref={lastColumnRef}>
                <Trans>View detail</Trans>
              </div>
            ),
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
                width: getWidthFromLabel(i18n._(t`View detail`)),
              },
            ],
          },
        ]}
        style={{
          height: "100%",
        }}
        className="-striped -highlight"
      />
    );
  })
);

const PropertiesList = withI18n()(PropertiesListWithoutI18n);

export default PropertiesList;
