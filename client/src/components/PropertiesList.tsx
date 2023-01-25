import React, { useEffect, useRef, useState } from "react";
// import Browser from "../util/browser";
import Loader from "./Loader";

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
import { logAmplitudeEvent } from "./Amplitude";
import { Multiselect } from "./multiselect-dropdown/multiselect/Multiselect";
import { CheckIcon, ChevronIcon } from "./Icons";

import {
  Column,
  Table,
  useReactTable,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel,
  FilterFn,
  ColumnDef,
  flexRender,
  filterFns,
  PaginationState,
} from "@tanstack/react-table";

import "styles/PropertiesList.css";

// TODO: add column resizing (check with team if that's still useful)

const currencyFormater = new Intl.NumberFormat("en-us", {
  currency: "USD",
  style: "currency",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatCurrency = (x: number | null): string | null => {
  return x == null ? null : currencyFormater.format(x);
};

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

type ArrowIconProps = {
  dir: "up" | "down" | "both";
};

const ArrowIcon = (props: ArrowIconProps) => (
  <span className="arrow-icon">
    {props.dir === "up" ? (
      <span>↑</span>
    ) : props.dir === "down" ? (
      <span>↓</span>
    ) : (
      <>
        ↑<span>↓</span>
      </>
    )}
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
const MAX_TABLE_ROWS_PER_PAGE = 100; // was 500, but that seems like a lot

declare module "@tanstack/table-core" {
  interface FilterFns {
    arrIncludesSome: FilterFn<unknown>;
    inNumberRange: FilterFn<unknown>;
    isNonZero: FilterFn<unknown>;
  }
}

const isNonZero: FilterFn<any> = (row, columnId, value, addMeta) =>
  value ? !!row.getValue(columnId) : true;

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

  // TODO: double check how this works with new v8 table
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
          data={addrs}
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
  data: AddressRecord[];
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
    const { data, i18n, locale, rsunitslatestyear } = props;

    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

    const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: MAX_TABLE_ROWS_PER_PAGE,
    });

    const pagination = React.useMemo(
      () => ({
        pageIndex,
        pageSize,
      }),
      [pageIndex, pageSize]
    );

    const columns = React.useMemo<ColumnDef<AddressRecord, any>[]>(
      () => [
        {
          accessorFn: (row) => `${row.housenumber} ${row.streetname}`,
          id: "address",
          header: () => i18n._(t`Address`),
          cell: ({ row }) => {
            return (
              <Link
                to={props.addressPageRoutes.overview}
                onClick={() => props.onOpenDetail(row.original.bbl)}
              >
                {row.original.housenumber} {row.original.streetname}
              </Link>
            );
          },
          footer: (props) => props.column.id,
          size: FIRST_COLUMN_WIDTH,
          enableColumnFilter: false,
        },
        {
          header: i18n._(t`Location`),
          footer: (props) => props.column.id,
          columns: [
            {
              accessorKey: "zip",
              header: i18n._(t`Zipcode`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Zipcode`)),
              enableColumnFilter: false,
              filterFn: "arrIncludesSome",
            },
            {
              accessorKey: "boro",
              header: i18n._(t`Borough`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Borough`)),
              enableColumnFilter: false,
            },
            {
              accessorKey: "bbl",
              header: "BBL",
              cell: ({ row }) => {
                return (
                  <Link
                    to={props.addressPageRoutes.overview}
                    onClick={() => props.onOpenDetail(row.original.bbl)}
                  >
                    {row.original.bbl}
                  </Link>
                );
              },
              footer: (props) => props.column.id,
              size: getWidthFromLabel("BBL", 100),
              enableColumnFilter: false,
            },
            {
              accessorKey: "council",
              header: i18n._(t`Council`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Council`)),
              enableColumnFilter: false,
            },
          ],
        },
        {
          header: i18n._(t`Information`),
          footer: (props) => props.column.id,
          columns: [
            {
              accessorKey: "yearbuilt",
              header: i18n._(t`Built`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Built`)),
              enableColumnFilter: false,
            },
            {
              accessorKey: "unitsres",
              header: i18n._(t`Units`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Units`)),
              enableColumnFilter: false,
              filterFn: "inNumberRange",
            },
          ],
        },
        {
          header: i18n._(t`RS Units`),
          footer: (props) => props.column.id,
          columns: [
            {
              accessorKey: "rsunits2007",
              header: "2007",
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel("2007"),
              enableColumnFilter: false,
            },
            {
              accessorKey: "rsunitslatest",
              header: rsunitslatestyear,
              cell: ({ row }) => {
                return (
                  <span
                    className={`${
                      // TODO: double check this works with nulls
                      row.original.rsunitslatest! < row.original.rsunits2007! ?? false
                        ? "text-danger"
                        : ""
                    }`}
                  >
                    {row.original.rsunitslatest}
                  </span>
                );
              },
              footer: (props) => props.column.id,
              size: getWidthFromLabel("XXXX"),
              enableColumnFilter: false,
              filterFn: "isNonZero",
            },
          ],
        },
        {
          header: i18n._(t`HPD Complaints`),
          footer: (props) => props.column.id,
          columns: [
            {
              accessorKey: "totalcomplaints",
              header: i18n._(t`Total`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Total`)),
              enableColumnFilter: false,
            },
            {
              accessorKey: "recentcomplaints",
              header: i18n._(t`Last 3 Years`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Last 3 Years`)),
              enableColumnFilter: false,
            },
            {
              accessorKey: "recentcomplaintsbytype",
              header: i18n._(t`Top Complaint`),
              cell: ({ row }) => {
                const mostCommonType = findMostCommonType(row.original.recentcomplaintsbytype);
                return mostCommonType ? Helpers.translateComplaintType(mostCommonType, i18n) : null;
              },
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Top Complaint`)),
              enableColumnFilter: false,
            },
          ],
        },
        {
          header: i18n._(t`HPD Violations`),
          footer: (props) => props.column.id,
          columns: [
            {
              accessorKey: "openviolations",
              header: i18n._(t`Open`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Open`), 85),
              enableColumnFilter: false,
            },
            {
              accessorKey: "totalviolations",
              header: i18n._(t`Total`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Total`), 85),
              enableColumnFilter: false,
            },
          ],
        },
        {
          header: i18n._(t`Evictions Since 2017`),
          footer: (props) => props.column.id,
          size: getWidthFromLabel(i18n._(t`Evictions Since 2017`)),
          columns: [
            {
              accessorFn: (row) => row.evictionfilings || null,
              id: "evictionfilings",
              header: i18n._(t`Filed`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Filed`)),
              enableColumnFilter: false,
            },
            {
              accessorFn: (row) => row.evictions || null,
              id: "evictions",
              header: i18n._(t`Executed`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Executed`)),
              enableColumnFilter: false,
            },
          ],
        },
        {
          header: i18n._(t`Landlord`),
          footer: (props) => props.column.id,
          columns: [
            {
              accessorFn: (row) => {
                var owner =
                  row.ownernames &&
                  row.ownernames.find(
                    (o) =>
                      o.title === "HeadOfficer" ||
                      o.title === "IndividualOwner" ||
                      o.title === "CorporateOwner" ||
                      o.title === "JointOwner"
                  );
                return owner ? owner.value : "";
              },
              id: "ownernames",
              header: i18n._(t`Officer/Owner`),
              cell: ({ row }) => {
                var owner =
                  row.original.ownernames &&
                  row.original.ownernames.find(
                    (o) =>
                      o.title === "HeadOfficer" ||
                      o.title === "IndividualOwner" ||
                      o.title === "CorporateOwner" ||
                      o.title === "JointOwner"
                  );
                return owner ? owner.value : "";
              },
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Officer/Owner`), 100),
              filterFn: "arrIncludesSome",
            },
          ],
        },
        {
          header: i18n._(t`Tax Exemptions`),
          footer: (props) => props.column.id,
          columns: [
            {
              accessorKey: "yearstartedj51",
              header: "J-51",
              cell: ({ row }) => formatAbatementStartYear(row.original.yearstartedj51, i18n),
              footer: (props) => props.column.id,
              size: 100,
              enableColumnFilter: false,
            },
            {
              accessorKey: "yearstarted421a",
              header: "421a",
              cell: ({ row }) => formatAbatementStartYear(row.original.yearstarted421a, i18n),
              footer: (props) => props.column.id,
              size: 100,
              enableColumnFilter: false,
            },
          ],
        },
        {
          header: i18n._(t`Last Sale`),
          footer: (props) => props.column.id,
          columns: [
            {
              accessorKey: "lastsaledate",
              header: i18n._(t`Date`),
              cell: ({ row }) =>
                row.original.lastsaledate
                  ? Helpers.formatDate(row.original.lastsaledate, longDateOptions, locale)
                  : null,
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Date`), 100),
              enableColumnFilter: false,
            },
            {
              accessorFn: (row) => formatCurrency(row.lastsaleamount),
              id: "lastsaleamount",
              header: i18n._(t`Amount`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Amount`), 100),
              enableColumnFilter: false,
            },
            {
              accessorKey: "lastsaleacrisid",
              header: i18n._(t`Link to Deed`),
              cell: ({ row }) =>
                row.original.lastsaleacrisid ? (
                  <a
                    onClick={() => {
                      logAmplitudeEvent("portfolioLinktoDeed");
                      window.gtag("event", "portfolio-link-to-deed");
                    }}
                    href={`https://a836-acris.nyc.gov/DS/DocumentSearch/DocumentImageView?doc_id=${row.original.lastsaleacrisid}`}
                    className="btn"
                    target="_blank"
                    aria-label={i18n._(t`Link to Deed`)}
                    rel="noopener noreferrer"
                  >
                    <span style={{ padding: "0 3px" }}>&#8599;&#xFE0E;</span>
                  </a>
                ) : null,
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Link to Deed`)),
              enableColumnFilter: false,
            },
            {
              accessorFn: (row) => {
                // Make id's that are part of group sales show up first when sorted:
                const idPrefix =
                  row.lastsaleacrisid && isPartOfGroupSale(row.lastsaleacrisid, data) ? " " : "";
                return `${idPrefix}${row.lastsaleacrisid}`;
              },
              id: "lastsaleisgroupsale",
              header: i18n._(t`Group Sale?`),
              cell: ({ row }) =>
                row.original.lastsaleacrisid
                  ? isPartOfGroupSale(row.original.lastsaleacrisid, data)
                    ? i18n._(t`Yes`)
                    : i18n._(t`No`)
                  : null,
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Group Sale?`)),
              enableColumnFilter: false,
            },
            {
              accessorKey: "bbl",
              id: "detail",
              header: (
                <div ref={lastColumnRef} style={{ float: "left" }}>
                  <Trans>View detail</Trans>
                </div>
              ),
              cell: ({ row }) => (
                <Link
                  to={props.addressPageRoutes.overview}
                  className="btn"
                  aria-label={i18n._(t`View detail`)}
                  onClick={() => {
                    props.onOpenDetail(row.original.bbl);
                    logAmplitudeEvent("portfolioViewDetail");
                    window.gtag("event", "portfolio-view-detail");
                  }}
                >
                  <span style={{ padding: "0 3px" }}>&#10142;</span>
                </Link>
              ),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`View detail`)),
              enableColumnFilter: false,
            },
          ],
        },
      ],
      [data, i18n, lastColumnRef, locale, rsunitslatestyear, props]
    );

    const table = useReactTable({
      data,
      columns,
      filterFns: {
        arrIncludesSome: filterFns.arrIncludesSome,
        inNumberRange: filterFns.inNumberRange,
        isNonZero: isNonZero,
      },
      state: {
        columnFilters,
        pagination,
      },
      onPaginationChange: setPagination,
      onColumnFiltersChange: setColumnFilters,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
      getFacetedMinMaxValues: getFacetedMinMaxValues(),
      debugTable: true,
      debugHeaders: true,
      debugColumns: false,
    });

    React.useEffect(() => {
      if (table.getState().columnFilters[0]?.id === "ownernames") {
        if (table.getState().sorting[0]?.id !== "ownernames") {
          table.setSorting([{ id: "ownernames", desc: false }]);
        }
      }
      //   eslint-disable-next-line
    }, [table.getState().columnFilters[0]?.id]);

    const totalBuildings = table.getCoreRowModel().flatRows.length;
    const filteredBuildings = table.getFilteredRowModel().flatRows.length;

    return (
      <>
        <div className="filter-bar">
          <div className="filter-for">
            <div className="pill-new">new</div>
            <Trans>
              Filter <br />
              for
            </Trans>
            :
          </div>
          <div className="filters-container">
            <div className="filters">
              <ToggleFilter
                column={table.getColumn("rsunitslatest")}
                table={table}
                className="filter-toggle"
              >
                <Trans>Rent Stabilized Units</Trans>
              </ToggleFilter>
              <details className="filter-accordian" id="landlord-filter-accordian">
                <summary>
                  <Trans>Landlord</Trans>
                  <ChevronIcon className="chevonIcon" />
                </summary>
                <div className="dropdown-container">
                  <span className="filter-subtitle">
                    <Trans>Officer/Owner</Trans>
                  </span>
                  <MultiSelectFilter
                    column={table.getColumn("ownernames")}
                    table={table}
                    onApply={() =>
                      document.querySelector("#landlord-filter-accordian")!.removeAttribute("open")
                    }
                  />
                </div>
              </details>
              <details className="filter-accordian">
                <summary>
                  <Trans>Units</Trans>
                  <ChevronIcon className="chevonIcon" />
                </summary>
                <MinMaxFilter column={table.getColumn("unitsres")} table={table} />
              </details>
              <details className="filter-accordian" id="zipcode-filter-accordian">
                <summary>
                  <Trans>Zipcode</Trans>
                  <ChevronIcon className="chevonIcon" />
                </summary>
                <MultiSelectFilter
                  column={table.getColumn("zip")}
                  table={table}
                  onApply={() =>
                    document.querySelector("#zipcode-filter-accordian")!.removeAttribute("open")
                  }
                />
              </details>
            </div>
            {/* TODO: what if all properties in portfolio are selected by applied filters? Need another way to know when filters are active */}
            {totalBuildings !== filteredBuildings && (
              <div className="filter-status">
                <span className="results-count">
                  <Trans>Showing {filteredBuildings} results</Trans>
                </span>
                <button className="data-issue">
                  <Trans>Notice an inaccuracy? Click here.</Trans>
                </button>
                <button className="clear-filters">
                  <Trans>Clear Filters</Trans>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="portfolio-table-container">
          <table>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        className={`col-${header.column.id}`}
                        style={{ minWidth: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : (
                          <>
                            <div
                              {...{
                                className: header.column.getCanSort()
                                  ? "cursor-pointer select-none"
                                  : "",
                                onClick: header.column.getToggleSortingHandler(),
                              }}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {headerGroup.depth === 1
                                ? {
                                    asc: <ArrowIcon dir={"up"} />,
                                    desc: <ArrowIcon dir={"down"} />,
                                  }[header.column.getIsSorted() as string] ?? (
                                    <ArrowIcon dir={"both"} />
                                  )
                                : null}
                            </div>
                          </>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, i) => {
                return (
                  <tr key={row.id} className={`row-${i % 2 ? "even" : "odd"}`}>
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <td
                          key={cell.id}
                          className={`col-${cell.column.id}`}
                          style={{
                            width: cell.column.getSize() !== 0 ? cell.column.getSize() : undefined,
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="pagination">
            <div className="prev">
              <button
                className="page-btn"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                {i18n._(t`Previous`)}
              </button>
            </div>
            <div className="center">
              <span className="page-info">
                <span>
                  <Trans>Page</Trans>
                </span>
                <div>
                  <input
                    type="number"
                    value={String(table.getState().pagination.pageIndex + 1)}
                    onChange={(e) => {
                      const page = e.target.value ? Number(e.target.value) - 1 : 0;
                      table.setPageIndex(page);
                    }}
                  />
                </div>
                <Trans>of</Trans> <span className="total-pages">{table.getPageCount()}</span>
              </span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
              >
                {[10, 20, 50, 100, 500].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    Show {pageSize}
                  </option>
                ))}
              </select>
            </div>
            <div className="next">
              <button
                className="page-btn"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                {i18n._(t`Next`)}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  })
);

function MultiSelectFilter({
  column,
  table,
  onApply,
}: {
  column: Column<any, unknown>;
  table: Table<any>;
  onApply: () => void;
}) {
  const sortedUniqueValues = React.useMemo(
    () => Array.from(column.getFacetedUniqueValues().keys()).sort(),
    [column.getFacetedUniqueValues()] // eslint-disable-line
  );

  return (
    <Multiselect
      options={sortedUniqueValues.slice(0, 5000).map((value: any) => ({ name: value, id: value }))}
      displayValue="name"
      placeholder={`Search... (${column.getFacetedUniqueValues().size})`}
      // onSelect={(selectedList: any) =>
      //   column.setFilterValue(selectedList.map((item: any) => item.name))
      // }
      // onRemove={(selectedList: any) =>
      //   column.setFilterValue(selectedList.map((item: any) => item.name))
      // }
      onApply={(selectedList: any) => {
        column.setFilterValue(selectedList.map((item: any) => item.name));
        onApply();
      }}
    />
  );
}

function MinMaxFilter({ column, table }: { column: Column<any, unknown>; table: Table<any> }) {
  return (
    <div>
      <DebouncedInput
        type="number"
        min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
        max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
        value={""}
        onChange={(value) => column.setFilterValue((old: any) => [value, old?.[1]])}
        placeholder={`Min ${
          column.getFacetedMinMaxValues()?.[0] ? `(${column.getFacetedMinMaxValues()?.[0]})` : ""
        }`}
      />
      <DebouncedInput
        type="number"
        min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
        max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
        value={""}
        onChange={(value) => column.setFilterValue((old: any) => [old?.[0], value])}
        placeholder={`Max ${
          column.getFacetedMinMaxValues()?.[1] ? `(${column.getFacetedMinMaxValues()?.[1]})` : ""
        }`}
      />
    </div>
  );
}

function ToggleFilter({
  column,
  table,
  children,
  className,
}: {
  column: Column<any, unknown>;
  table: Table<any>;
  children: React.ReactNode;
  className?: string;
}) {
  let [isPressed, setIsPressed] = useState(false);

  const toggleIsPressed = () => {
    column.setFilterValue(!isPressed);
    setIsPressed(!isPressed);
  };

  return (
    <button aria-pressed={isPressed} onClick={toggleIsPressed} className={className}>
      <div className="checkbox">{isPressed && <CheckIcon />}</div>
      {children}
    </button>
  );
}

// A debounced input react component
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return <input {...props} value={value} onChange={(e) => setValue(e.target.value)} />;
}

const PropertiesList = withI18n()(PropertiesListWithoutI18n);

export default PropertiesList;
